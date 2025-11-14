"use client";
import React from "react";
import LanguagesTheme from "@/themes/LanguagesTheme";

export default function PreviewThemesMount() {
  const layerBase: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 20,
    willChange: "clip-path",
    clipPath: "polygon(0 0,0 0,0 0,0 0)",
  };
  return (
    <>
      {/* Default (white) theme layer */}
      <div
        className="rtcl-preview-layer"
        data-rtcl-theme="default"
        style={{ ...layerBase, backgroundColor: "#fff" }}
      />
      {/* Languages (animated glyphs) theme layer */}
      <div
        className="rtcl-preview-layer"
        data-rtcl-theme="languages"
        style={layerBase}
      >
        <LanguagesTheme />
      </div>
    </>
  );
}
