// src/components/profile/ThemePicker.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useThemeContext } from "@/context/ThemeContext";

// Centralized theme registry
import {
  type ThemeId,
  THEME_STYLES,
  applyThemeTokens,
} from "@/themes/ThemeRegistry";

type Option = { id: ThemeId; label: string; description?: string };

// Human-friendly labels/descriptions for known themes
const LABELS: Record<ThemeId, string> = {
  default: "Current (default app theme)",
  dark: "Dark",
  blue: "Blue",
  pink: "Pink",
  languages: "Languages (animated glyphs)",
};

const DESCRIPTIONS: Partial<Record<ThemeId, string>> = {
  default: "No extra background",
  dark: "Dimmed UI with light text",
  blue: "Crisp blue accents and backdrop",
  pink: "Warm pink accents and backdrop",
  languages: "Subtle rotating multilingual glyphs",
};

// Derive options directly from the registry so the list auto-expands
const OPTIONS: Option[] = (Object.keys(THEME_STYLES) as ThemeId[]).map((id) => ({
  id,
  label: LABELS[id] ?? id,
  description: DESCRIPTIONS[id],
}));

export default function ThemePicker() {
  const { theme, setTheme } = useThemeContext();

  const handleSelect = (id: ThemeId) => {
    const root = document.documentElement;
    root.dataset.rtclTheme = id; // for CSS hooks
    applyThemeTokens(id); // update border/accent/ink tokens
    setTheme(id); // update app state
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Choose an optional background theme. By default, no extra background is applied.
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <OptionRow
            key={opt.id}
            option={opt}
            isSelected={theme === opt.id}
            activeTheme={theme}
            onSelect={() => handleSelect(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Clip the global theme layer to the tile's rect so the tile becomes a "window".
 */
function useLayerWindow(
  tileRef: React.RefObject<HTMLElement>,
  themeId: ThemeId,
  activeTheme: ThemeId
) {
  useEffect(() => {
    const tile = tileRef.current;
    if (!tile) return;

    const layer = document.querySelector<HTMLDivElement>(
      `.rtcl-theme-layer[data-theme="${themeId}"]`
    );
    if (!layer) return;

    const setPreviewState = (on: boolean) => {
      if (on) {
        layer.setAttribute("data-preview", "1");
        layer.style.opacity = "1";
        layer.style.zIndex = "2";
      } else {
        layer.removeAttribute("data-preview");
        layer.style.opacity = "";
        layer.style.zIndex = "";
        layer.style.clipPath = "";
      }
    };

    let raf = 0;

    const applyClip = () => {
      const rect = tile.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Convert rect -> clip-path inset(top right bottom left)
      const top = Math.max(0, rect.top);
      const left = Math.max(0, rect.left);
      const right = Math.max(0, vw - rect.right);
      const bottom = Math.max(0, vh - rect.bottom);

      // Round radius to match our tile rounding
      const radius = 16;

      if (activeTheme !== themeId) {
        layer.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`;
        setPreviewState(true);
      } else {
        setPreviewState(false);
      }
    };

    const onMove = () => {
      // apply immediately for zero-lag feel
      applyClip();
      // and once again next frame to catch coalesced layout
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        applyClip();
      });
    };

    // initial and observers
    applyClip();
    const ro = new ResizeObserver(onMove);
    ro.observe(tile);
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
      if (raf) cancelAnimationFrame(raf);

      setPreviewState(false);
    };
  }, [tileRef, themeId, activeTheme]);
}

function OptionRow({
  option,
  isSelected,
  activeTheme,
  onSelect,
}: {
  option: Option;
  isSelected: boolean;
  activeTheme: ThemeId;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Make this tile a live window into the corresponding global layer
  useLayerWindow(ref, option.id, activeTheme);

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className="relative rounded-2xl border-2 p-4 cursor-pointer transition-colors"
      style={{
        // selection ring color
        borderColor: isSelected ? "#3b82f6" : "#e5e5e5",
        // Tile itself is transparent; the background comes from the clipped global layer
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      {/* subtle legibility scrim so the text is readable over any background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "1rem",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,.10), rgba(255,255,255,.05))",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div className="relative z-10 flex items-start gap-3">
        <div className="mt-0.5">
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white/60 backdrop-blur-[1px]"
            style={{ borderColor: isSelected ? "#3b82f6" : "#d4d4d4" }}
          >
            {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500" />}
          </div>
        </div>

        <div className="flex-1">
          <div className="font-medium">{option.label}</div>
          {option.description && (
            <div className="text-sm text-neutral-700 mt-0.5">{option.description}</div>
          )}
        </div>
      </div>
    </div>
  );
}
