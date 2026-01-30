"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Prompt } from "@/app/components/prompt";

type PromptVariant = "home" | "issues";
type NavDirection = "toIssues" | "toHome";

function variantFromPathname(pathname: string): PromptVariant {
  return pathname === "/issues" ? "issues" : "home";
}

export function PromptShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const variant = useMemo(() => variantFromPathname(pathname), [pathname]);

  const prevVariantRef = useRef<PromptVariant | null>(null);
  const [navState, setNavState] = useState<{
    active: boolean;
    direction: NavDirection | null;
  }>({ active: false, direction: null });

  const promptWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastRectRef = useRef<DOMRect | null>(null);
  const lastPathRef = useRef<string | null>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const prev = prevVariantRef.current;
    prevVariantRef.current = variant;
    if (!prev || prev === variant) return;

    const direction: NavDirection = variant === "issues" ? "toIssues" : "toHome";
    setNavState({ active: true, direction });
    const t = window.setTimeout(() => {
      setNavState({ active: false, direction: null });
    }, 600);
    return () => window.clearTimeout(t);
  }, [variant]);

  useLayoutEffect(() => {
    const wrapper = promptWrapperRef.current;
    if (!wrapper) return;

    // Animate the whole prompt wrapper so the title + suggestions travel with it.
    // We use translate-only to avoid scaling/squashing as the prompt's height
    // changes when extras expand/collapse.
    const el = wrapper;

    const easing =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ease-out-expo")
        .trim() || "cubic-bezier(0.16, 1, 0.3, 1)";

    const nextRect = el.getBoundingClientRect();
    const prevRect = lastRectRef.current;
    const prevPath = lastPathRef.current;

    if (prevRect && prevPath && prevPath !== pathname) {
      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;

      // Cancel any in-flight animation before starting a new one.
      animationRef.current?.cancel();

      el.style.transformOrigin = "top left";
      el.style.willChange = "transform";

      // Apply the "invert" transform synchronously so we don't get a 1-frame
      // flash at the destination before the WAAPI keyframes kick in.
      const invert = `translate(${dx}px, ${dy}px)`;
      el.style.transform = invert;
      // Force a style/layout flush so the browser commits the transform.
      el.getBoundingClientRect();

      const anim = el.animate([{ transform: invert }, { transform: "none" }], {
        duration: 600,
        easing,
        fill: "both",
      });
      animationRef.current = anim;

      const cleanup = () => {
        // Clear inline styles so future measurements reflect the real layout.
        el.style.transform = "";
        el.style.willChange = "";
      };

      anim.addEventListener("finish", cleanup, { once: true });
      anim.addEventListener("cancel", cleanup, { once: true });
    }

    // Record state for the next navigation.
    lastRectRef.current = nextRect;
    lastPathRef.current = pathname;
  }, [pathname, variant]);

  const isIssues = variant === "issues";

  return (
    <div
      className={[
        // Fill the available height so /issues can have its own inner scroller
        // (matching the reference layout) instead of relying on RootLayout's
        // `overflow-y-auto`.
        "relative flex h-full min-h-0 w-full flex-col overflow-x-hidden",
        // Add a little bottom padding so content won't sit behind the fixed composer.
        isIssues ? "pb-32" : "pb-16",
      ].join(" ")}
    >
      {isIssues ? (
        <>
          {/* Top padding + (optional) gradient area wrapper to match reference spacing */}
          <div className="relative w-full px-5 pt-4 md:pt-10">
            {/* The reference has a blurred gradient overlay here; spacing matters most */}
            <div className="relative z-20 mx-auto h-full">
              <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-4" />
            </div>
          </div>

          {/* Inbox area */}
          <div className="-mt-10 flex h-full min-h-0 flex-1 flex-col">
            <div className="mx-auto min-h-0 w-full flex-1">
              <div
                className="min-h-0 h-full w-full overflow-y-auto px-5 pb-4 md:px-0"
                style={{ scrollbarGutter: "stable both-edges" }}
              >
                <div className="mx-auto mt-16 max-w-2xl md:mt-20">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Home: keep the old centered content constraints (no scrolling content yet).
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-6">
          {children}
        </div>
      )}

      <div
        ref={promptWrapperRef}
        className={
          isIssues
            ? // Avoid using CSS transforms for centering in the fixed state.
              // The FLIP animation also uses `transform`, and stacking transforms
              // causes the prompt to "pop" mid-flight when going /issues -> /.
              "fixed inset-x-0 bottom-6 z-40 mx-auto w-full max-w-2xl px-5"
            : // Keep the prompt fixed on home as well so it can't be clipped by
              // the app's scroll container (`overflow-y-auto` in app/layout.tsx).
              // This makes /issues -> / a true reverse of / -> /issues.
              // Include navbar height (~72px) to match the old layout where the
              // prompt sat below the navbar with `pt-[25vh]`.
              "fixed inset-x-0 top-[calc(25vh+72px)] z-40 mx-auto w-full max-w-2xl px-5"
        }
      >
        <Prompt
          variant={variant}
          isNavigating={navState.active}
          navDirection={navState.direction}
        />
      </div>
    </div>
  );
}

