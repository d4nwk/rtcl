"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hero from "@/components/Hero";
import CardRail from "@/components/CardRail";
import Reader from "@/components/Reader";
import Toolbar from "@/components/Toolbar";
import { FEEDS, LANG_LABELS, LANG_ORDER } from "@/lib/feeds";
import { faviconFor, fmtDateKey, pickImage, setSnapOffsetExact, wordCountFromItem } from "@/lib/utils";
import { LanguageControl, SortControl, SortKey } from "@/components/Controls";

type ArticleItem = any;

const Rtcl = () => <span className="font-[500]">rtcl</span>;

const HEADER_KEY = "rtcl:header:v1";
const PHRASES: JSX.Element[] = [
  <>An <Rtcl /> a day keeps the doctor away</>,
  <>Keep calm and read <Rtcl /></>,
  <>Start your morning with <Rtcl /></>,
  <>Fuel your mind with <Rtcl /></>,
  <>Stay informed with <Rtcl /></>,
  <>Your daily dose of <Rtcl /></>,
  <>Discover new ideas on <Rtcl /></>,
  <>Read smart, read <Rtcl /></>,
  <>Brighten your day with <Rtcl /></>,
  <>The best reads from <Rtcl /></>,
  <>Expand your horizons with <Rtcl /></>,
  <>Knowledge is power with <Rtcl /></>,
  <>Stay curious with <Rtcl /></>,
  <>Your news, your way with <Rtcl /></>,
  <>Dive into stories with <Rtcl /></>,
  <>Unlock insights with <Rtcl /></>,
  <>Explore the world via <Rtcl /></>,
  <>Feed your brain with <Rtcl /></>,
  <>Every day is better with <Rtcl /></>,
  <>Let <Rtcl /> inspire you today</>,
];

