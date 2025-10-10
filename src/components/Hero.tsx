"use client";
import { useEffect, useRef, useState } from "react";
import Greeting from "./Greeting";

export default function Hero({ items, onOpen, userName }:{
  items: any[];
  onOpen: (it:any)=>void;
  userName: string;
}) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(()=>{
    if (timer.current) clearInterval(timer.current);
    if (items.length) {
      timer.current = setInterval(()=> setIndex(i=> (i+1)%items.length), 10000);
    }
    return ()=>{ if (timer.current) clearInterval(timer.current); };
  }, [items.length]);

  return (
    <div className="relative rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden mb-8">
      <div id="recWindow" className="relative h-[300px] md:h-[360px]">
        <div className="flex h-full transition-transform duration-500 ease-out" style={{transform:`translateX(-${index*100}%)`}}>
          {items.map((it, i)=>(
            <article key={i} className="w-full flex-none h-full" onClick={()=>onOpen(it)}>
              <div className="grid grid-cols-1 md:grid-cols-5 h-full items-stretch">
                <div className="md:col-span-3 px-4 md:px-6 h-full flex flex-col rec-content">
                  <div className="flex-1 w-full flex">
                    <div className="my-auto w-full">
                      <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                        {it._favicon ? <img src={it._favicon} className="h-4 w-4 rounded" alt="" /> : null}
                        <span>{new Date(it.pubDate||Date.now()).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-2xl md:text-4xl font-semibold leading-tight">{it.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 relative h-full">
                  <img src={it._img} className="absolute inset-0 h-full w-full object-cover" alt="" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* overlays */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-1 md:grid-cols-5">
          <div className="col-start-1 col-span-1 md:col-span-3 relative">
            <Greeting name={userName}/>
          </div>
          <div className="hidden md:flex col-start-4 col-span-2 justify-end p-3">
            <span className="inline-flex h-6 items-center rounded-full bg-white/90 px-2 text-xs text-neutral-800">For you</span>
          </div>
          <div className="col-start-1 md:col-start-4 md:col-span-2 flex items-end justify-center pb-3">
            <div className="pointer-events-auto flex gap-2 rounded-full bg-white/80 px-1.5 py-1">
              {items.map((_, i)=>(
                <button key={i} onClick={(e)=>{ e.stopPropagation(); setIndex(i); }} className={`h-2.5 w-2.5 rounded-full ${i===index?'bg-neutral-900':'bg-white border border-black/30'}`}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}