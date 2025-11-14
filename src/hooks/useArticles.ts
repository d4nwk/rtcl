// src/hooks/useArticles.ts
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  hydrateSessionCache, makeKey, getCached, setCached, withDedup
} from "@/lib/sessionCache";

type Article = {
  id: string;
  title: string;
  // ...your fields
};
type FetchArgs = {
  language: string;
  outlets?: string[];   // etc.
};
type UseArticlesOpts = {
  ttlMs?: number;
};

async function fetchArticles(args: FetchArgs): Promise<Article[]> {
  // 👇 replace with your real fetch (RSS/endpoint)
  const q = new URLSearchParams({ lang: args.language, outlets: (args.outlets||[]).join(",") });
  const res = await fetch(`/api/articles?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load articles");
  return res.json();
}

export function useArticles(args: FetchArgs, opts: UseArticlesOpts = {}) {
  const ttl = opts.ttlMs ?? 5 * 60 * 1000;
  const key = useMemo(() => makeKey(args), [JSON.stringify(args)]);

  const [data, setData] = useState<Article[] | undefined>(() => {
    if (typeof window === "undefined") return;
    hydrateSessionCache();
    return getCached<Article[]>(key, ttl);
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    hydrateSessionCache();
    const cached = getCached<Article[]>(key, ttl);
    if (cached) {
      setData(cached);
      setLoading(false);
      return; // already have fresh data
    }

    setLoading(true);
    setError(null);

    withDedup(key, () => fetchArticles(args))
      .then((res) => {
        setCached(key, res);
        setData(res);
      })
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  }, [key]);

  return { data, loading, error, refresh: () => setCached(key, undefined as any) };
}