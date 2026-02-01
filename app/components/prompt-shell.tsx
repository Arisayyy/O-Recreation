"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Prompt } from "@/app/components/prompt";
import { ChatProvider } from "@/app/components/chat/chat-context";
import { FirstMessageSendAnimationProvider } from "@/app/components/chat/first-message-send-animation";
import { IssueChatProvider } from "@/app/components/issue-detail/issue-chat-context";

type PromptVariant = "home" | "issues" | "chat";
type NavDirection = "toIssues" | "toHome";

function ConversationPromptBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none fixed right-0 bottom-0 z-10",
        className ?? "inset-x-0",
      ].join(" ")}
      style={{ height: 200 }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to top, var(--background-color-neutral) 0%, transparent 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            WebkitMaskImage:
              "linear-gradient(to top, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 12.5%)",
            maskImage:
              "linear-gradient(to top, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 12.5%)",
            WebkitBackdropFilter: "blur(20px)",
            backdropFilter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            WebkitMaskImage:
              "linear-gradient(to top, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgba(0, 0, 0, 0) 25%)",
            maskImage:
              "linear-gradient(to top, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgba(0, 0, 0, 0) 25%)",
            WebkitBackdropFilter: "blur(11.81px)",
            backdropFilter: "blur(11.81px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0) 37.5%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0) 37.5%)",
            WebkitBackdropFilter: "blur(6.97px)",
            backdropFilter: "blur(6.97px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 12.5%, rgb(0, 0, 0) 25%, rgb(0, 0, 0) 37.5%, rgba(0, 0, 0, 0) 50%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 12.5%, rgb(0, 0, 0) 25%, rgb(0, 0, 0) 37.5%, rgba(0, 0, 0, 0) 50%)",
            WebkitBackdropFilter: "blur(4.12px)",
            backdropFilter: "blur(4.12px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 25%, rgb(0, 0, 0) 37.5%, rgb(0, 0, 0) 50%, rgba(0, 0, 0, 0) 62.5%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 25%, rgb(0, 0, 0) 37.5%, rgb(0, 0, 0) 50%, rgba(0, 0, 0, 0) 62.5%)",
            WebkitBackdropFilter: "blur(2.43px)",
            backdropFilter: "blur(2.43px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 6,
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 37.5%, rgb(0, 0, 0) 50%, rgb(0, 0, 0) 62.5%, rgba(0, 0, 0, 0) 75%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 37.5%, rgb(0, 0, 0) 50%, rgb(0, 0, 0) 62.5%, rgba(0, 0, 0, 0) 75%)",
            WebkitBackdropFilter: "blur(1.43px)",
            backdropFilter: "blur(1.43px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 7,
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 50%, rgb(0, 0, 0) 62.5%, rgb(0, 0, 0) 75%, rgba(0, 0, 0, 0) 87.5%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 50%, rgb(0, 0, 0) 62.5%, rgb(0, 0, 0) 75%, rgba(0, 0, 0, 0) 87.5%)",
            WebkitBackdropFilter: "blur(0.85px)",
            backdropFilter: "blur(0.85px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 62.5%, rgb(0, 0, 0) 75%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 0) 62.5%, rgb(0, 0, 0) 75%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%)",
            WebkitBackdropFilter: "blur(0.5px)",
            backdropFilter: "blur(0.5px)",
          }}
        />
      </div>
    </div>
  );
}

function variantFromPathname(pathname: string): PromptVariant {
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/issues")) return "issues";
  return "home";
}

