"use client";
import Card from "./Card";

export default function CardRail({ label, items, onOpen }:{ label:string; items:any[]; onOpen:(it:any)=>void }) {
  if (!items?.length) return null;
  return (
    <section className="mb-2">
      <h3 className="text-lg font-semibold mb-3">{label}</h3>
      <div className="hscroll bleed-x flex flex-nowrap gap-4">
        {items.map((it,i)=> <Card key={i} item={it} onOpen={onOpen} />)}
      </div>
    </section>
  );
}