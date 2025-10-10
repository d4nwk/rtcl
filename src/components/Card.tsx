"use client";

export default function Card({ item, onOpen }:{ item:any; onOpen:(it:any)=>void }) {
  return (
    <article className="hitem flex-none w-[360px] rounded-2xl border-2 border-transparent bg-white transition-all overflow-hidden hover:border-black">
      <button className="block text-left w-full" onClick={()=>onOpen(item)}>
        <div className="w-full bg-neutral-200">
          <img src={item._img} loading="lazy" referrerPolicy="no-referrer" alt="" className="h-48 w-full object-cover"/>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {item._favicon ? <img src={item._favicon} alt="" className="h-4 w-4 rounded"/> : null}
            <span className="line-clamp-1">{new Date(item.pubDate||Date.now()).toLocaleDateString()}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 font-semibold underline-offset-2">{item.title}</h3>
        </div>
      </button>
    </article>
  );
}