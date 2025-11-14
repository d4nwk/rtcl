// src/themes/ThemeRegistry.tsx
"use client";

import React, { useEffect, useRef } from "react";

/** Theme IDs used everywhere (stable string keys) */
export type ThemeId = "default" | "dark" | "blue" | "pink" | "languages";

/** Per-theme tokens used for borders, accents, and tile/page backgrounds. */
export const THEME_STYLES: Record<
  ThemeId,
  {
    /** thin border on cards/rails/etc. */
    border: string;
    /** active/hovered border */
    borderActive: string;
    /** primary accent (icons, focus rings, links) */
    accent: string;
    /** background token for tile previews (mirrors page bg settings) */
    tileBg: string;
    /** background token for the page (non-animated themes); Languages uses canvas so this can be empty */
    pageBg?: string;
    /** optional ink color for decorative drawings (e.g., glyphs) */
    ink?: string;
  }
> = {
  default: {
    border: "hsl(0 0% 80% / 0.7)",
    borderActive: "hsl(0 0% 0%)",
    accent: "hsl(0 0% 0%)",
    // solid white background using linear-gradient
    tileBg: "linear-gradient(0deg, hsl(0 0% 100%), hsl(0 0% 100%))",
    pageBg: "linear-gradient(0deg, hsl(0 0% 100%), hsl(0 0% 100%))",
  },

  dark: {
    border: "hsl(210 15% 25% / 0.7)",
    borderActive: "hsl(210 15% 65%)",
    accent: "hsl(210 15% 65%)",
    tileBg: "linear-gradient(0deg, hsl(220 18% 8%), hsl(220 18% 8%))",
    pageBg: "linear-gradient(0deg, hsl(220 18% 8%), hsl(220 18% 8%))",
  },

  blue: {
    // Non-active border color previously discussed: #2596be
    border: "color-mix(in oklab, #2596be 40%, white)",
    borderActive: "#2596be",
    accent: "#2596be",
    tileBg: "linear-gradient(0deg, hsl(205 60% 80%), hsl(205 60% 80%))",
    pageBg: "linear-gradient(0deg, hsl(205 60% 80%), hsl(205 60% 80%))",
  },

  pink: {
    border: "hsl(340 70% 50% / 0.35)",
    borderActive: "hsl(340 70% 50%)",
    accent: "hsl(340 70% 50%)",
    tileBg: "linear-gradient(0deg, hsl(340 70% 88%), hsl(340 70% 88%))",
    pageBg: "linear-gradient(0deg, hsl(340 70% 88%), hsl(340 70% 88%))",
  },

  languages: {
    border: "hsl(170 55% 38% / 0.4)",
    borderActive: "hsl(170 55% 38%)",
    accent: "hsl(170 55% 38%)",
    // Use a static deep-navy gradient for tile mirroring; page uses canvas below.
    tileBg: "linear-gradient(135deg, hsl(215 40% 18%), hsl(220 55% 8%) 70%)",
    pageBg: "", // handled by LanguagesTheme canvas; leave empty
    ink: "hsl(170 55% 38%)",
  },
};

/** Apply CSS vars for a given theme id. Call this when changing theme. */
export function applyThemeTokens(id: ThemeId) {
  const t = THEME_STYLES[id];
  const root = document.documentElement;
  root.style.setProperty("--rtcl-border", t.border);
  root.style.setProperty("--rtcl-border-active", t.borderActive);
  root.style.setProperty("--rtcl-accent", t.accent);
  if (t.ink) root.style.setProperty("--rtcl-ink", t.ink);
  else root.style.removeProperty("--rtcl-ink");
}

/**
 * Utility: returns the background token that tiles should use to "mirror" the page.
 * (Use with background-attachment: fixed; background-position: center; background-size: cover)
 */
export function tileBackgroundToken(id: ThemeId) {
  return THEME_STYLES[id].tileBg || "";
}

/**
 * Utility: returns the background token the page should use for non-animated themes.
 * Languages returns "", because its page background is rendered by the LanguagesTheme canvas.
 */
export function pageBackgroundToken(id: ThemeId) {
  return THEME_STYLES[id].pageBg || "";
}

/* =========================
   LanguagesTheme (animated)
   ========================= */

/**
 * Animated multilingual glyphs background.
 * - Runs whenever `active` is true (no dependence on dataset).
 * - Does NOT apply global theme tokens; only sets `--rtcl-ink` while active.
 */
