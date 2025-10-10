"use client";
import { useEffect, useState } from "react";

export default function Reader({ item, onClose }:{ item:any|null; onClose:()=>void }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-3 py-2 backdrop-blur">
        <button onClick={onClose} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">Back</button>
        <div className="flex items-center gap-2">
          <button className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">Save</button>
        </div>
      </div>

      <article className="mx-auto w-full max-w-6xl px-4 py-6 relative">
        <div id="readerGrid">
          <aside className="hidden md:block reader-sticky bg-neutral-100 rounded-xl p-4">
            <div className="text-center text-neutral-400 tracking-wide font-semibold mb-4">SAVED</div>
            <ul className="space-y-2"><li className="text-neutral-400">— long-press words to save —</li></ul>
          </aside>

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
              <img className="h-4 w-4 rounded" alt="" src={item._favicon||""}/>
              <span>{new Date(item.pubDate||Date.now()).toLocaleString()}</span>
            </div>
            <h1 className="text-2xl font-semibold md:text-3xl">{item.title}</h1>
            <div className="mt-4 overflow-hidden rounded-xl bg-neutral-200">
              {item._img && <img src={item._img} className="w-full h-64 object-cover" loading="lazy" referrerPolicy="no-referrer" alt=""/>}
            </div>
            <div className="prose prose-neutral mt-6 max-w-none leading-relaxed">
              <p>Full article rendering kept simple here. (You can plug in your readability pipeline as before.)</p>
            </div>
            <div className="mt-8">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 underline">Open original source</a>
            </div>
            <div className="h-10" />
          </div>

          <aside className="hidden md:flex reader-sticky reader-def-panel bg-neutral-100 rounded-xl p-6">
            <div className="w-full text-neutral-400 text-center">Definition panel</div>
          </aside>
        </div>
      </article>
    </div>
  );
}