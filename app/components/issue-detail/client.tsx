"use client";

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { issues as issuesCollection } from "@/app/collections/issues";
import { issueMessages as issueMessagesCollection } from "@/app/collections/issueMessages";
import { IssueDetailHeader } from "./header";
import { IssueThreadMessage } from "./thread-message";
import { IssueReplyComposer } from "./reply-composer";
import { IssueComment } from "./comment";
import { formatRelativeTime } from "@/app/lib/relative-time";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";

// Space reserved for the fixed prompt at the bottom of the page.
const BOTTOM_PADDING_PX = 164;

export function IssueDetailClient({ issueId }: { issueId: string }) {
  const issues = issuesCollection.get();
  const messages = issueMessagesCollection.get();

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const replyWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const contentEndRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const lastSpacerHeightRef = useRef<number>(0);

  const openReply = useCallback(() => {
    setIsReplyOpen(true);
    // Scroll the composer into view (focus happens inside the composer).
    window.setTimeout(() => {
      replyWrapperRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
  }, []);

  const closeReply = useCallback(() => {
    setIsReplyOpen(false);
  }, []);

  const { data: issueList, isLoading: issuesLoading, isError: issuesError } =
    useLiveQuery(issues);
  const {
    data: allMessages,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useLiveQuery(messages);

  const issue = useMemo(
    () => (issueList ?? []).find((i) => i.id === issueId) ?? null,
    [issueList, issueId],
  );

  const feed = useMemo(() => {
    if (!issue) return [];

    const items: Array<
      | {
          kind: "reply";
          id: string;
          createdAt: number;
          fromName: string;
          fromInitial: string;
          fromAvatarId?: string;
          body: string;
        }
      | {
          kind: "comment";
          id: string;
          createdAt: number;
          fromName: string;
          body: string;
        }
    > = [];

    // The issue itself is shown as the first "reply-style" message.
    const issueFromName = issue.createdBy?.name ?? "Anonymous";
    items.push({
      kind: "reply",
      id: `issue:${issue.id}`,
      createdAt: issue.createdAt,
      fromName: issueFromName,
      fromInitial: (issueFromName.trim()?.[0] ?? "A").toUpperCase(),
      fromAvatarId: issue.createdBy?.avatar ?? issueFromName,
      body: issue.body,
    });

    for (const m of allMessages ?? []) {
      if (m.issueId !== issueId) continue;

      const type = m.type ?? "reply";
      const name = m.author?.name ?? "Anonymous";

      if (type === "comment") {
        items.push({
          kind: "comment",
          id: m.id,
          createdAt: m.createdAt,
          fromName: name,
          body: m.body,
        });
      } else {
        items.push({
          kind: "reply",
          id: m.id,
          createdAt: m.createdAt,
          fromName: name,
          fromInitial: (name.trim()?.[0] ?? "A").toUpperCase(),
          fromAvatarId: m.author?.avatar ?? name,
          body: m.body,
        });
      }
    }

    items.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return items;
  }, [allMessages, issueId, issue]);

  const myName = useMemo(() => getAnonymousIdentity().name ?? "Anonymous", []);
  const userMessageCount = useMemo(
    () =>
      feed.filter(
        (m) =>
          m.fromName === myName &&
          // Exclude the synthetic first "issue" message.
          !(m.kind === "reply" && m.id.startsWith("issue:")),
      ).length,
    [feed, myName],
  );
  const prevUserMessageCountRef = useRef(userMessageCount);
  const lastUserMessageId = useMemo(() => {
    for (let i = feed.length - 1; i >= 0; i--) {
      const item = feed[i];
      if (!item) continue;
      if (item.fromName !== myName) continue;
      if (item.kind === "reply" && item.id.startsWith("issue:")) continue;
      return item.id;
    }
    return null;
  }, [feed, myName]);

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

  // We add a small blank spacer after the thread so the newest user message can be aligned
  // to the top of the viewport when sending, but the spacer shrinks so you can never scroll
  // past the end of the issue detail content.
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
      scrollParent?.clientHeight ?? window.visualViewport?.height ?? window.innerHeight;

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

    if (
      !Number.isFinite(contentHeightFromAnchorTopToEnd) ||
      contentHeightFromAnchorTopToEnd < 0
    ) {
      contentHeightFromAnchorTopToEnd = 0;
    }

    const next = Math.min(
      maxSpacer,
      Math.max(
        0,
        Math.floor(viewportHeight - BOTTOM_PADDING_PX - contentHeightFromAnchorTopToEnd),
      ),
    );

    if (Math.abs(lastSpacerHeightRef.current - next) >= 1) {
      spacerEl.style.height = `${next}px`;
      lastSpacerHeightRef.current = next;
    }
  }, [getScrollParent, offsetTopWithin]);

  useLayoutEffect(() => {
    recalcSpacer();
  }, [recalcSpacer, feed, lastUserMessageId]);

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

  // When a new user reply is added, align it to the top.
  useLayoutEffect(() => {
    const prev = prevUserMessageCountRef.current;
    prevUserMessageCountRef.current = userMessageCount;

    if (userMessageCount < 1) return;
    if (userMessageCount <= prev) return;

    recalcSpacer();
    lastUserMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [recalcSpacer, userMessageCount]);

  if (issuesError || messagesError) {
    return (
      <div className="p-5 font-orchid-ui text-sm leading-6 text-orchid-ink">
        Failed to load issue. Please refresh.
      </div>
    );
  }

  if ((issuesLoading || messagesLoading) && !issue) {
    return (
      <div className="p-5 font-orchid-ui text-sm leading-6 text-orchid-muted">
        Loading…
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-5 font-orchid-ui text-sm leading-6 text-orchid-ink">
        Issue not found.
      </div>
    );
  }

  return (
    <div className="font-orchid-ui leading-6">
      <IssueDetailHeader title={issue.title} onReply={openReply} />

      <div
        className="mx-auto w-full max-w-2xl px-5 pb-8 md:px-0"
        style={{ paddingBottom: BOTTOM_PADDING_PX }}
      >
        {/* Thread */}
        <div className="mt-4 space-y-4">
          {feed.map((item) => {
            const isLastUserMessage =
              lastUserMessageId != null &&
              item.fromName === myName &&
              item.id === lastUserMessageId &&
              !(item.kind === "reply" && item.id.startsWith("issue:"));

            if (item.kind === "comment") {
              const isMyComment = item.fromName === myName;
              return (
                <div key={item.id} ref={isLastUserMessage ? lastUserMessageRef : undefined}>
                  <IssueComment
                    name={item.fromName}
                    body={item.body}
                    timeLabel={formatRelativeTime(item.createdAt)}
                    variant={isMyComment ? "chatUser" : "default"}
                  />
                </div>
              );
            }

            return (
              <div key={item.id} ref={isLastUserMessage ? lastUserMessageRef : undefined}>
                <IssueThreadMessage
                  message={{
                    id: item.id,
                    fromInitial: item.fromInitial,
                    fromName: item.fromName,
                    fromAvatarId: item.fromAvatarId,
                    timeLabel: formatRelativeTime(item.createdAt),
                    body: item.body,
                    attachments: [],
                  }}
                  onReplyAction={openReply}
                />
              </div>
            );
          })}
        </div>

        {/* Reply composer */}
        <div ref={replyWrapperRef} className="mt-4">
          <IssueReplyComposer
            open={isReplyOpen}
            issueId={issueId}
            onCloseAction={closeReply}
          />
        </div>

        <div ref={contentEndRef} aria-hidden style={{ height: 0 }} />
        <div ref={spacerRef} aria-hidden style={{ height: 0 }} />
      </div>
    </div>
  );
}