export default function LanguagesTheme({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    let rafGlyphs = 0;

    // ink color for glyphs (matches THEME_STYLES.languages.ink)
    const ink = THEME_STYLES.languages.ink || "hsl(170 55% 38%)";
    document.documentElement.style.setProperty("--rtcl-ink", ink);

    const startGlyphs = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const glyphs = Array.from(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
          "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ" +
          "абвгдеёжзийклмнопрстуфхцчшщьыэюя" +
          "אבגדהוזחטיךכלםמןנסעפףץצקרשת" +
          "ابتثجحخدذرزسشصضطظعغفقكلمنهوي" +
          "あいうえおかきくけこさしすせそたちつてとなにぬねの" +
          "アイウエオカキクケコサシスセソタチツテトナニヌネノ" +
          "가각간갇갈감갑같강개객갠갤갬갭갯갱거걱건걷걸검겁것겉게겨경고과국군굴궁권그긍기길김"
      );

      const step = 26; // px between glyphs
      const angle = (-45 * Math.PI) / 180; // tilt grid -45°
      let diag = 0,
        cx = 0,
        cy = 0;
      let cols = 0,
        rows = 0;
      let DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

      // 4-step deterministic cycle per cell to avoid jank
      let stage = 0; // 0..3
      let stageAnchor = performance.now();
      const holdMs = 2000; // visible time for each state
      const fadeMs = 350; // crossfade duration

      const cellHash = (c: number, r: number, k: number) => {
        let v = (c * 73856093) ^ (r * 19349663) ^ (k * 83492791) ^ 1337;
        v >>>= 0;
        return v;
      };
      const glyphIndexAt = (c: number, r: number, k: number) =>
        cellHash(c, r, k) % glyphs.length;

      const resize = () => {
        DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        const { innerWidth: w, innerHeight: h } = window;
        canvas.width = w * DPR;
        canvas.height = h * DPR;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        // rotated square coverage so corners are filled
        diag = Math.hypot(w, h);
        cx = w / 2;
        cy = h / 2;

        // grid sized to rotated space (fixed to viewport; no scroll dependence)
        cols = Math.ceil(diag / step) + 4;
        rows = Math.ceil(diag / step) + 4;
      };

      const draw = () => {
        const w = canvas.width / DPR;
        const h = canvas.height / DPR;

        ctx.save();
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // rotate and draw in a square of side `diag` centered on screen
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.translate(-diag / 2, -diag / 2);

        const currentInk =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--rtcl-ink")
            .trim() || ink;
        ctx.fillStyle = currentInk;
        ctx.font =
          "700 18px 'Rubik', 'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans', 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // timing: hold each stage, then crossfade to next stage
        const now = performance.now();
        let elapsed = now - stageAnchor;
        let alphaA = 1,
          alphaB = 0;
        let nextStage = stage;

        if (elapsed <= holdMs) {
          alphaA = 1;
          alphaB = 0;
          nextStage = (stage + 1) & 3;
        } else if (elapsed <= holdMs + fadeMs) {
          const p = Math.min(1, Math.max(0, (elapsed - holdMs) / fadeMs));
          alphaA = 1 - p;
          alphaB = p;
          nextStage = (stage + 1) & 3;
        } else {
          stage = (stage + 1) & 3;
          stageAnchor = now;
          alphaA = 1;
          alphaB = 0;
          nextStage = (stage + 1) & 3;
        }

        const startX = -step * 2;
        const startY = -step * 2;

        // draw layer A (current stage)
        if (alphaA > 0) {
          ctx.globalAlpha = 0.2 * alphaA;
          for (let r = 0; r < rows; r++) {
            const y = startY + r * step;
            for (let c = 0; c < cols; c++) {
              const x = startX + c * step;
              const giA = glyphIndexAt(c, r, stage);
              ctx.fillText(glyphs[giA], x, y);
            }
          }
        }

        // draw layer B (next stage)
        if (alphaB > 0) {
          ctx.globalAlpha = 0.2 * alphaB;
          for (let r = 0; r < rows; r++) {
            const y = startY + r * step;
            for (let c = 0; c < cols; c++) {
              const x = startX + c * step;
              const giB = glyphIndexAt(c, r, nextStage);
              ctx.fillText(glyphs[giB], x, y);
            }
          }
        }

        ctx.restore();
        rafGlyphs = requestAnimationFrame(draw);
      };

      // init & listeners
      const onResize = () => resize();
      resize();
      window.addEventListener("resize", onResize);

      // start immediately; fonts will swap in when ready
      rafGlyphs = requestAnimationFrame(draw);
      if ((document as any).fonts && typeof (document as any).fonts.load === "function") {
        Promise.allSettled([
          (document as any).fonts.load("700 18px 'Rubik'"),
          (document as any).fonts.load("700 18px 'Noto Sans KR'"),
          (document as any).fonts.load("700 18px 'Noto Sans JP'"),
          (document as any).fonts.load("700 18px 'Noto Sans'"),
        ]).then(() => {});
      }

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(rafGlyphs);
      };
    };

    const stop = startGlyphs();
    return () => {
      // only clear ink we set; do not touch other global tokens
      document.documentElement.style.removeProperty("--rtcl-ink");
    };
  }, [active]);

  return (
    <>
      <div
        className="rtcl-backdrop"
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
      />
      <canvas
        ref={canvasRef}
        className="rtcl-glyphs"
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}
      />
      <div
        className="rtcl-grain"
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
      />
    </>
  );
}

/* =========================
   CSS usage (summary)
   -------------------------
   - For page background on non-animated themes, apply:
       body {
         background-attachment: fixed;
         background-position: center;
         background-repeat: no-repeat;
         background-size: cover;
         background-image: pageBackgroundToken(activeId);
       }
   - For picker tiles, apply the same properties with:
       background-image: tileBackgroundToken(tileId);
   - When active theme is "languages", mount <LanguagesTheme /> once
     (e.g., in your layout) and leave the body background transparent.
   ========================= */