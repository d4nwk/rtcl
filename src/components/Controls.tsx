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
      <button onClick={()=>setOpen(v=>!v)} className="text-black hover:opacity-80">
        <ArrowDownNarrowWide className="h-6 w-6" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-[#daeee9] bg-white">
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
    <div className="relative ml-[0.5rem]" ref={ref}>
      <button onClick={()=>setOpen(v=>!v)} className="text-black hover:opacity-80">
        <Languages className="h-6 w-6" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-[#27a392] bg-white">
          <div className="grid grid-cols-2">
            {Object.keys(FEEDS).map((key, i)=>{
              const active = state.has(key);
              const row = Math.floor(i / 2);
              const col = i % 2;
              const innerBorders = `${col>0 ? 'border-l' : ''} ${row>0 ? 'border-t' : ''}`;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    const next = new Set(state);
                    if (next.has(key)) next.delete(key); else next.add(key);
                    setState(next);
                    onApply(next.size ? next : new Set(["en"]));
                  }}
                  className={`flex items-center justify-center py-2.5 text-md transition-colors ${innerBorders} border-[#27a392] ${active ? 'bg-[#daeee9]' : 'bg-white hover:bg-neutral-50'}`}
                >
                  {LANG_LABELS[key] || key}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}