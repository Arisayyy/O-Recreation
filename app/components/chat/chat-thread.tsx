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
import { useFirstMessageSendAnimation } from "@/app/components/chat/first-message-send-animation";
import { getToolName, isToolUIPart } from "ai";
import { BugIssueArtifact, type BugIssueArtifactDraft } from "./bug-issue-artifact";

// Space reserved for the fixed prompt at the bottom of the page.
const BOTTOM_PADDING_PX = 164;

export function ChatThread() {
  const { messages, status } = useChat();
  const firstMessageAnim = useFirstMessageSendAnimation();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const firstUserMessageRef = useRef<HTMLDivElement | null>(null);
  const contentEndRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const lastSpacerHeightRef = useRef<number>(0);
  const localBeginTokenRef = useRef<string | null>(null);
  const didAnimateTokenRef = useRef<string | null>(null);

  const { scrollToBottom, markManualScroll, resetManualScroll } =
    useOptimizedScroll(bottomRef);

  const sorted = useMemo(() => messages.slice(), [messages]);
  const lastUserWantsExa = useMemo(() => {
    const EXA_RE = /(^|\s)@exa\b/i;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const m = sorted[i];
      if (!m || m.role !== "user") continue;
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("\n\n");
      return EXA_RE.test(text);
    }
    return false;
  }, [sorted]);
  const userMessageCount = useMemo(
    () => sorted.filter((m) => m.role === "user").length,
    [sorted],
  );
  const shouldDelayFirstAssistantPlaceholder =
    userMessageCount === 1 && firstMessageAnim.phase === "userAnimating";
  const shouldAutoScroll = userMessageCount > 1;
  const prevUserMessageCountRef = useRef(userMessageCount);
  const lastUserMessageId = useMemo(() => {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i]?.role === "user") return sorted[i]!.id;
    }
    return null;
  }, [sorted]);

  // Animate the very first user message into place when we land on /chat.
  useLayoutEffect(() => {
    const beginToken = firstMessageAnim.consumeBeginToken();
    if (beginToken) localBeginTokenRef.current = beginToken;

    if (localBeginTokenRef.current == null) return;
    if (didAnimateTokenRef.current === localBeginTokenRef.current) return;
    if (firstMessageAnim.phase !== "userAnimating") return;
    if (userMessageCount !== 1) return;
    if (!firstMessageAnim.sourcePoint) return;

    const el = firstUserMessageRef.current;
    if (!el) return;

    const easing =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ease-out-expo")
        .trim() || "cubic-bezier(0.16, 1, 0.3, 1)";

    const dest = el.getBoundingClientRect();
    const dx = 0;
    const dy = Math.round(firstMessageAnim.sourcePoint.y - dest.top);

    // Ensure no flash of un-animated content.
    el.style.willChange = "transform, opacity";
    el.style.opacity = "0";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.getBoundingClientRect();

    const anim = el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
        { transform: "translate(0px, 0px)", opacity: 1 },
      ],
      { duration: 420, easing, fill: "both" },
    );

    didAnimateTokenRef.current = localBeginTokenRef.current;

    anim.finished
      .catch(() => {})
      .finally(() => {
        el.style.willChange = "";
        el.style.opacity = "";
        el.style.transform = "";
        firstMessageAnim.markUserDone();
      });
  }, [
    firstMessageAnim,
    firstMessageAnim.phase,
    firstMessageAnim.sourcePoint,
    userMessageCount,
  ]);

  // Once the first assistant message has appeared (and had time to fade in), reset the one-shot state.
  useEffect(() => {
    if (firstMessageAnim.phase !== "userDone") return;
    if (userMessageCount !== 1) return;
    const hasAssistant = sorted.some((m) => m.role === "assistant");
    if (!hasAssistant) return;

    const t = window.setTimeout(() => firstMessageAnim.reset(), 600);
    return () => window.clearTimeout(t);
  }, [firstMessageAnim, firstMessageAnim.phase, sorted, userMessageCount]);

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
          const isLastMessage = sorted[sorted.length - 1]?.id === m.id;
          const isUser = m.role === "user";
          const isFirstUserMessageInNewChat =
            isUser && userMessageCount === 1 && firstMessageAnim.phase !== "idle";
          const textParts = m.parts.filter((p) => p.type === "text");
          const fileParts = m.parts.filter((p) => p.type === "file");
          const toolParts = m.parts.filter(isToolUIPart);
          const markdown = textParts
            .map((p) => p.text)
            .join("\n\n")
            .trim();
          const isStreamingAssistantPlaceholder =
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            markdown.length === 0 &&
            fileParts.length === 0 &&
            toolParts.length === 0;
          const isCreatingBugIssueArtifactPlaceholder =
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            toolParts.some((p) => {
              const toolName = getToolName(p);
              return toolName === "createBugIssueArtifact" && p.state !== "output-available";
            });
          const listIssuesParts = toolParts.filter((p) => getToolName(p) === "listIssues");
          const isListIssuesPending = listIssuesParts.some((p) => p.state !== "output-available");
          const isLoadingIssuesPlaceholder =
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            isListIssuesPending;
          const isSynthesizingIssuesPlaceholder =
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            listIssuesParts.length > 0 &&
            !isListIssuesPending &&
            markdown.length === 0 &&
            fileParts.length === 0;
          const isPrefaceToIssuesLookupPlaceholder =
            isLastMessage &&
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            listIssuesParts.length === 0 &&
            !isListIssuesPending &&
            /(?:^|\b)(?:i['’]?ll|i will|let me)\s+(?:check|look(?:ing)?\s+up|fetch)\b[\s\S]{0,80}\bissues?\b/i.test(
              markdown,
            );
          const webSearchParts = toolParts.filter((p) => getToolName(p) === "webSearch");
          const isWebSearchPending = webSearchParts.some((p) => p.state !== "output-available");
          const isUsingWebSearchPlaceholder =
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            isWebSearchPending;
          const isSynthesizingWebSearchPlaceholder =
            m.role === "assistant" &&
            (status === "submitted" || status === "streaming") &&
            webSearchParts.length > 0 &&
            !isWebSearchPending &&
            markdown.length === 0 &&
            fileParts.length === 0;

          // Fade the first assistant message in after the first user message animation completes.
          const shouldGateFirstAssistantFade =
            m.role === "assistant" &&
            userMessageCount === 1 &&
            firstMessageAnim.phase !== "idle";
          const assistantOpacity =
            shouldGateFirstAssistantFade && firstMessageAnim.phase !== "userDone"
              ? 0
              : 1;

          return (
            <div
              key={m.id}
              ref={
                isFirstUserMessageInNewChat
                  ? firstUserMessageRef
                  : isUser && lastUserMessageId && m.id === lastUserMessageId
                    ? lastUserMessageRef
                    : undefined
              }
              className={[
                "group flex w-full items-end gap-2",
                isUser ? "pt-8 pb-4" : "py-4",
                isUser ? "is-user" : "is-assistant",
              ].join(" ")}
              style={
                shouldGateFirstAssistantFade
                  ? {
                      opacity: assistantOpacity,
                      transition: "opacity 350ms var(--ease-out-expo)",
                    }
                  : undefined
              }
            >
              <div className="text-copy overflow-hidden flex w-full flex-col gap-3 text-[14px] leading-[21px] group-[.is-user]:text-[18px] group-[.is-user]:leading-[27px]">
                <div className="space-y-4 size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {isStreamingAssistantPlaceholder && !shouldDelayFirstAssistantPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Cerebrating...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {markdown.length > 0 ? (
                    <Streamdown
                      mode="static"
                      linkSafety={{ enabled: false }}
                      rehypePlugins={streamdownRehypePlugins}
                      components={streamdownComponents}
                    >
                      {markdown}
                    </Streamdown>
                  ) : null}

                  {isCreatingBugIssueArtifactPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Transmuting...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isLoadingIssuesPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Loading issues...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isPrefaceToIssuesLookupPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Loading issues...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isSynthesizingIssuesPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Synthesizing...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isUsingWebSearchPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Searching...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isSynthesizingWebSearchPlaceholder ? (
                    <div className="not-prose text-copy w-full">
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-ai animate-pulse-size size-2 rounded-full"
                            aria-hidden="true"
                          />
                          <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                            Synthesizing...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {toolParts.map((part, idx) => {
                    const toolName = getToolName(part);
                    if (toolName === "createBugIssueArtifact") {
                      if (part.state !== "output-available") return null;
                      const draft = part.output as BugIssueArtifactDraft;
                      return (
                        <BugIssueArtifact
                          key={`${m.id}-tool-${toolName}-${idx}`}
                          initialDraft={draft}
                        />
                      );
                    }

                    return null;
                  })}

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

        {(() => {
          const isStreaming = status === "submitted" || status === "streaming";
          const last = sorted[sorted.length - 1];
          const needsTrailingAssistantRow = isStreaming && (!last || last.role === "user");
          if (!needsTrailingAssistantRow) return null;
          if (shouldDelayFirstAssistantPlaceholder) return null;

          return (
            <div className={["group flex w-full items-end gap-2", "py-4", "is-assistant"].join(" ")}>
              <div className="text-copy overflow-hidden flex w-full flex-col gap-3 text-[14px] leading-[21px]">
                <div className="space-y-4 size-full">
                  <div className="not-prose text-copy w-full">
                    <div className="py-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-ai animate-pulse-size size-2 rounded-full"
                          aria-hidden="true"
                        />
                        <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                          {lastUserWantsExa ? "Searching..." : "Cerebrating..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div ref={contentEndRef} aria-hidden style={{ height: 0 }} />

        <div ref={spacerRef} aria-hidden style={{ height: 0 }} />

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

