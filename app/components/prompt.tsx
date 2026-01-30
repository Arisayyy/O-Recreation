"use client";

import React from "react";
import { Playfair_Display } from "next/font/google";
import { useMemo, useRef, useState } from "react";

const playfairDisplay = Playfair_Display({
  weight: ["500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair-display",
});

const SUGGESTIONS = [
  "What's new?",
  "Draft an email to emails that need a response",
  "What can you do?",
] as const;

export function Prompt() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isEmpty = useMemo(() => value.trim().length === 0, [value]);

  return (
    <div
      className={[
        playfairDisplay.variable,
        "flex w-full flex-col",
        "font-orchid-ui",
        "leading-6",
      ].join(" ")}
    >
      <h1
        className={[
          "m-0 pb-6 text-center font-medium",
          "text-[48px] leading-[48px]",
          "text-orchid-ink",
          "font-orchid-display",
        ].join(" ")}
      >
        Hey, Orchid Team!
      </h1>

      <div className="relative z-10">
        <div className="rounded-orchid-prompt-outer bg-orchid-surface p-[2px] transition-shadow duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]">
          {/* Collapsed spacer block (kept to preserve original structure) */}
          <div className="grid grid-cols-[628px] grid-rows-[0px] overflow-hidden transition-[transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0,0,0.2,1)]">
            <div className="px-2 py-1" />
          </div>

          <div className="rounded-orchid-prompt-inner bg-white shadow-orchid-prompt">
            <div className="pl-[6px]">
              <div className="flex items-center pr-2">
                <div
                  className="relative flex-1 cursor-text pl-[6px]"
                  onMouseDown={(e) => {
                    // Make the whole area behave like a textbox click target.
                    e.preventDefault();
                    textareaRef.current?.focus();
                  }}
                >
                  <div className="relative grid h-10 w-full grid-cols-1 grid-rows-1 overflow-hidden">
                    <textarea
                      ref={textareaRef}
                      value={value}
                      aria-label="Ask anything..."
                      className={[
                        "h-full w-full resize-none bg-transparent p-2",
                        "text-sm leading-[21px] text-orchid-ink",
                        "whitespace-pre-wrap break-words",
                        "outline-none",
                        "overflow-hidden",
                      ].join(" ")}
                      onChange={(e) => setValue(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />

                    {/* Overlay placeholder (matches original positioning + hide-on-focus behavior) */}
                    <div
                      className={[
                        "pointer-events-none absolute left-2 top-2",
                        "h-[21px] w-auto overflow-hidden whitespace-nowrap",
                        "text-sm leading-[21px] text-orchid-placeholder",
                        !isEmpty || isFocused ? "opacity-0" : "opacity-100",
                      ].join(" ")}
                    >
                      Ask anything...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsed sections (kept to preserve original structure) */}
            <div className="grid grid-rows-[0px] overflow-hidden transition-[transform,translate,scale,rotate] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]" />
            <div className="flex-1 overflow-auto" />
          </div>

          <input ref={fileInputRef} multiple type="file" className="hidden" />

          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative inline-flex h-7 flex-none items-center rounded-orchid-pill px-1.5 py-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-2 rounded-orchid-pill bg-orchid-surface-2 blur-[8px] opacity-0" />
                <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 fill-orchid-muted"
                  >
                    <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                  </svg>
                  <span className="px-[2px]">Add files</span>
                </div>
              </button>

              <button
                type="button"
                disabled
                className="relative inline-flex h-7 flex-none items-center rounded-orchid-pill px-1.5 py-0 opacity-50"
              >
                <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 fill-orchid-muted"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.89 4.111a5.5 5.5 0 1 0 0 7.778.75.75 0 1 1 1.06 1.061A7 7 0 1 1 15 8a2.5 2.5 0 0 1-4.083 1.935A3.5 3.5 0 1 1 11.5 8a1 1 0 0 0 2 0 5.48 5.48 0 0 0-1.61-3.889ZM10 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="px-[2px]">Add context</span>
                  <span className="pointer-events-none inline-flex items-center pr-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 overflow-hidden rounded-[6px] shadow-[0_0_0_2px_var(--color-orchid-surface)]"
                    >
                      <rect width="16" height="16" fill="#533AFD" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M4.3 11.7L11.7 10.1307V4.3L4.3 5.88765V11.7Z"
                        fill="white"
                      />
                    </svg>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="-ml-2 h-4 w-4 overflow-hidden rounded-[6px] shadow-[0_0_0_2px_var(--color-orchid-surface)]"
                    >
                      <rect width="16" height="16" fill="black" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.00495 1.99997C4.69699 1.99997 2.02283 4.74997 2.02283 8.1521C2.02283 10.8716 3.73626 13.1736 6.11324 13.9883C6.41042 14.0496 6.51928 13.856 6.51928 13.6931C6.51928 13.5505 6.50948 13.0616 6.50948 12.5522C4.8454 12.919 4.49887 11.8188 4.49887 11.8188C4.23144 11.1058 3.83519 10.9226 3.83519 10.9226C3.29054 10.5457 3.87487 10.5457 3.87487 10.5457C4.47903 10.5865 4.79605 11.1772 4.79605 11.1772C5.33079 12.1142 6.19246 11.8495 6.53911 11.6865C6.58858 11.2892 6.74715 11.0142 6.91552 10.8615C5.5883 10.7188 4.19189 10.1892 4.19189 7.8261C4.19189 7.15385 4.42944 6.60385 4.80585 6.1761C4.74646 6.02335 4.53842 5.39172 4.86536 4.54634C4.86536 4.54634 5.37046 4.38334 6.50936 5.17784C6.99696 5.04318 7.49982 4.97467 8.00495 4.97409C8.51005 4.97409 9.02495 5.04547 9.50042 5.17784C10.6394 4.38334 11.1445 4.54634 11.1445 4.54634C11.4715 5.39172 11.2633 6.02335 11.2039 6.1761C11.5903 6.60385 11.818 7.15385 11.818 7.8261C11.818 10.1892 10.4216 10.7086 9.08446 10.8615C9.30242 11.055 9.4905 11.4216 9.4905 12.0022C9.4905 12.8272 9.48071 13.4893 9.48071 13.693C9.48071 13.856 9.58968 14.0496 9.88675 13.9885C12.2637 13.1735 13.9772 10.8716 13.9772 8.1521C13.987 4.74997 11.303 1.99997 8.00495 1.99997Z"
                        fill="white"
                      />
                    </svg>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="-ml-2 h-4 w-4 overflow-hidden rounded-[6px] shadow-[0_0_0_2px_var(--color-orchid-surface)]"
                    >
                      <rect width="16" height="16" fill="#5E6AD2" />
                      <path
                        d="M3.01004 8.52407C3.12544 9.62576 3.60532 10.6966 4.44965 11.5409C5.29398 12.3852 6.36476 12.8651 7.4665 12.9805L3.01004 8.52407Z"
                        fill="white"
                      />
                      <path
                        d="M2.99048 7.7175L8.27303 13C8.72131 12.9749 9.16681 12.8899 9.59661 12.7448L3.24564 6.39391C3.10063 6.82368 3.01558 7.26922 2.99048 7.7175Z"
                        fill="white"
                      />
                      <path
                        d="M3.47309 5.83434L10.1561 12.5174C10.5028 12.3513 10.8344 12.143 11.1431 11.8924L4.09805 4.84741C3.84754 5.15609 3.63921 5.48764 3.47309 5.83434Z"
                        fill="white"
                      />
                      <path
                        d="M4.47254 4.43479C6.43033 2.50155 9.58463 2.50913 11.533 4.45754C13.4814 6.40594 13.489 9.5602 11.5558 11.518L4.47254 4.43479Z"
                        fill="white"
                      />
                    </svg>
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isEmpty}
                className={[
                  "relative inline-flex h-7 flex-none items-center rounded-orchid-pill px-1.5 py-0",
                  isEmpty ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                ].join(" ")}
              >
                <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                  <span className="px-[2px]">Go</span>
                  <span className="inline-flex items-center rounded-orchid-keycap border border-orchid-border bg-orchid-surface-3 px-1 text-[12px] leading-[17.6px] text-orchid-placeholder shadow-orchid-keycap">
                    ↵
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className={[
              "group/button focus-visible:ring-neutral-strong",
              "relative inline-flex h-7 flex-none cursor-pointer items-center rounded-orchid-pill px-1.5",
              "whitespace-nowrap outline-none transition-transform select-none focus-visible:ring-2",
            ].join(" ")}
          >
            <div
              className={[
                "absolute inset-0 rounded-orchid-pill border !border-neutral !border-[1px] shadow-xs transition-transform",
                "bg-gradient-to-t from-surface to-surface",
                "group-hover/button:to-surface-weak",
                "group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle",
              ].join(" ")}
            />
            <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
              <span className="px-[2px]">{label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
