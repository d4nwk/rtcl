// src/lib/sessionCache.ts
type CacheEntry<T> = { ts: number; data: T };
const MEM = new Map<string, CacheEntry<any>>();
const PENDING = new Map<string, Promise<any>>();
const NS = "rtcl:articles";                 // sessionStorage namespace
const DEFAULT_TTL = 5 * 60 * 1000;          // 5 minutes (tweak)

const now = () => Date.now();

function readStorage() {
  try {
    const raw = sessionStorage.getItem(NS);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, CacheEntry<any>>;
    for (const [k, v] of Object.entries(obj)) MEM.set(k, v);
  } catch {}
}

function writeStorage() {
  try {
    const obj: Record<string, CacheEntry<any>> = {};
    for (const [k, v] of MEM) obj[k] = v;
    sessionStorage.setItem(NS, JSON.stringify(obj));
  } catch {}
}

export function hydrateSessionCache() {
  if (typeof window === "undefined") return;
  if (MEM.size === 0) readStorage();
}

export function makeKey(parts: Record<string, unknown>) {
  return Object.keys(parts)
    .sort()
    .map(k => `${k}=${JSON.stringify(parts[k])}`)
    .join("&");
}

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | undefined {
  const hit = MEM.get(key);
  if (!hit) return;
  if (now() - hit.ts > ttl) {
    MEM.delete(key);
    writeStorage();
    return;
  }
  return hit.data as T;
}

export function setCached<T>(key: string, data: T) {
  MEM.set(key, { ts: now(), data });
  writeStorage();
}

export function withDedup<T>(key: string, fetcher: () => Promise<T>) {
  if (PENDING.has(key)) return PENDING.get(key)! as Promise<T>;
  const p = fetcher().finally(() => PENDING.delete(key));
  PENDING.set(key, p);
  return p;
}

export function clearArticlesCache() {
  MEM.clear();
  sessionStorage.removeItem(NS);
}