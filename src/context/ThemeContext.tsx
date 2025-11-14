"use client";

/**
 * Central theme context for rtcl.
 * - Tracks the selected theme across the session (localStorage-backed).
 * - Applies CSS tokens and the document dataset for CSS-only hooks.
 * - Exposes <ThemeLayers/> which renders fixed full-viewport layers for all themes,
 *   showing only the active one as the page background while keeping others mounted
 *   (so the ThemePicker can "window" into them via clip-path).
 *
 * Usage:
 *   <ThemeProvider>
 *     <ThemeLayers />   // mount once per page (e.g., in layout or on Profile)
 *     ...app...
 *   </ThemeProvider>
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Theme registry (IDs, tokens, helpers, Languages canvas)
import LanguagesTheme, {
  type ThemeId,
  THEME_STYLES,
  applyThemeTokens,
  pageBackgroundToken,
} from "@/themes/ThemeRegistry";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  isDefault: boolean;
  available: { id: ThemeId; label: string; description?: string }[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "rtcl.theme";

/** Human labels shown in pickers (derive descriptions from registry where present) */
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

function readSavedTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (raw && (raw in THEME_STYLES)) return raw as ThemeId;
  } catch {}
  return "default";
}

function writeSavedTheme(id: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

/** Apply current selection to DOM (dataset + tokens) */
function applyDomTheme(id: ThemeId) {
  const root = document.documentElement;
  root.dataset.rtclTheme = id;
  applyThemeTokens(id);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("default");

  // Hydrate once from storage, then reflect into DOM tokens
  useEffect(() => {
    const saved = readSavedTheme();
    setThemeState(saved);
    applyDomTheme(saved);
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    writeSavedTheme(id);
    applyDomTheme(id);
  };

  const value: ThemeContextValue = useMemo(
    () => ({
      theme,
      setTheme,
      isDefault: theme === "default",
      available: (Object.keys(THEME_STYLES) as ThemeId[]).map((id) => ({
        id,
        label: LABELS[id] ?? id,
        description: DESCRIPTIONS[id],
      })),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}

/** Fixed, full-viewport layers for every theme. */
export function ThemeLayers() {
  const { theme } = useThemeContext();

  const makeLayer = (id: ThemeId) => {
    if (id === "languages") {
      return (
        <div
          key={id}
          className="rtcl-theme-layer"
          data-theme={id}
          data-active={theme === id ? "1" : "0"}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            opacity: theme === id ? 1 : 0,
            transition: "opacity 200ms ease",
            zIndex: theme === id ? 1 : 0,
          }}
        >
          {/* Keep mounted so preview windows work; canvas draws only when active */}
          <LanguagesTheme active={true} />
        </div>
      );
    }

    const bg = pageBackgroundToken(id);
    return (
      <div
        key={id}
        className="rtcl-theme-layer"
        data-theme={id}
        data-active={theme === id ? "1" : "0"}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: bg || undefined,
          backgroundAttachment: bg ? ("fixed" as const) : undefined,
          backgroundPosition: bg ? ("center" as const) : undefined,
          backgroundRepeat: bg ? ("no-repeat" as const) : undefined,
          backgroundSize: bg ? ("cover" as const) : undefined,
          opacity: theme === id ? 1 : 0,
          transition: "opacity 200ms ease",
          zIndex: theme === id ? 1 : 0,
        }}
      />
    );
  };

  return (
    <>
      {(["default", "dark", "blue", "pink", "languages"] as ThemeId[]).map((id) =>
        makeLayer(id)
      )}
    </>
  );
}