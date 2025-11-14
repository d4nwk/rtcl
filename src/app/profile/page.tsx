"use client";
// src/app/profile/page.tsx
import Toolbar from "@/components/Toolbar";
import ThemePicker from "@/components/profile/ThemePicker";
import React, { useEffect } from "react";
import { useThemeContext } from "@/context/ThemeContext";
import LanguagesTheme, {
  pageBackgroundToken,
  applyThemeTokens,
  type ThemeId,
} from "@/themes/ThemeRegistry";

/** Fixed, full-viewport layers for every theme.
 *  - Static themes are CSS backgrounds.
 *  - Languages theme is the real animated canvas.
 *  Only the active theme is fully opaque for the page background; others are hidden
 *  (but remain mounted so the picker can "window" into them by clipping).
 */
function ThemeLayers({ active }: { active: ThemeId }) {
  const makeLayer = (id: ThemeId) => {
    if (id === "languages") {
      return (
        <div
          key={id}
          className="rtcl-theme-layer"
          data-theme={id}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            opacity: active === id ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        >
          {/* Always render the real canvas so tiles can window into it */}
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
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: bg || undefined,
          backgroundAttachment: bg ? ("fixed" as const) : undefined,
          backgroundPosition: bg ? ("center" as const) : undefined,
          backgroundRepeat: bg ? ("no-repeat" as const) : undefined,
          backgroundSize: bg ? ("cover" as const) : undefined,
          opacity: active === id ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      />
    );
  };

  // Render the full stack
  return (
    <>
      {(["default", "dark", "blue", "pink", "languages"] as ThemeId[]).map((id) =>
        makeLayer(id)
      )}
    </>
  );
}

export default function ProfilePage() {
  const { theme } = useThemeContext();

  // Ensure the root data attribute and tokens reflect the current theme on load
  useEffect(() => {
    const id = theme as ThemeId;
    const root = document.documentElement;
    root.dataset.rtclTheme = id;
    applyThemeTokens(id);
  }, [theme]);

  return (
    <>
      {/* Render every theme layer once, keep only the selected one visible for the page */}
      <ThemeLayers active={theme as ThemeId} />

      <Toolbar showBack backHref="/" hideProfile />
      <main className="relative z-10 container mx-auto px-4 py-8 space-y-10">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-neutral-600">Personalise your reading experience.</p>
        </header>

        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Appearance</h2>
          <ThemePicker />
        </section>

        {/* Sources / Outlets */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Sources</h2>
          <div className="rounded-2xl border p-4 text-sm text-neutral-700 space-y-3">
            <p>
              Prefer or hide specific outlets per language. We’ll add a full selector here next.
            </p>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50">
                Configure per-language outlets
              </button>
              <span className="text-neutral-500">(coming soon)</span>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Account</h2>
          <div className="rounded-2xl border p-4 text-sm text-neutral-600">
            <p>
              More settings coming soon. If you’d like a setting added, ping me and I’ll wire it up.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}