"use client";

import React, { useLayoutEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarMenu } from "@/app/components/avatar-menu";
import { AltNavbar } from "@/app/components/alt-navbar";

type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  activeMatch?: (pathname: string) => boolean;
};

const homeIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path d="M8.543 2.232a.75.75 0 0 0-1.085 0l-5.25 5.5A.75.75 0 0 0 2.75 9H4v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V9h1.25a.75.75 0 0 0 .543-1.268l-5.25-5.5Z" />
  </svg>
);

const inboxIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path
      fillRule="evenodd"
      d="M4.784 3A2.25 2.25 0 0 0 2.68 4.449L1.147 8.475A2.25 2.25 0 0 0 1 9.276v1.474A2.25 2.25 0 0 0 3.25 13h9.5A2.25 2.25 0 0 0 15 10.75V9.276c0-.274-.05-.545-.147-.801l-1.534-4.026A2.25 2.25 0 0 0 11.216 3H4.784Zm-.701 1.983a.75.75 0 0 1 .7-.483h6.433a.75.75 0 0 1 .701.483L13.447 9h-2.412a1 1 0 0 0-.832.445l-.406.61a1 1 0 0 1-.832.445h-1.93a1 1 0 0 1-.832-.445l-.406-.61A1 1 0 0 0 4.965 9H2.553l1.53-4.017Z"
      clipRule="evenodd"
    />
  </svg>
);

const sentIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path d="M2.87 2.298a.75.75 0 0 0-.812 1.021L3.39 6.624a1 1 0 0 0 .928.626H8.25a.75.75 0 0 1 0 1.5H4.318a1 1 0 0 0-.927.626l-1.333 3.305a.75.75 0 0 0 .811 1.022 24.89 24.89 0 0 0 11.668-5.115.75.75 0 0 0 0-1.175A24.89 24.89 0 0 0 2.869 2.298Z" />
  </svg>
);

const doneIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path
      fillRule="evenodd"
      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const brandIcon = (
  <svg
    width="33"
    height="32"
    viewBox="0 0 33 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.482 4.9941C11.482 9.92807 15.083 13.1935 16.1491 14.0522C16.3238 14.1928 16.5623 14.1928 16.737 14.0522C17.8031 13.1936 21.4042 9.92836 21.4042 4.9944C21.4042 1.56245 19.7713 -1.73564e-06 16.443 0C13.1147 -1.59101e-06 11.482 1.56215 11.482 4.9941Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M26.2426 8.53282C21.5811 10.0575 19.6088 14.5141 19.1271 15.8002C19.0481 16.0109 19.1218 16.2393 19.3087 16.363C20.4493 17.1184 24.647 19.557 29.3084 18.0323C32.5508 16.9718 33.5224 14.9257 32.4939 11.7392C31.4654 8.55276 29.485 7.47229 26.2426 8.53282Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M27.4606 23.758C24.5797 19.7663 19.7597 19.2552 18.3958 19.1914C18.1724 19.1809 17.9794 19.3221 17.9202 19.5392C17.559 20.8647 16.5523 25.637 19.4332 29.6287C21.4371 32.4052 23.6704 32.7031 26.3631 30.7338C29.0557 28.7644 29.4645 26.5345 27.4606 23.758Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.4528 29.6289C16.3337 25.6373 15.3271 20.8648 14.966 19.5393C14.9068 19.3221 14.7138 19.1809 14.4903 19.1914C13.1265 19.2552 8.30664 19.7661 5.42571 23.7577C3.4218 26.5342 3.83048 28.7644 6.52313 30.7338C9.21577 32.7031 11.4489 32.4054 13.4528 29.6289Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.57743 18.0322C8.23887 19.5569 12.4367 17.1184 13.5774 16.3631C13.7643 16.2393 13.838 16.0109 13.7591 15.8002C13.2774 14.5142 11.3053 10.0576 6.64384 8.53291C3.40145 7.47238 1.42072 8.55281 0.392221 11.7393C-0.63628 14.9257 0.335035 16.9717 3.57743 18.0322Z"
      fill="currentColor"
    />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: homeIcon,
    activeMatch: (p) => p === "/",
  },
  {
    href: "/issues",
    label: "Issues",
    icon: inboxIcon,
    activeMatch: (p) => p === "/issues",
  },
  {
    href: "/issues/sent",
    label: "Sent",
    icon: sentIcon,
    activeMatch: (p) => p === "/issues/sent",
  },
  {
    href: "/issues/completed",
    label: "Done",
    icon: doneIcon,
    activeMatch: (p) => p === "/issues/completed",
  },
];

function isItemActive(item: NavItem, pathname: string) {
  if (item.activeMatch) return item.activeMatch(pathname);
  return false;
}

