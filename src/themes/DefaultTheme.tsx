// src/themes/DefaultTheme.tsx
export const DEFAULT_THEME_STYLES = {
  border: "hsl(0 0% 80%)",          // light grey
  borderActive: "hsl(0 0% 0%)",     // black
  accent: "hsl(0 0% 0%)",           // black accent
};

export function applyDefaultTheme() {
  const root = document.documentElement;
  root.dataset.rtclTheme = "default";

  // Clear any old theme variables
  root.style.removeProperty("--rtcl-ink");
  root.style.removeProperty("--rtcl-border");
  root.style.removeProperty("--rtcl-border-active");
  root.style.removeProperty("--rtcl-accent");

  // Apply default theme colors
  root.style.setProperty("--rtcl-border", DEFAULT_THEME_STYLES.border);
  root.style.setProperty("--rtcl-border-active", DEFAULT_THEME_STYLES.borderActive);
  root.style.setProperty("--rtcl-accent", DEFAULT_THEME_STYLES.accent);
}