export function PromptShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const variant = useMemo(() => variantFromPathname(pathname), [pathname]);
  const isIssueDetailRoute = useMemo(() => {
    if (!pathname.startsWith("/issues/")) return false;
    const parts = pathname.split("/");
    if (parts.length !== 3) return false;
    const idOrRoute = parts[2];
    if (!idOrRoute) return false;
    return idOrRoute !== "sent" && idOrRoute !== "completed";
  }, [pathname]);
  const issueIdForComment = useMemo(() => {
    if (!isIssueDetailRoute) return null;
    const parts = pathname.split("/");
    return parts[2] ? decodeURIComponent(parts[2]) : null;
  }, [isIssueDetailRoute, pathname]);

  const prevVariantRef = useRef<PromptVariant | null>(null);
  const [navState, setNavState] = useState<{
    active: boolean;
    direction: NavDirection | null;
  }>({ active: false, direction: null });

  const promptWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastRectRef = useRef<DOMRect | null>(null);
  const lastPathRef = useRef<string | null>(null);
  const animationRef = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const prev = prevVariantRef.current;
    prevVariantRef.current = variant;
    if (!prev || prev === variant) return;

    const direction: NavDirection = variant === "issues" ? "toIssues" : "toHome";
    queueMicrotask(() => setNavState({ active: true, direction }));
    const t = window.setTimeout(() => {
      setNavState({ active: false, direction: null });
    }, 600);
    return () => window.clearTimeout(t);
  }, [variant]);

  useLayoutEffect(() => {
    const wrapper = promptWrapperRef.current;
    if (!wrapper) return;

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
      const sx =
        nextRect.width > 0 ? Math.max(0.0001, prevRect.width / nextRect.width) : 1;
      const sy =
        nextRect.height > 0 ? Math.max(0.0001, prevRect.height / nextRect.height) : 1;

      animationRef.current?.cancel();

      el.style.transformOrigin = "top left";
      el.style.willChange = "transform";

      const invert = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      el.style.transform = invert;
      el.getBoundingClientRect();

      const anim = el.animate([{ transform: invert }, { transform: "none" }], {
        duration: 600,
        easing,
        fill: "both",
      });
      animationRef.current = anim;

      const cleanup = () => {
        el.style.transform = "";
        el.style.willChange = "";
      };

      anim.addEventListener("finish", cleanup, { once: true });
      anim.addEventListener("cancel", cleanup, { once: true });
    }

    lastRectRef.current = nextRect;
    lastPathRef.current = pathname;
  }, [pathname, variant]);

  const isIssues = variant === "issues";
  const isChat = variant === "chat";
  const showConversationBackdrop = isChat || (isIssues && isIssueDetailRoute);

  return (
    <ChatProvider>
      <FirstMessageSendAnimationProvider>
        <IssueChatProvider issueId={issueIdForComment}>
          <div
            className={[
              "relative flex h-full min-h-0 w-full flex-col overflow-x-hidden",
              isIssues ? "pb-32" : isChat ? "pb-0" : "pb-16",
            ].join(" ")}
          >
            {isIssues ? (
              <>
                {/* Issues */}
                {isIssueDetailRoute ? (
                  <div className="flex h-full min-h-0 flex-1 flex-col">
                    <div className="mx-auto min-h-0 w-full flex-1">
                      <div
                        className="min-h-0 h-full w-full overflow-y-auto pb-4"
                        style={{ scrollbarGutter: "stable both-edges" }}
                      >
                        {children}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="relative w-full px-5 pt-4 md:pt-10">
                      <div className="relative z-20 mx-auto h-full">
                        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-4" />
                      </div>
                    </div>

                    {/* Content */}
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
                )}
              </>
            ) : isChat ? (
              <div
                className="flex-1 min-h-0 focus-visible:outline-hidden"
                style={{
                  scrollbarGutter: "stable",
                  paddingLeft: "2.25rem",
                  paddingRight: "1.25rem",
                }}
              >
                {children}
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-6">
                {/* Content */}
                {children}
              </div>
            )}

            {showConversationBackdrop ? (
              <ConversationPromptBackdrop className={isChat ? "left-3" : "inset-x-0"} />
            ) : null}

            {/* Prompt */}
            <div
              ref={promptWrapperRef}
              className={
                isIssues || isChat
                  ? isChat
                    ? "fixed inset-x-0 bottom-6 z-40 mx-auto w-full max-w-2xl pl-9 pr-5"
                    : isIssueDetailRoute
                      ? "fixed inset-x-0 bottom-6 z-40 mx-auto w-full max-w-2xl px-5 md:px-0"
                      : "fixed inset-x-0 bottom-6 z-40 mx-auto w-full max-w-2xl px-5"
                  : "fixed inset-x-0 top-[calc(25vh+72px)] z-40 mx-auto w-full max-w-2xl px-5"
              }
            >
              <Prompt
                variant={variant}
                isNavigating={navState.active}
                navDirection={navState.direction}
                issueIdForComment={issueIdForComment}
              />
            </div>
          </div>
        </IssueChatProvider>
      </FirstMessageSendAnimationProvider>
    </ChatProvider>
  );
}

