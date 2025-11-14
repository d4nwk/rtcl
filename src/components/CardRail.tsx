/* eslint-disable react/prop-types */
"use client";
import React from "react";
import { LANGUAGES_THEME_STYLES } from "@/themes/LanguagesTheme";

const BRAND_MAP: Record<string, string> = {
  'bbc.com': 'BBC',
  'bbc.co.uk': 'BBC',
  'theguardian.com': 'The Guardian',
  'independent.co.uk': 'The Independent',
  'nytimes.com': 'The New York Times',
  'apnews.com': 'AP News',
  'reuters.com': 'Reuters',
  'bloomberg.com': 'Bloomberg',
  'ft.com': 'Financial Times',
  'washingtonpost.com': 'The Washington Post',
  'wsj.com': 'The Wall Street Journal',
  'aljazeera.com': 'Al Jazeera',
  'cnn.com': 'CNN',
  'foxnews.com': 'Fox News',
  'nbcnews.com': 'NBC News',
  'abcnews.go.com': 'ABC News',
  'cbsnews.com': 'CBS News',
  'npr.org': 'NPR',
  'time.com': 'TIME',
  'economist.com': 'The Economist',
  'yahoo.com': 'Yahoo News',
  'news.yahoo.com': 'Yahoo News',
  'news.sky.com': 'Sky News',
  'sky.com': 'Sky',
};

function baseDomain(host: string): string {
  // strip common subdomains
  const h = host.replace(/^www\./, '');
  const parts = h.split('.');
  if (parts.length >= 3 && (parts[parts.length-2] === 'co' || parts[parts.length-2] === 'com' || parts[parts.length-2] === 'org')) {
    // handle co.uk, com.au, org.uk etc → take last 3
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function brandFromLink(link?: string): { brand: string; host: string } {
  try {
    if (!link) return { brand: '', host: '' };
    const u = new URL(link);
    const host = u.hostname;
    const key = baseDomain(host);
    const mapped = BRAND_MAP[key];
    if (mapped) return { brand: mapped, host };
    // fallback: prettify the registrable label
    const label = key.split('.')[0];
    const pretty = label.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    return { brand: pretty, host };
  } catch {
    return { brand: '', host: '' };
  }
}

export default function CardRail({
  label,
  items,
  onOpen,
}: {
  label: string;
  items: any[];
  onOpen: (it: any) => void;
}) {
  const valid = Array.isArray(items)
    ? items.filter((it) => it && it._img)
    : [];

  if (!valid.length) return null;

  const resolveBrand = (it: any) => {
    if (it.source && typeof it.source === 'string') return it.source; // trust explicit source
    const { brand } = brandFromLink(it.link);
    return brand || '';
  };

  return (
    <section className="first:pt-2 pt-6 mb-2 last:-mb-8 last:pb-2">
      <h3 className="text-lg font-[500] mb-3">{label}</h3>
      <div className="hscroll bleed-x flex flex-nowrap gap-4">
        {valid.map((it, i) => {
          const { brand, host } = brandFromLink(it.link);
          return (
            <article
              key={it.link || it.guid || i}
              data-card
              className="hitem group min-w-[calc((100%-2rem)/3)] max-w-[calc((100%-2rem)/3)] shrink-0 rounded-xl overflow-hidden border border-[var(--rtcl-border)] hover:border-[var(--rtcl-border-active)] transition-all duration-200 bg-white/80 backdrop-blur-sm"
              style={{
                borderColor: "var(--rtcl-border)",
              }}
            >
              <a
                href={it.link}
                onClick={(e) => {
                  e.preventDefault();
                  onOpen(it);
                }}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rtcl-ink)]"
              >
                <div className="aspect-[16/9] w-full bg-neutral-100">
                  <img
                    src={it._img}
                    alt={it.title || "Card image"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const root = e.currentTarget.closest('[data-card]') as HTMLElement | null;
                      if (root) root.style.display = "none";
                    }}
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500">
                    {it._favicon && (
                      <img src={it._favicon} alt="" className="h-3.5 w-3.5 rounded-sm" />
                    )}
                    <span className="truncate" title={brand || host}>
                      {it.source || brand}
                    </span>
                  </div>
                  <h4 className="line-clamp-3 text-xl font-[400] leading-snug">
                    {it.title}
                  </h4>
                </div>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}