// ---- Session cache (in-file, zero deps) ----
const CACHE_NS = "rtcl:articles:v1";
type CacheEntry = { ts: number; data: ArticleItem[] };
function makeKey(selectedLangs: Set<string>) {
  return Array.from(selectedLangs).sort().join(",");
}
function readStorage(): Record<string, CacheEntry> {
  try {
    const raw = sessionStorage.getItem(CACHE_NS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}
function writeStorage(obj: Record<string, CacheEntry>) {
  try {
    sessionStorage.setItem(CACHE_NS, JSON.stringify(obj));
  } catch {}
}

export default function Page() {
  const USER_NAME = "Dan";
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set(["en"]));
  const [sort, setSort] = useState<SortKey>("date");
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [open, setOpen] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Header phrase state and hydration guard
  const [headerIdx, setHeaderIdx] = useState<number>(0);
  const headerHydratedRef = useRef(false);

  // in-memory cache + hydration flag
  const memCacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const hydratedRef = useRef(false);

  // Header phrase session persistence effect
  useEffect(() => {
    if (headerHydratedRef.current) return;
    let idx = 0;
    try {
      const raw = sessionStorage.getItem(HEADER_KEY);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < PHRASES.length) {
          idx = parsed;
        } else {
          idx = Math.floor(Math.random() * PHRASES.length);
          sessionStorage.setItem(HEADER_KEY, idx.toString());
        }
      } else {
        idx = Math.floor(Math.random() * PHRASES.length);
        sessionStorage.setItem(HEADER_KEY, idx.toString());
      }
    } catch {
      idx = Math.floor(Math.random() * PHRASES.length);
    }
    setHeaderIdx(idx);
    headerHydratedRef.current = true;
  }, []);

  // keep snap offset behavior
  useEffect(() => {
    function onResize() {
      setSnapOffsetExact();
    }
    window.addEventListener("resize", onResize);
    setSnapOffsetExact();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Image error handling stays the same
  useEffect(() => {
    const onImgError = (evt: Event) => {
      const t = evt.target as unknown;
      if (!(t instanceof HTMLImageElement)) return;
      const root = t.closest('[data-card], article, .card, .rtcl-card, li, a');
      if (root && root instanceof HTMLElement) root.style.display = "none";
    };
    document.addEventListener("error", onImgError, true);
    return () => document.removeEventListener("error", onImgError, true);
  }, []);

  // Main loader with session cache
  useEffect(() => {
    let cancelled = false;
    const key = makeKey(selectedLangs);

    // Hydrate memory cache once per session from sessionStorage
    if (!hydratedRef.current) {
      const obj = readStorage();
      const m = new Map<string, CacheEntry>();
      for (const k of Object.keys(obj)) m.set(k, obj[k]);
      memCacheRef.current = m;
      hydratedRef.current = true;
    }

    // If we have cached data for this key, show it instantly (no loading flicker)
    const cached = memCacheRef.current.get(key);
    if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
      setItems(cached.data);
      setLoading(false);
    } else {
      setLoading(true);
    }

    (async () => {
      // Build feed subset
      const feedList = Array.from(selectedLangs).flatMap((l) => FEEDS[l] || []);
      const shuffled = [...feedList].sort(() => Math.random() - 0.5);
      const subset = shuffled.slice(0, 18); // try up to 18 feeds per refresh

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const raw: any[] = [];
      await Promise.all(
        subset.map(async (f, idx) => {
          await sleep(idx * 180); // stagger to avoid 429s
          const url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(f.url);
          try {
            const r = await fetch(url, { cache: "no-store" });
            if (!r.ok) return; // skip 429/422/etc
            const j = await r.json();
            if (j && Array.isArray(j.items)) raw.push(...j.items);
          } catch {
            // ignore per-feed errors
          }
        })
      );

      const seen = new Set<string>();
      const withImgs: any[] = [];
      for (const it of raw) {
        if (!it || !it.link) continue;
        if (seen.has(it.link)) continue;
        const img = pickImage(it);
        if (!img) continue; // require an image
        seen.add(it.link);
        withImgs.push({ ...it, _img: img, _favicon: faviconFor(it.link) });
      }

      // keep only last 7 days
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);

      const fresh = withImgs.filter((a) => {
        const d = new Date(a.pubDate || a.pubdate || a.isoDate || a.date || 0);
        if (!isFinite(+d)) return false;
        return d >= start && d <= now;
      });

      const sorted = fresh.sort(
        (a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
      );

      if (cancelled) return;

      // Update UI
      setItems(sorted);
      setLoading(false);

      // Write through to session cache
      const entry: CacheEntry = { ts: Date.now(), data: sorted };
      memCacheRef.current.set(key, entry);

      // Persist entire map to sessionStorage
      const obj: Record<string, CacheEntry> = {};
      for (const [k, v] of memCacheRef.current.entries()) obj[k] = v;
      writeStorage(obj);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLangs]);

  const groups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      keys.push(fmtDateKey(d.toISOString()));
    }

    if (sort === "date") {
      const map = new Map<string, any[]>();
      keys.forEach((k) => map.set(k, []));
      for (const it of items) {
        const d = new Date(it.pubDate || it.pubdate || it.isoDate || it.date || 0);
        if (!isFinite(+d)) continue;
        const k = fmtDateKey(d.toISOString());
        if (!map.has(k)) continue; // ignore outside last 7 days
        map.get(k)!.push(it);
      }
      return keys.map((k) => {
        const d = new Date(k);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
        let label: string;
        if (diff === 0) label = "Today";
        else if (diff === 1) label = "Yesterday";
        else label = `${diff} days ago`;
        return { label, items: map.get(k)! };
      });
    }

    if (sort === "topic") {
      const map = new Map<string, any[]>();
      for (const it of items) {
        const d = new Date(it.pubDate || it.pubdate || it.isoDate || it.date || 0);
        if (!isFinite(+d)) continue;
        const dayKey = fmtDateKey(d.toISOString());
        if (!keys.includes(dayKey)) continue;
        const cat = (it.categories && it.categories[0]) || "General";
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(it);
      }
      return [...map.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({ label: k, items: v }));
    }

    const map = new Map<string, any[]>([
      ["Short (<200w)", []],
      ["Medium (200–600w)", []],
      ["Long (>600w)", []],
    ]);
    for (const it of items) {
      const d = new Date(it.pubDate || it.pubdate || it.isoDate || it.date || 0);
      if (!isFinite(+d)) continue;
      const dayKey = fmtDateKey(d.toISOString());
      if (!keys.includes(dayKey)) continue;
      const wc = wordCountFromItem(it);
      const bucket = wc < 200 ? "Short (<200w)" : wc <= 600 ? "Medium (200–600w)" : "Long (>600w)";
      map.get(bucket)!.push(it);
    }
    return [...map.entries()].map(([k, v]) => ({ label: k, items: v }));
  }, [items, sort]);

  const recs = items.slice(0, 3);

  const langLabel = (() => {
    const arr = Array.from(selectedLangs);
    const first = LANG_ORDER.find((k) => arr.includes(k)) || arr[0] || "en";
    const count = arr.length;
    return count <= 1 ? (LANG_LABELS[first] || first) : `${LANG_LABELS[first] || first} +${count - 1}`;
  })();

  return (
    <>
      <Toolbar />

      {/* let the animated backdrop show through */}
      <section id="feed" className="bg-transparent py-8">
        <div id="pageContainer" className="container mx-auto px-4">
          {recs.length > 0 && <Hero items={recs} onOpen={setOpen} userName={USER_NAME} />}

          <div className="flex items-center justify-between gap-4">
            <h2 id="topStoriesHeader" className="text-2xl font-[400] tracking-tight md:text-3xl">
              {PHRASES[headerIdx]}
            </h2>
            <div className="flex items-center gap-2">
              <SortControl value={sort} onChange={setSort} />
              <LanguageControl selected={selectedLangs} onApply={setSelectedLangs} />
            </div>
          </div>

          <div className="mt-6 space-y-12">
            {groups.map((g, i) => (
              <CardRail key={i} label={g.label} items={g.items} onOpen={setOpen} />
            ))}
          </div>
          <div className="mt-6 text-sm text-neutral-500">{loading ? "Loading…" : ""}</div>
        </div>
      </section>

      <footer className="z-40 border-t border-neutral-200 bg-white/90">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <p className="text-sm text-neutral-500">
            © <span id="year">{new Date().getFullYear()}</span> rtcl
          </p>
          <ul className="flex items-center gap-4 text-sm text-neutral-600">
            <li>
              <a href="#" className="hover:underline">Privacy</a>
            </li>
            <li>
              <a href="#" className="hover:underline">Terms</a>
            </li>
            <li>
              <a href="#" className="hover:underline">Contact</a>
            </li>
          </ul>
        </div>
      </footer>

      <Reader item={open} onClose={() => setOpen(null)} />
    </>
  );
}