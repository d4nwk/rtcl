// src/components/Backdrop.tsx
"use client";

import React from "react";

export default function Backdrop() {
  return (
    <>
      <div className="rtcl-backdrop" aria-hidden="true" />
      <div className="rtcl-grain" aria-hidden="true" />
    </>
  );
}