"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDownNarrowWide, Languages } from "lucide-react";
import { FEEDS, LANG_LABELS, LANG_ORDER } from "@/lib/feeds";

export type SortKey = "date" | "topic" | "difficulty";

export function SortControl({ value, onChange }:{ value: SortKey; onChange:(v:SortKey)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const onDoc = (e:MouseEvent)=>{ if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", onDoc); return ()=>document.removeEventListener("click", onDoc);
  }, []);
  const label = value === "date" ? "Date" : value === "topic" ? "Topic" : "Difficulty";
  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(v=>!v)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 bg-white min-w-28 flex items-center justify-center gap-2">
        <ArrowDownNarrowWide className="h-4 w-4" />
        <span>{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {(["date","topic","difficulty"] as SortKey[]).map(k=>(
            <button key={k} onClick={()=>{ onChange(k); setOpen(false); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100">
              {k==="date"?"Date":k==="topic"?"Topic":"Difficulty"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LanguageControl({
  selected,
  onApply
}:{ selected:Set<string>; onApply:(langs:Set<string>)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<Set<string>>(new Set(selected));
  useEffect(()=>setState(new Set(selected)), [selected]);
  useEffect(()=>{
    const onDoc = (e:MouseEvent)=>{ if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", onDoc); return ()=>document.removeEventListener("click", onDoc);
  }, []);

  const arr = Array.from(state);
  const first = LANG_ORDER.find(k=>arr.includes(k)) || arr[0] || "en";
  const count = arr.length;
  const label = count<=1 ? (LANG_LABELS[first] || first) : `${LANG_LABELS[first] || first} +${count-1}`;

  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(v=>!v)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 bg-white min-w-28 flex items-center justify-center gap-2">
        <Languages className="h-4 w-4" />
        <span>{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl border border-neutral-200 bg-white shadow-lg p-2">
          {Object.keys(FEEDS).map((key)=>(
            <label key={key} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer">
              <input type="checkbox" className="accent-black" checked={state.has(key)} onChange={(e)=>{
                const next = new Set(state);
                if (e.target.checked) next.add(key); else next.delete(key);
                setState(next);
              }}/>
              {LANG_LABELS[key] || key}
            </label>
          ))}
          <div className="px-2 pt-2">
            <button onClick={()=>{ const next = state.size?state:new Set(["en"]); onApply(next); setOpen(false); }} className="w-full rounded-lg bg-neutral-900 px-2 py-1 text-white text-sm">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}