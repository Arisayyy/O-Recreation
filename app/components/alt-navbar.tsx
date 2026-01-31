"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarMenu } from "@/app/components/avatar-menu";
import { XIcon } from "@/app/components/icons/x-icon";
import {
  semiGhostButtonBaseClass,
  semiGhostButtonBgClass,
  semiGhostButtonInnerClass,
} from "@/app/components/issue-detail/semi-ghost-button";

const keycapClass = "bg-surface-weak border-neutral text-orchid-placeholder shadow-xs";
const navTitleClass = "min-w-0 flex-1 truncate text-sm leading-[21px] text-copy";

export function AltNavbar({
  closeHref = "/",
  onCloseAction,
  leftLabel = "ESC",
  title,
  rightActions,
  avatarInitial = "A",
  showKeycap = true,
  layout = "flow",
  pushContent = true,
  className,
}: {
  closeHref?: string;
  onCloseAction?: () => void;
  leftLabel?: string;
  title?: React.ReactNode;
  rightActions?: React.ReactNode;
  avatarInitial?: string;
  showKeycap?: boolean;
  layout?: "flow" | "sticky";
  pushContent?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const navRef = useRef<HTMLElement | null>(null);
  const [navHeight, setNavHeight] = useState(0);

  const handleClose = React.useCallback(() => {
    if (onCloseAction) {
      onCloseAction();
      return;
    }
    router.push(closeHref);
  }, [closeHref, onCloseAction, router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  useLayoutEffect(() => {
    if (layout !== "sticky") return;

    const el = navRef.current;
    if (!el) return;

    const update = () => {
      const h = el.getBoundingClientRect().height;
      setNavHeight((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [layout]);

  const isSticky = layout === "sticky";

  return (
    <>
      <nav
        ref={navRef}
        className={[
          "z-50 px-6 py-5 font-orchid-ui leading-6",
          // Use fixed positioning so it stays visible even with nested scroll containers.
          isSticky ? "fixed inset-x-0 top-0 bg-transparent" : "relative",
          className ?? "",
        ].join(" ")}
      >
        <div className="flex items-center gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              className={[semiGhostButtonBaseClass, "px-[6px]"].join(" ")}
              onClick={handleClose}
            >
              <div className={semiGhostButtonBgClass} />
              <div className={semiGhostButtonInnerClass + " pointer-events-none"}>
                <XIcon className="h-4 w-4" />
                <span className="px-[2px]">
                  <span className="sr-only">Go back</span>
                </span>
                {showKeycap ? (
                  <span
                    className={[
                      keycapClass,
                      "inline-flex h-4 items-center rounded border px-1",
                      "text-[12px] leading-[17.6px]",
                    ].join(" ")}
                  >
                    {leftLabel}
                  </span>
                ) : null}
              </div>
            </button>

            {title ? <div className={navTitleClass}>{title}</div> : null}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {rightActions ? <div className="flex items-center gap-2">{rightActions}</div> : null}
            <div className="flex">
              <AvatarMenu avatarInitial={avatarInitial} align="end" />
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to keep content from hiding under a fixed bar (optional). */}
      {isSticky && pushContent ? <div aria-hidden style={{ height: navHeight }} /> : null}
    </>
  );
}