export function Navbar() {
  const pathname = usePathname();
  const isChatRoute = useMemo(() => pathname === "/chat" || pathname.startsWith("/chat/"), [pathname]);
  const isIssueDetailRoute = useMemo(() => {
    if (!pathname.startsWith("/issues/")) return false;
    const parts = pathname.split("/");
    if (parts.length !== 3) return false;
    const idOrRoute = parts[2];
    if (!idOrRoute) return false;
    return idOrRoute !== "sent" && idOrRoute !== "completed";
  }, [pathname]);

  const activeHref = useMemo(() => {
    const activeItem = NAV_ITEMS.find((item) => isItemActive(item, pathname));
    return activeItem?.href ?? null;
  }, [pathname]);

  const navListRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const lastIndicatorRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const lastPathRef = useRef<string | null>(null);
  const animationRef = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    if (isIssueDetailRoute || isChatRoute) return;

    const navList = navListRef.current;
    const indicator = indicatorRef.current;
    if (!navList || !indicator) return;

    const easing =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ease-out-expo")
        .trim() || "cubic-bezier(0.16, 1, 0.3, 1)";

    const href = activeHref;
    if (!href) {
      indicator.style.opacity = "0";
      lastIndicatorRef.current = null;
      lastPathRef.current = pathname;
      return;
    }

    const target = itemRefs.current.get(href);
    if (!target) return;

    const listRect = navList.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const next = {
      x: r.left - listRect.left,
      y: r.top - listRect.top,
      width: r.width,
      height: r.height,
    };

    const apply = (s: typeof next) => {
      indicator.style.transform = `translate(${s.x}px, ${s.y}px)`;
      indicator.style.width = `${s.width}px`;
      indicator.style.height = `${s.height}px`;
    };

    indicator.style.opacity = "1";
    indicator.style.willChange = "transform, width, height";

    const prev = lastIndicatorRef.current;
    const prevPath = lastPathRef.current;

    if (prev && prevPath && prevPath !== pathname) {
      animationRef.current?.cancel();

      apply(prev);
      indicator.getBoundingClientRect();

      const anim = indicator.animate(
        [
          {
            transform: `translate(${prev.x}px, ${prev.y}px)`,
            width: `${prev.width}px`,
            height: `${prev.height}px`,
          },
          {
            transform: `translate(${next.x}px, ${next.y}px)`,
            width: `${next.width}px`,
            height: `${next.height}px`,
          },
        ],
        { duration: 450, easing, fill: "both" },
      );
      animationRef.current = anim;

      const cleanup = () => {
        indicator.style.willChange = "";
      };
      anim.addEventListener("finish", cleanup, { once: true });
      anim.addEventListener("cancel", cleanup, { once: true });
    } else {
      apply(next);
      indicator.style.willChange = "";
    }

    lastIndicatorRef.current = next;
    lastPathRef.current = pathname;
  }, [activeHref, pathname, isIssueDetailRoute, isChatRoute]);

  if (isIssueDetailRoute) return null;
  if (isChatRoute) return <AltNavbar closeHref="/" layout="sticky" pushContent={false} />;

  return (
    <nav
      className={[
        // Keep visible while scrolling (issues/sent/done pages use nested scrolling).
        "sticky top-0 z-80 flex-none py-5 px-6",
        // Ensure content doesn't visually overlap the bar.
        "bg-background",
        "font-orchid-ui leading-6",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex flex-1 items-start">
          <Link href="/" className="block cursor-pointer text-orchid-ink">
            {brandIcon}
          </Link>
        </div>

        {/* Nav */}
        <div
          ref={navListRef}
          className="relative flex items-center justify-center gap-0.5"
        >
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 rounded-orchid-pill bg-orchid-surface"
            style={{
              opacity: 0,
              transform: "translate(0px, 0px)",
              width: 0,
              height: 0,
            }}
          />
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item, pathname);
            const textClass = active ? "text-orchid-ink" : "text-orchid-muted";
            const iconClass = active ? "text-orchid-ink" : "text-orchid-muted";

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative block cursor-pointer no-underline"
              >
                <span
                  ref={(node) => {
                    if (node) itemRefs.current.set(item.href, node);
                    else itemRefs.current.delete(item.href);
                  }}
                  className={[
                    "relative z-10 flex items-center justify-center gap-1.5",
                    "py-1.5 px-3",
                    "text-[14px] font-medium leading-5",
                    "transition-colors duration-150 ease-in-out",
                    textClass,
                  ].join(" ")}
                >
                  {item.icon && <span className={iconClass}>{item.icon}</span>}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* User menu */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <AvatarMenu avatarInitial="A" align="end" />
        </div>
      </div>
    </nav>
  );
}

