"use client";

export const LANGUAGES_THEME_STYLES = {
  border: "hsl(170 55% 38% / 0.4)",
  borderActive: "hsl(170 55% 38%)",
  accent: "hsl(170 55% 38%)",
};

import React, { useEffect, useRef } from "react";

/**
 * LanguagesTheme
 * Animated multilingual glyphs background (opt-in via ThemeContext).
 * Mounts fixed, below interactive content. No default side effects unless selected.
 */
export default function LanguagesTheme() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const isActive = root.dataset.rtclTheme === "languages";
    if (!isActive) return;

    let rafGlyphs = 0;

    // Set a fixed teal ink for glyphs via CSS var
    const setInk = () => {
      document.documentElement.style.setProperty("--rtcl-ink", "hsl(170 55% 38%)");
    };
    setInk();

    // Apply theme border/accent variables
    root.style.setProperty("--rtcl-border", LANGUAGES_THEME_STYLES.border);
    root.style.setProperty("--rtcl-border-active", LANGUAGES_THEME_STYLES.borderActive);
    root.style.setProperty("--rtcl-accent", LANGUAGES_THEME_STYLES.accent);

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
      const angle = -45 * Math.PI / 180; // tilt grid -45°
      let diag = 0, cx = 0, cy = 0;
      let cols = 0, rows = 0;
      let DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

      // 4-step deterministic cycle per cell to avoid jank
      let stage = 0;                      // 0..3 (which glyph in the sequence)
      let stageAnchor = performance.now();
      const holdMs = 2000;               // visible time for each state
      const fadeMs = 350;                // crossfade duration between states

      const cellHash = (c: number, r: number, k: number) => {
        let v = c * 73856093 ^ r * 19349663 ^ k * 83492791 ^ 1337;
        v >>>= 0;
        return v;
      };
      const glyphIndexAt = (c: number, r: number, k: number) => {
        return cellHash(c, r, k) % glyphs.length;
      };

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
        cx = w / 2; cy = h / 2;

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

        const ink = getComputedStyle(document.documentElement)
          .getPropertyValue("--rtcl-ink")
          .trim() || "hsl(170 55% 38%)";
        ctx.fillStyle = ink;
        ctx.font = "700 18px 'Rubik', 'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans', 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // timing: hold each stage, then crossfade to next stage
        const now = performance.now();
        let elapsed = now - stageAnchor;
        let alphaA = 1, alphaB = 0;
        let nextStage = stage;

        if (elapsed <= holdMs) {
          alphaA = 1; alphaB = 0; nextStage = (stage + 1) & 3;
        } else if (elapsed <= holdMs + fadeMs) {
          const p = Math.min(1, Math.max(0, (elapsed - holdMs) / fadeMs));
          alphaA = 1 - p;
          alphaB = p;
          nextStage = (stage + 1) & 3;
        } else {
          stage = (stage + 1) & 3;
          stageAnchor = now;
          alphaA = 1; alphaB = 0; nextStage = (stage + 1) & 3;
        }

        const startX = -step * 2;
        const startY = -step * 2;

        // draw layer A (current stage)
        if (alphaA > 0) {
          ctx.globalAlpha = 0.20 * alphaA;
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
          ctx.globalAlpha = 0.20 * alphaB;
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

      const start = () => { rafGlyphs = requestAnimationFrame(draw); };

      // init & listeners
      const onResize = () => {
        // re-run resize computations before drawing again
        resize();
      };
      resize();
      window.addEventListener("resize", onResize);

      if ((document as any).fonts && typeof (document as any).fonts.load === "function") {
        Promise.allSettled([
          (document as any).fonts.load("700 18px 'Rubik'"),
          (document as any).fonts.load("700 18px 'Noto Sans KR'"),
          (document as any).fonts.load("700 18px 'Noto Sans JP'"),
          (document as any).fonts.load("700 18px 'Noto Sans'"),
        ]).finally(start);
      } else {
        start();
      }

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(rafGlyphs);
      };
    };

    const stop = startGlyphs();
    return () => {
      cancelAnimationFrame(rafGlyphs);
      root.style.removeProperty("--rtcl-border");
      root.style.removeProperty("--rtcl-border-active");
      root.style.removeProperty("--rtcl-accent");
    };
  }, []);

  return (
    <>
      {/* subtle gradient (optional – hook up your CSS classes if you already had them) */}
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