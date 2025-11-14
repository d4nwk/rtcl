"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bookmark, User, Settings, ExternalLink, Save, Loader2, BookOpen, Book, X } from "lucide-react";

// Definition cache for word lookups (defs, phonetic, pos, audio, posDetails)
const defCache = new Map<
  string,
  {
    defs: string[];
    phonetic: string | null;
    pos: string[];
    audio: string | null;
    posDetails: Record<string, { defs: string[]; examples: string[] }>;
  }
>();

let hoverPanelActive = false;
const POS_ORDER = ["n", "v", "adj", "adv", "prep", "conj", "pron", "int", "other"] as const;

export default function Reader({ item, onClose }: { item: any | null; onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [showToolbarTitle, setShowToolbarTitle] = useState(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!titleRef.current) return;
    const el = titleRef.current;
    const headerH = 55;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setShowToolbarTitle(!entry.isIntersecting);
      },
      { rootMargin: `-${headerH}px 0px 0px 0px`, threshold: [0] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [item]);

  const formatWhen = (d: Date) => {
    const dateStr = d.toLocaleDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${dateStr} · ${timeStr}`;
  };

  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [defWord, setDefWord] = useState<string | null>(null);
  const [defLoading, setDefLoading] = useState(false);
  const [defError, setDefError] = useState<string | null>(null);
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [phonetic, setPhonetic] = useState<string | null>(null);
  const [posTags, setPosTags] = useState<string[]>([]);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [hoverWord, setHoverWord] = useState<string | null>(null);
  const [hoverReady, setHoverReady] = useState(false);

  const [savedCollapsed, setSavedCollapsed] = useState(false);
  const [loadingWords, setLoadingWords] = useState<Set<string>>(new Set());
  const [defsCollapsed, setDefsCollapsed] = useState(false);

  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const longPressArmed = useRef(false);

  const getSelectedWord = () =>
    typeof window !== "undefined" ? window.getSelection()?.toString().trim() || "" : "";

  const getWordFromPoint = (x: number, y: number): string => {
    const doc: any = document;
    let range: Range | null = null;
    if (doc.caretRangeFromPoint) {
      range = doc.caretRangeFromPoint(x, y);
    } else if (doc.caretPositionFromPoint) {
      const pos = doc.caretPositionFromPoint(x, y);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.setEnd(pos.offsetNode, pos.offset);
      }
    }
    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) return "";
    const text = range.startContainer.textContent || "";
    let i = range.startOffset;
    let start = i,
      end = i;
    while (start > 0 && /[\p{L}\p{N}''-]/u.test(text[start - 1])) start--;
    while (end < text.length && /[\p{L}\p{N}''-]/u.test(text[end])) end++;
    return text.slice(start, end).trim();
  };

  const normPOS = (s: string) => (s || "").toLowerCase().trim();
  const shortPOS = (s: string) => {
    const m = normPOS(s);
    if (m.startsWith("noun")) return "n";
    if (m.startsWith("verb")) return "v";
    if (m.startsWith("adjective")) return "adj";
    if (m.startsWith("adverb")) return "adv";
    if (m.startsWith("preposition")) return "prep";
    if (m.startsWith("conjunction")) return "conj";
    if (m.startsWith("pronoun")) return "pron";
    if (m.startsWith("interjection")) return "int";
    return m || "other";
  };
  const fetchWithTimeout = (url: string, ms = 2500) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  };
  const fullPOS = (s: string) => {
    const m = (s || "").toLowerCase();
    if (m === "n") return "NOUN";
    if (m === "v") return "VERB";
    if (m === "adj") return "ADJECTIVE";
    if (m === "adv") return "ADVERB";
    if (m === "prep") return "PREPOSITION";
    if (m === "conj") return "CONJUNCTION";
    if (m === "pron") return "PRONOUN";
    if (m === "int") return "INTERJECTION";
    return "OTHER";
  };

  const fetchWordMeta = async (word: string) => {
    const key = word.toLowerCase();
    if (
      defCache.has(key) &&
      ((defCache.get(key)!.pos?.length ?? 0) > 0 || (defCache.get(key)!.defs?.length ?? 0) > 0)
    )
      return;
    setLoadingWords((prev) => {
      const n = new Set(prev);
      n.add(key);
      return n;
    });

    const fromDictApi = async () => {
      const res = await fetchWithTimeout(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
        1800
      );
      if (!res.ok) throw new Error(`dictapi ${res.status}`);
      const data = await res.json();
      const flatDefs: string[] = [];
      const posDetails: Record<string, { defs: string[]; examples: string[] }> = {};
      let ph: string | null = null;
      let audio: string | null = null;
      if (Array.isArray(data) && data[0]) {
        const entry = data[0];
        if (entry.phonetic) ph = entry.phonetic;
        if (Array.isArray(entry.meanings)) {
          entry.meanings.forEach((m: any) => {
            const p = shortPOS(m.partOfSpeech || "");
            if (!posDetails[p]) posDetails[p] = { defs: [], examples: [] };
            (m.definitions || []).forEach((d: any) => {
              if (d.definition) {
                flatDefs.push(d.definition);
                posDetails[p].defs.push(d.definition);
                if (d.example) posDetails[p].examples.push(d.example);
              }
            });
          });
        }
      }
      const orderedPos = Object.keys(posDetails).sort(
        (a, b) => POS_ORDER.indexOf(a as any) - POS_ORDER.indexOf(b as any)
      );
      return { defs: flatDefs, ph, pos: orderedPos, audio, posDetails };
    };

    const fromDatamusePOS = async () => {
      const r = await fetchWithTimeout(
        `https://api.datamuse.com/words?sp=${encodeURIComponent(key)}&md=p&max=1`,
        900
      );
      if (!r.ok) throw new Error("pos");
      const rows = await r.json();
      const tags: string[] = rows[0]?.tags || [];
      const poss = tags
        .map((t: string) => t.toLowerCase())
        .filter((t: string) => ["n", "v", "adj", "adv", "prep", "conj", "pron", "int"].includes(t));
      const ordered = Array.from(new Set(poss)).sort(
        (a, b) => POS_ORDER.indexOf(a as any) - POS_ORDER.indexOf(b as any)
      );
      return {
        defs: [],
        ph: null,
        pos: ordered,
        audio: null,
        posDetails: {} as Record<string, { defs: string[]; examples: string[] }>,
      };
    };

    try {
      const first: any = await Promise.race([
        fromDictApi().catch((e) => {
          throw e;
        }),
        fromDatamusePOS().catch(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ defs: [], ph: null, pos: [], audio: null, posDetails: {} }), 950)
            )
        ),
      ]);
      let best = first;
      if (!(best.pos?.length) && !(best.defs?.length)) {
        const [a, b] = await Promise.allSettled([fromDictApi(), fromDatamusePOS()]);
        const pick = (s: any) => (s.status === "fulfilled" ? s.value : null);
        best = pick(a) || pick(b) || best;
      }
      const existing = defCache.get(key);
      const merged = {
        defs: best.defs?.length ? best.defs.slice(0, 5) : existing?.defs || [],
        phonetic: best.ph ?? existing?.phonetic ?? null,
        pos: best.pos?.length ? best.pos : existing?.pos || [],
        audio: best.audio ?? existing?.audio ?? null,
        posDetails: Object.keys(best.posDetails || {}).length ? best.posDetails : existing?.posDetails || {},
      };
      defCache.set(key, merged);
    } catch {
      // ignore
    } finally {
      setLoadingWords((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    }
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    const point =
      "touches" in e && e.touches[0]
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: (e as any).clientX, y: (e as any).clientY };
    longPressArmed.current = true;
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => {
      let w = getSelectedWord();
      if (!w) w = getWordFromPoint(point.x, point.y);
      if (w) {
        setSavedWords((prev) => (prev.includes(w) ? prev : [...prev, w]));
        const key = w.toLowerCase();
        const meta = defCache.get(key);
        if (!meta || !(meta.pos?.length)) fetchWordMeta(w);
      }
      longPressArmed.current = false;
    }, 550);
  };

  const handlePressEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (longPressArmed.current) {
      let w = getSelectedWord();
      if (!w && e) {
        const p =
          "changedTouches" in e && e.changedTouches[0]
            ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
            : { x: (e as any).clientX, y: (e as any).clientY };
        w = getWordFromPoint(p.x, p.y);
      }
      if (w) setDefWord(w);
    }
    longPressArmed.current = false;
  };

  useEffect(() => {
    const run = async () => {
      if (!defWord) {
        setDefinitions([]);
        setPhonetic(null);
        setDefError(null);
        setPosTags([]);
        setAudioSrc(null);
        return;
      }
      const key = defWord.toLowerCase();
      if (defCache.has(key)) {
        const cached = defCache.get(key)!;
        setDefinitions(cached.defs);
        setPhonetic(cached.phonetic);
        setPosTags(cached.pos);
        setAudioSrc(cached.audio);
        setDefError(null);
        return;
      }
      setDefLoading(true);
      setDefError(null);

      const fromDictApi = async () => {
        const res = await fetchWithTimeout(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
          2200
        );
        if (!res.ok) throw new Error(`dictapi ${res.status}`);
        const data = await res.json();
        const flatDefs: string[] = [];
        let ph: string | null = null;
        let audio: string | null = null;
        const posDetails: Record<string, { defs: string[]; examples: string[] }> = {};
        if (Array.isArray(data) && data[0]) {
          const entry = data[0];
          if (entry.phonetic) ph = entry.phonetic;
          if (Array.isArray(entry.phonetics)) {
            const withText = entry.phonetics.find((p: any) => p.text);
            if (withText && !ph) ph = withText.text;
            const withAudio = entry.phonetics.find((p: any) => p.audio && p.audio.startsWith("https://"));
            if (withAudio) audio = withAudio.audio;
          }
          if (Array.isArray(entry.meanings)) {
            entry.meanings.forEach((m: any) => {
              const posShort = shortPOS(m.partOfSpeech || "");
              if (!posDetails[posShort]) posDetails[posShort] = { defs: [], examples: [] };
              (m.definitions || []).forEach((d: any) => {
                if (d.definition) {
                  flatDefs.push(d.definition);
                  posDetails[posShort].defs.push(d.definition);
                  if (d.example) posDetails[posShort].examples.push(d.example);
                }
              });
            });
          }
        }
        const orderedPos = Object.keys(posDetails).sort(
          (a, b) => POS_ORDER.indexOf(a as any) - POS_ORDER.indexOf(b as any)
        );
        return { defs: flatDefs, ph, pos: orderedPos, audio, posDetails };
      };

      const fromDatamuse = async () => {
        const res = await fetchWithTimeout(
          `https://api.datamuse.com/words?sp=${encodeURIComponent(key)}&md=dp&max=1`,
          2000
        );
        if (!res.ok) throw new Error(`datamuse ${res.status}`);
        const rows = await res.json();
        const flatDefs: string[] = [];
        const posDetails: Record<string, { defs: string[]; examples: string[] }> = {};
        let ph: string | null = null;
        let audio: string | null = null;
        if (Array.isArray(rows) && rows[0]) {
          const r = rows[0];
          if (Array.isArray(r.defs)) {
            r.defs.forEach((d: string) => {
              const idx = d.indexOf("\t");
              const posRaw = idx > -1 ? d.slice(0, idx) : "";
              const val = idx > -1 ? d.slice(idx + 1) : d;
              const p = shortPOS(posRaw);
              if (!posDetails[p]) posDetails[p] = { defs: [], examples: [] };
              flatDefs.push(val);
              posDetails[p].defs.push(val);
            });
          }
        }
        const orderedPos = Object.keys(posDetails).sort(
          (a, b) => POS_ORDER.indexOf(a as any) - POS_ORDER.indexOf(b as any)
        );
        return { defs: flatDefs, ph, pos: orderedPos, audio, posDetails };
      };

      try {
        const winner = (await Promise.race([
          fromDictApi().catch((e) => {
            throw e;
          }),
          fromDatamuse().catch(
            () =>
              new Promise((resolve) =>
                setTimeout(() => resolve({ defs: [], ph: null, pos: [], audio: null, posDetails: {} }), 2100)
              )
          ),
        ])) as {
          defs: string[];
          ph: string | null;
          pos: string[];
          audio: string | null;
          posDetails: Record<string, { defs: string[]; examples: string[] }>;
        };

        let best = winner;
        if (!best.defs || best.defs.length === 0) {
          const [a, b] = await Promise.allSettled([fromDictApi(), fromDatamuse()]);
          const pick = (s: any) => (s.status === "fulfilled" && s.value.defs && s.value.defs.length ? s.value : null);
          const alt = pick(a) || pick(b);
          if (alt) best = alt;
        }

        if (best.defs && best.defs.length) {
          defCache.set(key, {
            defs: best.defs.slice(0, 5),
            phonetic: best.ph,
            pos: best.pos,
            audio: best.audio,
            posDetails: best.posDetails,
          });
          setDefinitions(best.defs.slice(0, 5));
          setPhonetic(best.ph);
          setPosTags(best.pos);
          setAudioSrc(best.audio);
          setDefError(null);
        } else {
          setDefinitions([]);
          setPhonetic(null);
          setPosTags([]);
          setAudioSrc(null);
          setDefError("No definitions found");
        }
      } catch (err: any) {
        setDefinitions([]);
        setPhonetic(null);
        setPosTags([]);
        setAudioSrc(null);
        setDefError(err.message || "Lookup failed");
      } finally {
        setDefLoading(false);
      }
    };
    run();
  }, [defWord]);

  useEffect(() => {
    const root = document.getElementById("__next");
    const bodyEl = root?.querySelector("[data-reader-body]") as HTMLElement | null;
    if (!bodyEl) return;
    const text = bodyEl.innerText || "";
    const words = Array.from(
      new Set((text.match(/[\p{L}\p{N}''-]{3,}/gu) || []).map((w) => w.toLowerCase()))
    ).slice(0, 300);

    const fetchOne = async (w: string) => {
      if (defCache.has(w)) return;
      try {
        const res = await fetchWithTimeout(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`,
          1200
        );
        if (!res.ok) return;
        const data = await res.json();
        const flatDefs: string[] = [];
        const posDetails: Record<string, { defs: string[]; examples: string[] }> = {};
        let ph: string | null = null;
        let audio: string | null = null;
        if (Array.isArray(data) && data[0]) {
          const entry = data[0];
          if (entry.phonetic) ph = entry.phonetic;
          if (Array.isArray(entry.meanings)) {
            entry.meanings.forEach((m: any) => {
              const p = shortPOS(m.partOfSpeech || "");
              if (!posDetails[p]) posDetails[p] = { defs: [], examples: [] };
              (m.definitions || []).forEach((d: any) => {
                if (d.definition) {
                  flatDefs.push(d.definition);
                  posDetails[p].defs.push(d.definition);
                  if (d.example) posDetails[p].examples.push(d.example);
                }
              });
            });
          }
        }
        if (flatDefs.length) {
          const orderedPos = Object.keys(posDetails).sort(
            (a, b) => POS_ORDER.indexOf(a as any) - POS_ORDER.indexOf(b as any)
          );
          defCache.set(w, {
            defs: flatDefs.slice(0, 5),
            phonetic: ph,
            pos: orderedPos,
            audio,
            posDetails,
          });
        }
      } catch {
        // ignore
      }
    };

    (async () => {
      const batchSize = 12;
      for (let i = 0; i < words.length; i += batchSize) {
        await Promise.allSettled(words.slice(i, i + batchSize).map(fetchOne));
      }
    })();

    (async () => {
      const needPos = words
        .filter((w) => {
          const c = defCache.get(w);
          return !c || !c.pos || c.pos.length === 0;
        })
        .slice(0, 180);

      const fetchPOS = async (w: string) => {
        try {
          const r = await fetchWithTimeout(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(w)}&md=p&max=1`,
            900
          );
          if (!r.ok) return;
          const rows = await r.json();
          if (!Array.isArray(rows) || !rows[0]) return;
          const tags: string[] = rows[0].tags || [];
          const poss = tags
            .map((t) => t.toLowerCase())
            .filter((t) => ["n", "v", "adj", "adv", "prep", "conj", "pron", "int"].includes(t));
          if (!poss.length) return;
          const ordered = Array.from(new Set(poss)).sort(
            (a, b) => POS_ORDER.indexOf(a as any) - POS_ORDER.indexOf(b as any)
          );
          const prev = defCache.get(w);
          if (prev) {
            defCache.set(w, { ...prev, pos: ordered.length ? ordered : prev.pos });
          } else {
            defCache.set(w, { defs: [], phonetic: null, pos: ordered, audio: null, posDetails: {} });
          }
        } catch {
          // ignore
        }
      };

      const batchSize = 18;
      for (let i = 0; i < needPos.length; i += batchSize) {
        await Promise.allSettled(needPos.slice(i, i + batchSize).map(fetchPOS));
      }
    })();
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur relative h-[55px]"
      >
        <button onClick={onClose} aria-label="Back" className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-80">
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-3">
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open original source"
              className="p-1 hover:opacity-80"
              title="Open original source"
            >
              <ExternalLink size={22} strokeWidth={1.75} />
            </a>
          )}
          <button
            onClick={() => setSaved((s) => !s)}
            aria-label={saved ? "Unsave" : "Save"}
            className="p-1 hover:opacity-80"
            title={saved ? "Saved" : "Save"}
          >
            <Bookmark size={22} strokeWidth={1.75} className={saved ? "fill-current" : ""} />
          </button>
        </div>

        <nav className="container mx-auto flex items-center justify-between px-4 h-[55px]">
          <div className="flex items-center gap-2 min-w-0">
            {showToolbarTitle && (
              <>
                {item._favicon && <img src={item._favicon} alt="" className="h-5 w-5 rounded" />}
                <div className="truncate text-[15px] md:text-[16px] font-[500] leading-normal [font-family:var(--font-rubik)]">
                  {item.title}
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Toggle buttons – completely independent, positioned inside article area */}
      <div className="hidden md:flex fixed z-[80] right-[360px] lg:right-[380px] top-[70px] flex-col gap-3 w-12 pointer-events-none">
        <button
          className="rounded-full p-1 bg-white/90 border border-neutral-200 shadow-sm hover:bg-white pointer-events-auto"
          onClick={() => setDefsCollapsed(v => !v)}
          title={defsCollapsed ? "Show definitions" : "Hide definitions"}
          aria-label="Toggle definitions"
        >
          {defsCollapsed ? <Book size={16} /> : <BookOpen size={16} />}
        </button>
        <button
          className="rounded-full p-1 bg-white/90 border border-neutral-200 shadow-sm hover:bg-white pointer-events-auto"
          onClick={() => setSavedCollapsed(v => !v)}
          title={savedCollapsed ? "Show saved" : "Hide saved"}
          aria-label="Toggle saved list"
        >
          {savedCollapsed ? <Book size={16} /> : <BookOpen size={16} />}
        </button>
      </div>

      {/* Fixed right-edge panel */}
      <aside className="hidden md:block fixed z-50 right-0 top-[55px] bottom-0 md:w-[340px] lg:w-[360px] shrink-0 bg-neutral-100 rounded-none p-4 lg:p-6 overflow-y-auto border-l border-neutral-200">
        <div className="space-y-6">
          <section>
            {defsCollapsed ? (
              <div className="text-neutral-500 text-sm">Definitions</div>
            ) : (
              <>
                {!defWord && (
                  <div className="text-neutral-400 text-sm">Click a word to see its definition.</div>
                )}
                <div className="w-full text-neutral-700 text-left space-y-2">
                  {defWord && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="font-medium text-lg truncate">{defWord}</div>
                          {phonetic && <div className="text-neutral-600 text-sm italic">{phonetic}</div>}
                          {audioSrc && (
                            <button
                              className="text-neutral-500 hover:text-neutral-700 text-sm border rounded px-2 py-0.5"
                              onClick={() => { if (!audioRef.current) audioRef.current = new Audio(audioSrc); audioRef.current.currentTime = 0; audioRef.current.play(); }}
                              aria-label="Play pronunciation"
                            >
                              ▶︎
                            </button>
                          )}
                        </div>
                        <button
                          className="shrink-0 text-neutral-400 hover:text-neutral-600"
                          onClick={() => setDefWord(null)}
                          aria-label="Clear definition"
                          title="Clear"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      {defLoading && <div className="text-neutral-400 text-sm mt-1">Looking up…</div>}
                      {defError && <div className="text-red-500 text-sm mt-1">{defError}</div>}
                      {!defLoading && !defError && (() => {
                        const cached = defWord ? defCache.get(defWord.toLowerCase()) : null;
                        const details = cached?.posDetails || {};
                        const keys = Object.keys(details).sort((a, b) => POS_ORDER.indexOf(a as any) - POS_ORDER.indexOf(b as any));
                        if (!keys.length) return <div className="text-neutral-400 text-sm mt-1">No definitions found.</div>;
                        return (
                          <div className="space-y-4">
                            {keys.map(k => (
                              <div key={k}>
                                <div className="uppercase text-xs text-neutral-500 tracking-wide mb-2">{fullPOS(k)}</div>
                                <ol className="list-decimal pl-5 space-y-1">
                                  {details[k].defs.slice(0, 5).map((d, i) => (
                                    <li key={i}>
                                      <div>{d}</div>
                                      {details[k].examples[i] && (<div className="text-neutral-500 text-sm mt-0.5">{details[k].examples[i]}</div>)}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
          {/* Saved words section */}
          <section className="relative border-t border-neutral-200 pt-4">
            <button
              className="absolute -left-12 top-0 z-[60] rounded-full p-1 bg-white/90 border border-neutral-200 shadow-sm hover:bg-white"
              onClick={()=>setSavedCollapsed(v=>!v)}
              title={savedCollapsed ? "Show saved" : "Hide saved"}
              aria-label="Toggle saved list"
            >
              {savedCollapsed ? <Book size={16} /> : <BookOpen size={16} />}
            </button>
            {savedCollapsed ? (
              <div className="text-neutral-500 text-sm">Saved words</div>
            ) : (
              <>
                {savedWords.length === 0 && (
                  <div className="text-neutral-400 text-sm">Click and hold a word to save.</div>
                )}
                <ul className="space-y-2">
                  {savedWords.length > 0 && (
                    Array.from(new Set(savedWords.map((w)=>w.toLowerCase()))).map((lw)=>{
                      const w = savedWords.find((sw)=>sw.toLowerCase()===lw)!;
                      const meta = defCache.get(lw);
                      const details = meta?.posDetails || {};
                      const keysFromDetails = Object.keys(details);
                      const hasDefs = keysFromDetails.some(k => details[k]?.defs?.length);
                      let poss = (keysFromDetails.length ? keysFromDetails : (meta?.pos||[]))
                        .sort((a,b)=>POS_ORDER.indexOf(a as any)-POS_ORDER.indexOf(b as any));
                      const isLoading = loadingWords.has(lw) || (!hasDefs && poss.length===0);

                      return (
                        <li key={lw} className="group">
                          <div
                            className="flex items-center justify-between gap-2 text-base text-neutral-700"
                            onMouseEnter={()=>{ if(hoverTimer.current) clearTimeout(hoverTimer.current); setHoverWord(w); setHoverReady(true); }}
                            onMouseLeave={()=>{ if(hoverTimer.current) clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(()=>{ if(!hoverPanelActive){ setHoverReady(false); setHoverWord(null);} },120); }}
                          >
                            <button className="text-left flex-1 hover:underline" onClick={()=>setDefWord(w)}>
                              <span className="mr-2">{w}</span>
                              <span className="inline-flex gap-1 align-middle">
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                                ) : hasDefs ? (
                                  poss.map(p => (
                                    <span key={p} className="inline-block rounded-full bg-neutral-200 text-neutral-700 text-[11px] px-2 py-0.5 uppercase">{p}</span>
                                  ))
                                ) : null}
                              </span>
                            </button>
                            <button
                              aria-label="Remove"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-neutral-600"
                              onClick={()=>setSavedWords(prev=>prev.filter(x=>x.toLowerCase()!==lw))}
                            >
                              ✕
                            </button>
                          </div>
                          {hoverWord===w && hoverReady && (
                            <div
                              className="mt-2 rounded-md border border-neutral-200 bg-white p-2 transition-opacity duration-150"
                              onMouseEnter={()=>{ hoverPanelActive = true; if(hoverTimer.current) clearTimeout(hoverTimer.current); }}
                              onMouseLeave={()=>{ hoverPanelActive = false; if(hoverTimer.current) clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(()=>{ if(!hoverPanelActive){ setHoverReady(false); setHoverWord(null);} },120); }}
                            >
                              {(() => {
                                const details = meta?.posDetails || {};
                                const keys = Object.keys(details).sort((a,b)=>POS_ORDER.indexOf(a as any)-POS_ORDER.indexOf(b as any));
                                if (!keys.length) return <div className="text-sm text-neutral-500">No details cached.</div>;
                                return (
                                  <div className="space-y-3">
                                    {keys.map(k => (
                                      <div key={k}>
                                        <div className="uppercase text-[10px] text-neutral-500 tracking-wide mb-1">{fullPOS(k)}</div>
                                        <ul className="list-disc pl-5 space-y-0.5">
                                          {details[k].defs.slice(0,5).map((d,i)=> (
                                            <li key={i} className="text-sm">
                                              {d}
                                              {details[k].examples[i] && (<span className="block text-neutral-500">{details[k].examples[i]}</span>)}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </>
            )}
          </section>
        </div>
      </aside>

      {/* Body */}
      <article className="container mx-auto w-full px-4 py-6 relative">
        {/* Two-column layout */}
        <div className="md:flex md:items-start md:gap-6 md:mr-[340px]">
          {/* Main article */}
          <div className="md:flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
              <img className="h-5 w-5 rounded" alt="" src={item._favicon || ""} />
              <span>{formatWhen(new Date(item.pubDate || Date.now()))}</span>
            </div>
            <h1 ref={titleRef} className="text-2xl font-[500] md:text-3xl [font-family:var(--font-rubik)]">
              {item.title}
            </h1>
            <div ref={imgWrapRef} className="mt-4 overflow-hidden rounded-xl bg-neutral-200">
              {item._img && (
                <img src={item._img} className="w-full h-auto object-contain" loading="lazy" referrerPolicy="no-referrer" alt="" />
              )}
            </div>
            <div
              data-reader-body
              className="prose prose-neutral prose-xl mt-6 max-w-none leading-relaxed select-text"
              onMouseDown={(e) => handlePressStart(e)}
              onMouseUp={(e) => handlePressEnd(e)}
              onMouseLeave={(e) => handlePressEnd(e)}
              onTouchStart={(e) => handlePressStart(e)}
              onTouchEnd={(e) => handlePressEnd(e)}
              onTouchCancel={(e) => handlePressEnd(e)}
            >
              <p className="text-[17px] md:text-[18px] leading-7">
                This is a long test article used to verify scrolling behavior, sticky headers, and title handoff into the toolbar. The copy is intentionally generic so that layout, spacing, and reading rhythm can be evaluated without distraction. Imagine this body replaced by your readability output, where headings, lists, quotes and inline emphasis would render as expected using the site’s typography.
              </p>
              <p className="text-[17px] md:text-[18px] leading-7">
                Readers often skim before committing, so the first screenful should feel airy but information dense. Images above help set context while the text below should reflow elegantly across devices. As you scroll, note how the article title disappears from the canvas and reappears in the header, occupying the same slot the slogan uses on the feed. This ensures orientation without stealing attention.
              </p>
              <p className="text-[17px] md:text-[18px] leading-7">
                The right panel keeps saved words and definitions in one place. During longer sessions the panel’s sticky affordance reduces travel distance for the eyes and the pointer. Long-press on any word in the final implementation to save it, then tap a saved item to load a concise definition, examples, and pronunciation. The goal is to maintain reading flow while enabling micro-interactions that support language learning.
              </p>
              <p className="text-[17px] md:text-[18px] leading-7">
                For stress testing, keep scrolling through this paragraph block. It includes multiple sentences with varied lengths and punctuation to mimic real articles. Commas, em dashes, and parentheses should not break justification; links and italics should inherit the theme. If everything feels smooth—no jank, no jumps—then the intersection logic for revealing the compact title is working as intended. When you reach the link at the bottom, the toolbar should still be visible and unobtrusive, ready for quick navigation and saving.
              </p>
            </div>

            <div className="h-10" />
          </div>
        </div>
      </article>
    </div>
  );
}