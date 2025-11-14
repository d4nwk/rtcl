"use client";
import { Moon, Sun, SunDim } from "lucide-react";

export default function Greeting({ name }: { name: string }) {
  const h = new Date().getHours();
  const isMorning = h < 12;
  const isAfternoon = h >= 12 && h < 18;

  const label = isMorning ? "Good morning" : isAfternoon ? "Good afternoon" : "Good evening";
  const color = isMorning ? "text-yellow-500" : isAfternoon ? "text-orange-500" : "text-purple-500";

  return (
    <div id="greetBox" className="pointer-events-none absolute top-3 left-3 md:top-4 md:left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5">
      <span className={color}>
        {isMorning ? <SunDim className="h-5 w-5 translate-y-[1px]" /> : isAfternoon ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </span>
      <h2 id="greetText" className="text-base md:text-lg font-[400]">{label}, {name}</h2>
    </div>
  );
}