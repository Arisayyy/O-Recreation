"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { issues as issuesCollection } from "@/app/collections/issues";
import { issueMessages as issueMessagesCollection } from "@/app/collections/issueMessages";
import { IssueDetailHeader } from "./header";
import { IssueThreadMessage } from "./thread-message";
import { IssueReplyComposer } from "./reply-composer";
import { IssueComment } from "./comment";
import { formatRelativeTime } from "@/app/lib/relative-time";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";
import { useIssueChat } from "@/app/components/issue-detail/issue-chat-context";
import { getToolName, isToolUIPart } from "ai";

// Space reserved for the fixed prompt at the bottom of the page.
const BOTTOM_PADDING_PX = 164;

export function IssueDetailClient({ issueId }: { issueId: string }) {
  const issues = issuesCollection.get();
  const messages = issueMessagesCollection.get();
  const issueChat = useIssueChat();

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ name: string; avatarId?: string } | null>(null);
  const replyWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const contentEndRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const lastSpacerHeightRef = useRef<number>(0);

  const openReplyTo = useCallback((target: { name: string; avatarId?: string } | null) => {
    setReplyTo(target);
    setIsReplyOpen(true);
    // Scroll the composer into view (focus happens inside the composer).
    window.setTimeout(() => {
      replyWrapperRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  }, []);

  const closeReply = useCallback(() => {
    setIsReplyOpen(false);
    setReplyTo(null);
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

  const openReply = useCallback(() => {
    const name = issue?.createdBy?.name ?? "Anonymous";
    const avatarId = issue?.createdBy?.avatar ?? name;
    openReplyTo({ name, avatarId });
  }, [issue?.createdBy?.avatar, issue?.createdBy?.name, openReplyTo]);

  const issueContextText = useMemo(() => {
    if (!issue) return "";

    const persistedReplies =
      (allMessages ?? [])
        .filter((m) => m.issueId === issueId && (m.type ?? "reply") !== "comment")
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)) ?? [];

    const replyLines =
      persistedReplies.length === 0
        ? "No replies yet."
        : persistedReplies
            .map((r, idx) => {
              const name = r.author?.name ?? "Anonymous";
              const body = (r.body ?? "").trim();
              return [
                `Reply ${idx + 1} — ${name} — ${new Date(r.createdAt).toISOString()}`,
                body.length ? body : "(empty)",
              ].join("\n");
            })
            .join("\n\n");

    return [
      "Issue context (persisted, read-only):",
      `Issue ID: ${issue.id}`,
      `Title: ${issue.title}`,
      `Created: ${new Date(issue.createdAt).toISOString()}`,
      "",
      "Issue body:",
      (issue.body ?? "").trim() || "(empty)",
      "",
      "Persisted replies:",
      replyLines,
    ].join("\n");
  }, [allMessages, issue, issueId]);

  useEffect(() => {
    if (issueChat.issueId !== issueId) return;
    issueChat.setIssueContext(issueContextText);
  }, [issueChat, issueChat.issueId, issueContextText, issueId]);

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
      | {
          kind: "issueChatThinking";
          id: string;
          createdAt: number;
        }
      | {
          kind: "issueChatMessage";
          id: string;
          createdAt: number;
          fromName: string;
          body: string;
          variant: "chatUser" | "chatAssistant";
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

      // Persisted "replies" should remain. Issue-page chat messages are ephemeral.
      if (type !== "comment") {
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

    // Ephemeral issue chat messages (user + assistant), like /chat.
    if (issueChat.issueId === issueId) {
      const EPHEMERAL_BASE_TS = 8_000_000_000_000_000;
      const isStreaming = issueChat.status === "submitted" || issueChat.status === "streaming";
      const visible = issueChat.messages.filter((m) => m.role === "user" || m.role === "assistant");
      for (let i = 0; i < visible.length; i++) {
        const m = visible[i]!;
        const textParts = m.parts.filter((p) => p.type === "text");
        const fileParts = m.parts.filter((p) => p.type === "file");
        const toolParts = m.parts.filter(isToolUIPart);

        const markdown = textParts
          .map((p) => p.text)
          .join("\n\n")
          .trim();

        const filesMarkdown =
          fileParts.length > 0
            ? fileParts
                .map((p) => {
                  const isImage = p.mediaType.startsWith("image/");
                  const label = p.filename ?? "attachment";
                  return isImage ? `![${label}](${p.url})` : `- [${label}](${p.url})`;
                })
                .join("\n")
            : "";

        const toolMarkdown =
          toolParts.length > 0
            ? toolParts
                .map((p) => {
                  const name = getToolName(p);
                  return name ? `- Tool: ${name}` : "";
                })
                .filter(Boolean)
                .join("\n")
            : "";

        const body = [markdown, filesMarkdown, toolMarkdown].filter(Boolean).join("\n\n").trim();
        if (!body) {
          // Match /chat: show a "thinking" placeholder while the assistant is streaming.
          const isStreamingAssistantPlaceholder =
            m.role === "assistant" &&
            isStreaming &&
            markdown.length === 0 &&
            fileParts.length === 0 &&
            toolParts.length === 0;
          if (isStreamingAssistantPlaceholder) {
            items.push({
              kind: "issueChatThinking",
              id: `issue-chat:thinking:${m.id}`,
              createdAt: EPHEMERAL_BASE_TS + i,
            });
          }
          continue;
        }

        const myName = getAnonymousIdentity().name ?? "Anonymous";
        const isUser = m.role === "user";

        items.push({
          kind: "issueChatMessage",
          id: `issue-chat:${m.id}`,
          createdAt: EPHEMERAL_BASE_TS + i,
          fromName: isUser ? myName : "Orchid",
          body,
          variant: isUser ? "chatUser" : "chatAssistant",
        });
      }
    }

    items.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return items;
  }, [allMessages, issue, issueChat.issueId, issueChat.messages, issueId]);

  const myName = useMemo(() => getAnonymousIdentity().name ?? "Anonymous", []);
  const userMessageCount = useMemo(
    () =>
      feed.filter(
        (m) =>
          "fromName" in m &&
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
      if (!("fromName" in item)) continue;
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

  useLayoutEffect(() => {
    const endEl = contentEndRef.current;
    const scrollParent = getScrollParent(endEl);
    if (scrollParent) {
      scrollParent.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [getScrollParent, issueId]);

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
        <div
          className="mt-4 flex flex-col"
          style={{ ["--bottom-padding" as never]: `${BOTTOM_PADDING_PX}px` }}
        >
          {(() => {
            const nodes: React.ReactNode[] = [];

            type FeedItem = (typeof feed)[number];
            type IssueChatFeedItem = Extract<
              FeedItem,
              { kind: "issueChatMessage" | "issueChatThinking" }
            >;

            const isIssueChatItem = (item: FeedItem): item is IssueChatFeedItem => {
              return item.kind === "issueChatMessage" || item.kind === "issueChatThinking";
            };

            const renderThinking = (key: string) => (
              <div key={key} className="group flex w-full items-end gap-2 py-4 is-assistant">
                <div className="not-prose text-copy w-full">
                  <div className="py-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-ai animate-pulse-size size-2 rounded-full" aria-hidden="true" />
                      <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                        Cerebrating...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );

            let i = 0;
            while (i < feed.length) {
              const item = feed[i]!;

              // Group consecutive issue-chat items into blocks to match the reference spacing.
              if (isIssueChatItem(item)) {
                const blockItems: IssueChatFeedItem[] = [];
                let j = i;
                while (j < feed.length) {
                  const next = feed[j]!;
                  if (!isIssueChatItem(next)) break;
                  blockItems.push(next);
                  j++;
                }

                const isLastChatBlock = j >= feed.length;
                const wrapperClass = isLastChatBlock
                  ? "flex min-h-[calc(100dvh-var(--bottom-padding))] flex-col py-9"
                  : "flex flex-col py-4";

                nodes.push(
                  <div
                    key={`issue-chat-block:${blockItems[0]!.id}`}
                    className={wrapperClass}
                  >
                    {blockItems.map((bi) => {
                      if (bi.kind === "issueChatThinking") return renderThinking(bi.id);

                      // Issue chat messages are personal/ephemeral: no header/time label.
                      return (
                        <IssueComment
                          key={bi.id}
                          ref={bi.id === lastUserMessageId ? lastUserMessageRef : undefined}
                          name={bi.fromName}
                          body={bi.body}
                          timeLabel={undefined}
                          variant={bi.variant}
                        />
                      );
                    })}
                  </div>,
                );

                i = j;
                continue;
              }

              const isLastUserMessage =
                lastUserMessageId != null &&
                "fromName" in item &&
                item.fromName === myName &&
                item.id === lastUserMessageId &&
                !(item.kind === "reply" && item.id.startsWith("issue:"));

              if (item.kind === "comment") {
                nodes.push(
                  <div key={item.id} ref={isLastUserMessage ? lastUserMessageRef : undefined}>
                    <IssueComment
                      name={item.fromName}
                      body={item.body}
                      timeLabel={formatRelativeTime(item.createdAt)}
                      variant="default"
                    />
                  </div>,
                );
              } else {
                nodes.push(
                  <div
                    key={item.id}
                    ref={isLastUserMessage ? lastUserMessageRef : undefined}
                    className="py-4"
                  >
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
                      onReplyAction={() => openReplyTo({ name: item.fromName, avatarId: item.fromAvatarId })}
                    />
                  </div>,
                );
              }

              i++;
            }

            return nodes;
          })()}
        </div>

        {/* Reply composer */}
        <div ref={replyWrapperRef} className="mt-4 scroll-mt-24">
          <IssueReplyComposer
            open={isReplyOpen}
            issueId={issueId}
            replyTo={replyTo}
            onCloseAction={closeReply}
          />
        </div>

        <div ref={contentEndRef} aria-hidden style={{ height: 0 }} />
        <div ref={spacerRef} aria-hidden style={{ height: 0 }} />
      </div>
    </div>
  );
}

