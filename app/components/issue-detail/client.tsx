"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useReplicateInitState } from "@/app/components/replicate-context";
import { api } from "@/convex/_generated/api";

// Space reserved for the fixed prompt at the bottom of the page.
const BOTTOM_PADDING_PX = 164;
// When auto-scrolling to the newest user message, leave some breathing room from the top edge.
const NEW_MESSAGE_SCROLL_TOP_PADDING_PX = 58;

export function IssueDetailClient({
  issueId,
  listMode: listModeOverride,
  onNavigateIssueIdAction,
  onNavigateToListAction,
  onCloseAction,
}: {
  issueId: string;
  listMode?: "inbox" | "done" | "sent";
  onNavigateIssueIdAction?: (
    issueId: string,
    opts: { listMode: "inbox" | "done" | "sent" },
  ) => void;
  onNavigateToListAction?: (opts: { listMode: "inbox" | "done" | "sent" }) => void;
  onCloseAction?: () => void;
}) {
  const { ready, error, retry } = useReplicateInitState();

  // Don't call hooks that require the collections until Replicate is initialized.
  if (!ready) {
    return (
      <div className="p-5 font-orchid-ui text-sm leading-6 text-orchid-muted">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 font-orchid-ui text-sm leading-6 text-orchid-ink">
        <div className="font-medium">Failed to initialize offline storage</div>
        <div className="mt-1 text-orchid-muted">{error.message}</div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-orchid-pill border border-neutral bg-white px-3 text-sm font-medium text-orchid-ink shadow-xs"
            onClick={retry}
          >
            Retry
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-orchid-pill border border-neutral bg-white px-3 text-sm font-medium text-orchid-ink shadow-xs"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <IssueDetailClientReady
      issueId={issueId}
      listModeOverride={listModeOverride}
      onNavigateIssueIdAction={onNavigateIssueIdAction}
      onNavigateToListAction={onNavigateToListAction}
      onCloseAction={onCloseAction}
    />
  );
}

function IssueDetailClientReady({
  issueId,
  listModeOverride,
  onNavigateIssueIdAction,
  onNavigateToListAction,
  onCloseAction,
}: {
  issueId: string;
  listModeOverride?: "inbox" | "done" | "sent";
  onNavigateIssueIdAction?: (
    issueId: string,
    opts: { listMode: "inbox" | "done" | "sent" },
  ) => void;
  onNavigateToListAction?: (opts: { listMode: "inbox" | "done" | "sent" }) => void;
  onCloseAction?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enqueueIssueStatusLabelSync = useMutation(api.githubIssues.enqueueIssueStatusLabelSync);
  const listMode = useMemo<"inbox" | "done" | "sent">(() => {
    if (listModeOverride) return listModeOverride;
    const raw = searchParams?.get("list");
    if (raw === "done") return "done";
    if (raw === "sent") return "sent";
    return "inbox";
  }, [listModeOverride, searchParams]);
  const issues = issuesCollection.get();
  const messages = issueMessagesCollection.get();
  const issueChat = useIssueChat();
  const navigateToIssue = useCallback(
    (nextId: string) => {
      if (onNavigateIssueIdAction) {
        onNavigateIssueIdAction(nextId, { listMode });
        return;
      }
      router.push(`/issues/${encodeURIComponent(nextId)}?list=${encodeURIComponent(listMode)}`);
    },
    [listMode, onNavigateIssueIdAction, router],
  );
  const navigateToList = useCallback(() => {
    if (onNavigateToListAction) {
      onNavigateToListAction({ listMode });
      return;
    }
    if (onCloseAction) {
      onCloseAction();
      return;
    }
    router.push(listMode === "done" ? "/issues/completed" : listMode === "sent" ? "/issues/sent" : "/issues");
  }, [listMode, onCloseAction, onNavigateToListAction, router]);
  const updateIssueStatus = useCallback(
    (next: import("@/app/components/icons/issue-status-icon").IssueStatusKey) => {
      const now = Date.now();
      issues.update(issueId, (draft: any) => {
        draft.status = next;
        draft.updatedAt = now;
      });
    },
    [issueId, issues],
  );

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ name: string; avatarId?: string } | null>(null);
  const replyWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const contentEndRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const lastSpacerHeightRef = useRef<number>(0);
  const mountedAtRef = useRef<number>(0);

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

  // Discard any open reply composer when navigating between issues (e.g. via J/K).
  // This component stays mounted across route param changes, so local state would otherwise carry over.
  useEffect(() => {
    setIsReplyOpen(false);
    setReplyTo(null);
  }, [issueId]);

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

  const enqueueGithubStatusLabelSyncIfNeeded = useCallback(() => {
    const hasGithub =
      !!issue?.githubIssueUrl || typeof issue?.githubIssueNumber === "number" || !!issue?.githubSyncStatus;
    if (!hasGithub) return;
    void enqueueIssueStatusLabelSync({ issueId });
  }, [enqueueIssueStatusLabelSync, issue, issueId]);

  const myIdentityName = useMemo(() => getAnonymousIdentity().name ?? "Anonymous", []);

  // When viewing a done issue in the "done" list and you change it to not-done,
  // we keep you on the same issue (so you can see what you changed), but we still
  // want K/J navigation to target the surrounding done issues.
  const [doneAnchorIndex, setDoneAnchorIndex] = useState<number | null>(null);
  useEffect(() => {
    setDoneAnchorIndex(null);
  }, [issueId, listMode]);

  // Mirror the list ordering (IssuesInboxList): updatedAt desc.
  // Use the list context (inbox vs done) to decide which issues are navigable with K/J.
  const listIssueIds = useMemo(() => {
    const all = [...(issueList ?? [])];
    const filtered =
      listMode === "done"
        ? all.filter((i) => (i.status as any) === "done")
        : listMode === "sent"
          ? all.filter((i) => {
              const isSent = !!(i as any).githubSyncStatus || !!(i as any).githubIssueUrl;
              const isMine = ((i as any).createdBy?.name ?? "Anonymous") === myIdentityName;
              return isSent && isMine;
            })
          : all.filter((i) => (i.status as any) !== "done");
    return filtered
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .map((i) => i.id);
  }, [issueList, listMode, myIdentityName]);

  const navigateIssueRelative = useCallback(
    (delta: -1 | 1) => {
      if (listIssueIds.length === 0) return;
      let nextId: string | null = null;

      if (listMode === "done" && (issue as any)?.status !== "done" && doneAnchorIndex != null) {
        // Current issue is no longer part of the done list; treat it as sitting "between"
        // done items at the index it used to occupy.
        nextId =
          delta === -1
            ? listIssueIds[doneAnchorIndex - 1] ?? null
            : listIssueIds[doneAnchorIndex] ?? null;
      } else {
        const idx = listIssueIds.indexOf(issueId);
        if (idx < 0) return;
        const nextIdx = idx + delta;
        if (nextIdx < 0 || nextIdx >= listIssueIds.length) return;
        nextId = listIssueIds[nextIdx] ?? null;
      }

      if (!nextId || nextId === issueId) return;
      navigateToIssue(nextId);
    },
    [doneAnchorIndex, issue, issueId, listIssueIds, listMode, navigateToIssue],
  );

  const { canPrevIssue, canNextIssue } = useMemo(() => {
    if (listIssueIds.length === 0) return { canPrevIssue: false, canNextIssue: false };

    if (listMode === "done" && (issue as any)?.status !== "done" && doneAnchorIndex != null) {
      return {
        canPrevIssue: doneAnchorIndex > 0,
        // Next uses the item that shifted into doneAnchorIndex after removal.
        canNextIssue: doneAnchorIndex < listIssueIds.length,
      };
    }

    const idx = listIssueIds.indexOf(issueId);
    if (idx < 0) return { canPrevIssue: false, canNextIssue: false };
    return { canPrevIssue: idx > 0, canNextIssue: idx < listIssueIds.length - 1 };
  }, [doneAnchorIndex, issue, issueId, listIssueIds, listMode]);

  const markDoneAndGoNext = useCallback(() => {
    if ((issue as any)?.status === "done") return;
    if (listMode === "done") return;

    // Determine "next" based on the current inbox ordering before the status update.
    const idx = listIssueIds.indexOf(issueId);
    const nextId = idx >= 0 ? listIssueIds[idx + 1] ?? null : null;

    updateIssueStatus("done" as any);
    enqueueGithubStatusLabelSyncIfNeeded();
    issueChat.flashPromptStatus({ kind: "issue_marked_done", message: "Marked as done" }, 3000);

    if (nextId) {
      navigateToIssue(nextId);
    } else {
      navigateToList();
    }
  }, [
    enqueueGithubStatusLabelSyncIfNeeded,
    issue,
    issueChat,
    issueId,
    listIssueIds,
    listMode,
    navigateToIssue,
    navigateToList,
    updateIssueStatus,
  ]);

  const onStatusChange = useCallback(
    (next: import("@/app/components/icons/issue-status-icon").IssueStatusKey) => {
      const prevStatus = (issue as any)?.status as string | undefined;
      if (prevStatus === next) return;

      // If we're browsing within the "done" list and we mark the current done issue as not-done,
      // keep the user within the done flow (stay in the done list context).
      if (listMode === "done" && prevStatus === "done" && next !== "done") {
        // Remember where this issue was in the done ordering so K/J can continue
        // navigating among the remaining done issues, while keeping the user here.
        const idx = listIssueIds.indexOf(issueId);
        setDoneAnchorIndex(idx >= 0 ? idx : null);
        updateIssueStatus(next as any);
        enqueueGithubStatusLabelSyncIfNeeded();
        return;
      }

      updateIssueStatus(next as any);
      enqueueGithubStatusLabelSyncIfNeeded();
    },
    [enqueueGithubStatusLabelSyncIfNeeded, issue, issueId, listIssueIds, listMode, updateIssueStatus],
  );

  const openReply = useCallback(() => {
    const name = issue?.createdBy?.name ?? "Anonymous";
    const avatarId = issue?.createdBy?.avatar ?? name;
    openReplyTo({ name, avatarId });
  }, [issue?.createdBy?.avatar, issue?.createdBy?.name, openReplyTo]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (target.isContentEditable) return true;
      if (target.closest?.('[contenteditable="true"]')) return true;
      return false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const clickHotkeyTarget = (selector: string) => {
        const el = document.querySelector(selector);
        if (!(el instanceof HTMLElement)) return false;
        const btn = (el.closest("button") as HTMLButtonElement | null) ?? null;
        if (btn && !btn.disabled) {
          btn.click();
          return true;
        }
        if ((el as any).click && !(el as any).disabled) {
          (el as any).click();
          return true;
        }
        return false;
      };

      const key = event.key.toLowerCase();
      const action =
        key === "k"
          ? "issue_detail_prev_issue"
          : key === "j"
            ? "issue_detail_next_issue"
            : key === "e"
              ? "issue_detail_mark_done"
              : key === "r"
                ? "issue_detail_reply"
                : key === "s"
                  ? "issue_detail_status_menu"
                  : key === "g"
                    ? "issue_detail_open_github"
                : null;

      if (!action) return;
      event.preventDefault();
      console.log("[issue-detail hotkey]", { action, key, issueId });

      if (action === "issue_detail_prev_issue") {
        navigateIssueRelative(-1);
      }
      if (action === "issue_detail_next_issue") {
        navigateIssueRelative(1);
      }
      if (action === "issue_detail_mark_done") {
        markDoneAndGoNext();
      }
      if (action === "issue_detail_reply") {
        clickHotkeyTarget('[data-issue-detail-reply-button="true"]');
      }
      if (action === "issue_detail_status_menu") {
        clickHotkeyTarget('[data-issue-detail-status-trigger="true"]');
      }
      if (action === "issue_detail_open_github") {
        clickHotkeyTarget('[data-issue-detail-github-button="true"]');
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [issueId, markDoneAndGoNext, navigateIssueRelative]);

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
          label?: string;
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

        const toolLabel = (() => {
          if (m.role !== "assistant") return null;
          if (!isStreaming) return null;
          const webSearchParts = toolParts.filter((p) => getToolName(p) === "webSearch");
          const listIssuesParts = toolParts.filter((p) => getToolName(p) === "listIssues");
          const isWebSearchPending = webSearchParts.some((p) => p.state !== "output-available");
          const isListIssuesPending = listIssuesParts.some((p) => p.state !== "output-available");
          if (isWebSearchPending) return "Searching...";
          if (isListIssuesPending) return "Loading issues...";
          const hasToolResults =
            webSearchParts.length > 0 || listIssuesParts.length > 0 || toolParts.length > 0;
          if (hasToolResults && markdown.length === 0 && fileParts.length === 0) return "Synthesizing...";
          return null;
        })();

        const body = [markdown, filesMarkdown].filter(Boolean).join("\n\n").trim();
        if (!body) {
          // Match /chat: show a "thinking" placeholder while the assistant is streaming.
          // Also show tool-specific placeholders (e.g. Searching...) instead of rendering "Tool: webSearch".
          const isStreamingAssistantPlaceholder =
            m.role === "assistant" &&
            isStreaming &&
            markdown.length === 0 &&
            fileParts.length === 0 &&
            toolParts.length === 0;
          if (toolLabel || isStreamingAssistantPlaceholder) {
            items.push({
              kind: "issueChatThinking",
              id: `issue-chat:thinking:${m.id}`,
              createdAt: EPHEMERAL_BASE_TS + i * 2,
              label: toolLabel ?? "Cerebrating...",
            });
          }
          continue;
        }

        const myName = getAnonymousIdentity().name ?? "Anonymous";
        const isUser = m.role === "user";

        items.push({
          kind: "issueChatMessage",
          id: `issue-chat:${m.id}`,
          createdAt: EPHEMERAL_BASE_TS + i * 2,
          fromName: isUser ? myName : "Orchid",
          body,
          variant: isUser ? "chatUser" : "chatAssistant",
        });

        // If the assistant wrote a preface (e.g. "I'll check...") and then is waiting on a tool,
        // show the tool-specific indicator below it (matches /chat UX better).
        if (toolLabel) {
          items.push({
            kind: "issueChatThinking",
            id: `issue-chat:thinking:${m.id}:tool`,
            createdAt: EPHEMERAL_BASE_TS + i * 2 + 1,
            label: toolLabel,
          });
        }
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
  const lastUserMessage = useMemo<{ id: string; createdAt: number } | null>(() => {
    for (let i = feed.length - 1; i >= 0; i--) {
      const item = feed[i];
      if (!item) continue;
      if (!("fromName" in item)) continue;
      if (item.fromName !== myName) continue;
      if (item.kind === "reply" && item.id.startsWith("issue:")) continue;
      return { id: item.id, createdAt: item.createdAt };
    }
    return null;
  }, [feed, myName]);
  const lastUserMessageId = lastUserMessage?.id ?? null;

  useLayoutEffect(() => {
    mountedAtRef.current = Date.now();
    prevUserMessageCountRef.current = 0;
  }, [issueId]);

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

    const newest = lastUserMessage;
    if (!newest) return;
    const createdAt = newest.createdAt ?? 0;
    if (createdAt < mountedAtRef.current - 1000) return;

    recalcSpacer();
    const anchorEl = lastUserMessageRef.current;
    if (anchorEl) {
      // Works with both window scrolling and nested scroll containers.
      anchorEl.style.scrollMarginTop = `${NEW_MESSAGE_SCROLL_TOP_PADDING_PX}px`;
    }
    anchorEl?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [lastUserMessage, recalcSpacer, userMessageCount]);

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
      <IssueDetailHeader
        title={issue.title}
        closeHref={
          listMode === "done" ? "/issues/completed" : listMode === "sent" ? "/issues/sent" : "/issues"
        }
        onCloseAction={(onCloseAction || onNavigateToListAction) ? navigateToList : undefined}
        onReply={openReply}
        onPrevIssue={() => navigateIssueRelative(-1)}
        onNextIssue={() => navigateIssueRelative(1)}
        prevIssueDisabled={!canPrevIssue}
        nextIssueDisabled={!canNextIssue}
        onDone={markDoneAndGoNext}
        githubIssueUrl={(issue as any).githubIssueUrl}
        githubSyncStatus={(issue as any).githubSyncStatus}
        githubSyncError={(issue as any).githubSyncError}
        status={issue.status as any}
        severity={issue.severity as any}
        onStatusChangeAction={onStatusChange}
      />

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
                      if (bi.kind === "issueChatThinking") {
                        return (
                          <div
                            key={bi.id}
                            className="group flex w-full items-end gap-2 py-4 is-assistant"
                          >
                            <div className="not-prose text-copy w-full">
                              <div className="py-1">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="bg-ai animate-pulse-size size-2 rounded-full"
                                    aria-hidden="true"
                                  />
                                  <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                                    {bi.label ?? "Cerebrating..."}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

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
                const isMainIssuePost = item.kind === "reply" && item.id.startsWith("issue:");
                const canRemovePost =
                  item.kind === "reply" && !item.id.startsWith("issue:") && "fromName" in item && item.fromName === myName;
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
                      onDoneAction={
                        isMainIssuePost
                          ? (issue as any)?.status === "done"
                            ? () => onStatusChange("in_progress" as any)
                            : markDoneAndGoNext
                          : undefined
                      }
                      doneLabel={
                        isMainIssuePost ? (((issue as any)?.status === "done" ? "Mark as not done" : "Done") as string) : undefined
                      }
                      onDeleteAction={
                        canRemovePost
                          ? () => {
                              const now = Date.now();
                              messages.delete(item.id);
                              issues.update(issueId, (draft: any) => {
                                draft.updatedAt = now;
                              });
                              issueChat.flashPromptStatus({ kind: "reply_removed", message: "Reply removed" }, 3000);
                            }
                          : undefined
                      }
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

