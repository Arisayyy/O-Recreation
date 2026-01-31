"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Streamdown } from "streamdown";
import { streamdownComponents, streamdownRehypePlugins } from "@/app/components/issue-detail/streamdown-media";
import { useChat } from "./chat-context";
import { useOptimizedScroll } from "@/app/hooks/use-optimized-scroll";

// Space reserved for the fixed prompt at the bottom of the page.
const BOTTOM_PADDING_PX = 164;

export function ChatThread() {
  const { messages, status } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const contentEndRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const lastSpacerHeightRef = useRef<number>(0);

  const { scrollToBottom, markManualScroll, resetManualScroll } =
    useOptimizedScroll(bottomRef);

  const sorted = useMemo(() => messages.slice(), [messages]);
  const userMessageCount = useMemo(
    () => sorted.filter((m) => m.role === "user").length,
    [sorted],
  );
  const shouldAutoScroll = userMessageCount > 1;
  const prevUserMessageCountRef = useRef(userMessageCount);
  const lastUserMessageId = useMemo(() => {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i]?.role === "user") return sorted[i]!.id;
    }
    return null;
  }, [sorted]);

  // Stop auto-scroll if the user starts scrolling manually.
  useEffect(() => {
    if (!shouldAutoScroll) return;
    const handleManualScroll = () => markManualScroll();
    window.addEventListener("wheel", handleManualScroll);
    window.addEventListener("touchmove", handleManualScroll);
    return () => {
      window.removeEventListener("wheel", handleManualScroll);
      window.removeEventListener("touchmove", handleManualScroll);
    };
  }, [markManualScroll, shouldAutoScroll]);

  const getScrollParent = useCallback((node: HTMLElement | null) => {
    let el: HTMLElement | null = node?.parentElement ?? null;
    while (el) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const isScrollableOverflow =
        overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
      if (isScrollableOverflow && el.scrollHeight > el.clientHeight) return el;
      el = el.parentElement;
    }
    return null;
  }, []);

  const offsetTopWithin = useCallback((el: HTMLElement, ancestor: HTMLElement) => {
    let top = 0;
    let node: HTMLElement | null = el;
    while (node && node !== ancestor) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    if (node !== ancestor) return null;
    return top;
  }, []);

  // We add a small blank spacer after the message list so the newest user message
  // can be aligned to the top of the viewport when sending, but the spacer shrinks
  // as the assistant message grows so you can never scroll past the conversation.
  const recalcSpacer = useCallback(() => {
    const anchorEl = lastUserMessageRef.current;
    const endEl = contentEndRef.current;
    const spacerEl = spacerRef.current;

    if (!spacerEl) return;
    if (!anchorEl || !endEl) {
      spacerEl.style.height = "0px";
      lastSpacerHeightRef.current = 0;
      return;
    }

    const scrollParent = getScrollParent(endEl);
    const viewportHeight =
      scrollParent?.clientHeight ??
      window.visualViewport?.height ??
      window.innerHeight;

    const maxSpacer = Math.max(0, Math.floor(viewportHeight - BOTTOM_PADDING_PX));

    let contentHeightFromAnchorTopToEnd = 0;
    if (scrollParent) {
      const anchorTop = offsetTopWithin(anchorEl, scrollParent);
      const endTop = offsetTopWithin(endEl, scrollParent);
      if (anchorTop != null && endTop != null) {
        contentHeightFromAnchorTopToEnd = endTop - anchorTop;
      } else {
        // Fallback: same viewport coordinate space.
        const a = anchorEl.getBoundingClientRect();
        const b = endEl.getBoundingClientRect();
        contentHeightFromAnchorTopToEnd = b.top - a.top;
      }
    } else {
      const a = anchorEl.getBoundingClientRect();
      const b = endEl.getBoundingClientRect();
      contentHeightFromAnchorTopToEnd = b.top - a.top;
    }

    if (!Number.isFinite(contentHeightFromAnchorTopToEnd) || contentHeightFromAnchorTopToEnd < 0) {
      contentHeightFromAnchorTopToEnd = 0;
    }

    const next = Math.min(
      maxSpacer,
      Math.max(0, Math.floor(viewportHeight - BOTTOM_PADDING_PX - contentHeightFromAnchorTopToEnd)),
    );

    if (Math.abs(lastSpacerHeightRef.current - next) >= 1) {
      spacerEl.style.height = `${next}px`;
      lastSpacerHeightRef.current = next;
    }
  }, [getScrollParent, offsetTopWithin]);

  useLayoutEffect(() => {
    recalcSpacer();
  }, [recalcSpacer, messages, status, lastUserMessageId]);

  useLayoutEffect(() => {
    const handle = () => recalcSpacer();

    const endEl = contentEndRef.current;
    if (!endEl) return;

    const ro = new ResizeObserver(handle);
    ro.observe(endEl);

    const anchorEl = lastUserMessageRef.current;
    if (anchorEl) ro.observe(anchorEl);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", handle);
    vv?.addEventListener("scroll", handle);
    window.addEventListener("resize", handle);

    return () => {
      ro.disconnect();
      vv?.removeEventListener("resize", handle);
      vv?.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [recalcSpacer, lastUserMessageId]);

  // When a new user message is added, align it to the top (after the first message).
  useLayoutEffect(() => {
    const prev = prevUserMessageCountRef.current;
    prevUserMessageCountRef.current = userMessageCount;

    if (userMessageCount <= 1) return;
    if (userMessageCount <= prev) return;

    resetManualScroll();
    recalcSpacer();
    if (lastUserMessageRef.current) {
      lastUserMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      scrollToBottom();
    }
  }, [recalcSpacer, resetManualScroll, scrollToBottom, userMessageCount]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        className="flex flex-col pt-9"
        style={{ paddingBottom: BOTTOM_PADDING_PX }}
      >
        {sorted.map((m) => {
          const isUser = m.role === "user";
          const textParts = m.parts.filter((p) => p.type === "text");
          const fileParts = m.parts.filter((p) => p.type === "file");
          const markdown = textParts
            .map((p) => p.text)
            .join("\n\n")
            .trim();
          const isStreamingAssistantPlaceholder =
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            markdown.length === 0 &&
            fileParts.length === 0;

          return (
            <div
              key={m.id}
              ref={
                isUser && lastUserMessageId && m.id === lastUserMessageId
                  ? lastUserMessageRef
                  : undefined
              }
              className={[
                "group flex w-full items-end gap-2 py-4",
                isUser ? "is-user" : "is-assistant",
              ].join(" ")}
            >
              <div className="text-copy overflow-hidden flex w-full flex-col gap-3 text-[14px] leading-[21px] group-[.is-user]:text-[18px] group-[.is-user]:leading-[27px]">
                <div className="space-y-4 size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {isStreamingAssistantPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {markdown.length > 0 ? (
                    <Streamdown
                      mode="static"
                      rehypePlugins={streamdownRehypePlugins}
                      components={streamdownComponents}
                    >
                      {markdown}
                    </Streamdown>
                  ) : null}

                  {fileParts.map((part, idx) => {
                    const isImage = part.mediaType.startsWith("image/");
                    return isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${m.id}-file-${idx}`}
                        src={part.url}
                        alt={part.filename ?? "attachment"}
                        className="max-w-full rounded-lg border border-neutral"
                      />
                    ) : (
                      <a
                        key={`${m.id}-file-${idx}`}
                        href={part.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline underline-offset-4"
                      >
                        {part.filename ?? part.url}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={contentEndRef} aria-hidden style={{ height: 0 }} />

        <div ref={spacerRef} aria-hidden style={{ height: 0 }} />

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

