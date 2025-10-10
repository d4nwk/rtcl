"use client";

import { useEffect, useMemo, useState } from "react";
import Hero from "@/components/Hero";
import CardRail from "@/components/CardRail";
import Reader from "@/components/Reader";
import { FEEDS, LANG_LABELS, LANG_ORDER } from "@/lib/feeds";
import { faviconFor, fmtDateKey, humanDate, pickImage, setSnapOffsetExact, wordCountFromItem } from "@/lib/utils";
import { LanguageControl, SortControl, SortKey } from "@/components/Controls";

export default function Page() {
  const USER_NAME = "Dan";
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set(["en"]));
  const [sort, setSort] = useState<SortKey>("date");
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState<any|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    function onResize(){ setSnapOffsetExact(); }
    window.addEventListener('resize', onResize);
    setSnapOffsetExact();
    return ()=>window.removeEventListener('resize', onResize);
  }, []);

  useEffect(()=>{
    (async ()=>{
      setLoading(true);
      const feedList = Array.from(selectedLangs).flatMap(l => FEEDS[l] || []);
      const results = await Promise.allSettled(feedList.map(f => fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(f.url)).then(r=>r.json())));
      const raw:any[] = [];
      results.forEach(r=>{ if (r.status==='fulfilled' && (r as any).value?.items) raw.push(...(r as any).value.items); });
      const seen = new Set(); const withImgs:any[] = [];
      for (const it of raw){
        if (seen.has(it.link)) continue;
        const img = pickImage(it); if (!img) continue;
        seen.add(it.link);
        withImgs.push({ ...it, _img: img, _favicon: faviconFor(it.link) });
      }
      setItems(withImgs.sort((a,b)=> new Date(b.pubDate||0).getTime() - new Date(a.pubDate||0).getTime()));
      setLoading(false);
    })();
  }, [selectedLangs]);

  const groups = useMemo(()=>{
    if (sort === "date") {
      const map = new Map<string, any[]>();
      for (const it of items){ const k = fmtDateKey(it.pubDate || Date.now()); if (!map.has(k)) map.set(k, []); map.get(k)!.push(it); }
      return [...map.entries()].sort((a,b)=> new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([k,v])=>({label: humanDate(k), items: v}));
    }
    if (sort === "topic") {
      const map = new Map<string, any[]>();
      for (const it of items){ const cat=(it.categories && it.categories[0]) || 'General'; if(!map.has(cat)) map.set(cat,[]); map.get(cat)!.push(it); }
      return [...map.entries()].sort((a,b)=> a[0].localeCompare(b[0]))
        .map(([k,v])=>({label:k, items:v}));
    }
    const map = new Map<string, any[]>([['Short (<200w)',[]],['Medium (200–600w)',[]],['Long (>600w)',[]]]);
    for (const it of items){
      const wc = wordCountFromItem(it);
      const bucket = wc < 200 ? 'Short (<200w)' : wc <= 600 ? 'Medium (200–600w)' : 'Long (>600w)';
      map.get(bucket)!.push(it);
    }
    return [...map.entries()].map(([k,v])=>({label:k, items:v}));
  }, [items, sort]);

  const recs = items.slice(0,3);

  // label for language button (matches your rule)
  const langLabel = (() => {
    const arr = Array.from(selectedLangs);
    const first = LANG_ORDER.find(k => arr.includes(k)) || arr[0] || "en";
    const count = arr.length;
    return count <= 1 ? (LANG_LABELS[first] || first) : `${LANG_LABELS[first] || first} +${count-1}`;
  })();

  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3">
          <a href="#feed" className="inline-flex items-center">
            <span className="font-semibold tracking-tight">read</span>
            <img src="/logo.png" alt="rtcl" className="h-[30px] w-[30px] align-middle object-contain -mx-1" />
            <span className="font-semibold tracking-tight">, ctrl language</span>
          </a>
          <div className="hidden items-center gap-3 md:flex">
            {/* Make these the same height as controls */}
            <button className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">Sign in</button>
            <a href="#" className="rounded-xl bg-neutral-900 px-3 py-1.5 text-sm text-white hover:opacity-90">Open app</a>
          </div>
        </nav>
      </header>

      {/* Feed */}
      <section id="feed" className="bg-neutral-100 py-8">
        <div id="pageContainer" className="container mx-auto px-4">
          {/* Greeting + Recommended */}
          <Hero items={recs} onOpen={setOpen} userName={USER_NAME} />

          {/* Header + Controls */}
          <div className="flex items-center justify-between gap-4">
            <h2 id="topStoriesHeader" className="text-2xl font-semibold tracking-tight md:text-3xl">Browse rtcls</h2>
            <div className="flex items-center gap-2">
              <SortControl value={sort} onChange={setSort} />
              <LanguageControl selected={selectedLangs} onApply={setSelectedLangs} />
            </div>
          </div>

          {/* Groups */}
          <div className="mt-6 space-y-12">
            {groups.map((g, i)=> <CardRail key={i} label={g.label} items={g.items} onOpen={setOpen} />)}
          </div>
          <div className="mt-6 text-sm text-neutral-500">{loading ? "Loading…" : ""}</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <p className="text-sm text-neutral-500">© <span id="year">{new Date().getFullYear()}</span> rtcl</p>
          <ul className="flex items-center gap-4 text-sm text-neutral-600">
            <li><a href="#" className="hover:underline">Privacy</a></li>
            <li><a href="#" className="hover:underline">Terms</a></li>
            <li><a href="#" className="hover:underline">Contact</a></li>
          </ul>
        </div>
      </footer>

      {/* Reader modal (simplified) */}
      <Reader item={open} onClose={()=>setOpen(null)} />
    </>
  );
}