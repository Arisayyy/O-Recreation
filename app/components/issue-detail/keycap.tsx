"use client";

import React from "react";

export function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={[
        "bg-surface-weak border-neutral text-orchid-placeholder",
        "hidden h-4 items-center rounded border px-1 shadow-xs md:inline-flex",
        "text-[12px] leading-[17.6px]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

