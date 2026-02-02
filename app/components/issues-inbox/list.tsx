"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IssuesInboxListItem } from "./list-item";
import type { IssuesInboxItemModel } from "./types";
import { issues as issuesCollection } from "@/app/collections/issues";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";
import { formatIssueStatusLabel } from "@/app/components/icons/issue-status-icon";
import { useReplicateInitState } from "@/app/components/replicate-context";
import { IssueDetailClient } from "@/app/components/issue-detail";
import { IssueChatProvider } from "@/app/components/issue-detail/issue-chat-context";
import { Prompt } from "@/app/components/prompt";
import { ConversationPromptBackdrop } from "@/app/components/conversation-prompt-backdrop";

function IssuesInboxEmptyState({
  mode,
  loading = false,
}: {
  mode: "inbox" | "done" | "sent";
  loading?: boolean;
}) {
  const copy =
    mode === "sent"
      ? "Sent issues will appear here"
      : mode === "done"
        ? "Completed issues will appear here"
        : "New issues will appear here";

  return (
    <div className="w-full py-24 flex flex-col items-center justify-center gap-2 text-center font-orchid-ui text-sm leading-6">
      <svg
        width="33"
        height="32"
        viewBox="0 0 33 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={["h-5 w-5 text-orchid-placeholder", loading ? "animate-spin" : ""].join(" ")}
        aria-hidden={loading ? undefined : "true"}
        focusable="false"
        role={loading ? "img" : undefined}
        aria-label={loading ? "Loading issues" : undefined}
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
      <p
        className={[
          "m-0 text-orchid-muted transition-opacity duration-200",
          loading ? "opacity-0" : "opacity-100",
        ].join(" ")}
        aria-hidden={loading ? true : undefined}
      >
        {copy}
      </p>
      {loading ? <span className="sr-only">Loading issues</span> : null}
    </div>
  );
}

export function IssuesInboxList({
  items,
  mode = "inbox",
}: {
  items?: IssuesInboxItemModel[];
  mode?: "inbox" | "done" | "sent";
}) {
  const { ready, error, retry } = useReplicateInitState();

  // Don't call hooks that require the collection until Replicate is initialized.
  if (!ready) {
    return (
      <div className="flex w-full flex-col gap-4 font-orchid-ui leading-6">
        <IssuesInboxEmptyState mode={mode} loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-neutral bg-white p-4 font-orchid-ui text-sm leading-6 text-orchid-ink">
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

  return <IssuesInboxListReady items={items} mode={mode} />;
}

function IssuesInboxListReady({
  items,
  mode,
}: {
  items?: IssuesInboxItemModel[];
  mode: "inbox" | "done" | "sent";
}) {
  const collection = issuesCollection.get();
  const { data: issues, isLoading, isError } = useLiveQuery(collection);

  const listPath = useMemo(() => {
    return mode === "done" ? "/issues/completed" : mode === "sent" ? "/issues/sent" : "/issues";
  }, [mode]);

  const [openIssueId, setOpenIssueId] = useState<string | null>(null);
  const openIssueIdRef = useRef<string | null>(null);
  useEffect(() => {
    openIssueIdRef.current = openIssueId;
  }, [openIssueId]);

  const readIssueIdFromLocation = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("issue");
    return raw ? decodeURIComponent(raw) : null;
  }, []);

  useEffect(() => {
    const syncFromLocation = () => setOpenIssueId(readIssueIdFromLocation());
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [readIssueIdFromLocation]);

  useEffect(() => {
    if (!openIssueId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openIssueId]);

  const openIssue = useCallback(
    (issueId: string) => {
      setOpenIssueId(issueId);
      if (typeof window === "undefined") return;

      const href = `${listPath}?issue=${encodeURIComponent(issueId)}`;
      const state = { __orchidIssueOverlay: true, listPath };

      if (openIssueIdRef.current) {
        window.history.replaceState(state, "", href);
      } else {
        window.history.pushState(state, "", href);
      }
    },
    [listPath],
  );

  const closeIssue = useCallback(() => {
    setOpenIssueId(null);
    if (typeof window === "undefined") return;

    const s = window.history.state as any;
    if (s?.__orchidIssueOverlay) {
      window.history.back();
      return;
    }

    window.history.replaceState(window.history.state, "", listPath);
  }, [listPath]);

  const me = useMemo(() => getAnonymousIdentity(), []);
  const myName = me.name ?? "Anonymous";

  const issueFilter = useMemo(() => {
    return (issue: any) => {
      if (mode === "done") return issue.status === "done";
      if (mode === "sent") {
        const isSent = !!issue.githubSyncStatus || !!issue.githubIssueUrl;
        const isMine = (issue.createdBy?.name ?? "Anonymous") === myName;
        return isSent && isMine;
      }
      // Default inbox: hide done issues.
      return issue.status !== "done";
    };
  }, [mode, myName]);

  const computedItems: IssuesInboxItemModel[] =
    items ??
    [...(issues ?? [])]
      .filter((issue) => issueFilter(issue))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .map((issue) => {
        const initial = (issue.createdBy?.name?.trim()?.[0] ?? "A").toUpperCase();
        const avatarName = issue.createdBy?.name ?? "Anonymous";
        return {
          id: issue.id,
          kind: "issue",
          status: issue.status,
          avatarInitial: initial,
          avatarId: avatarName,
          avatarName,
          fromLabel: avatarName,
          summary: issue.title,
          draftTitle: formatIssueStatusLabel(issue.status),
          draftBody: issue.body || "No description yet.",
          ctaLabel: "Open",
        };
      });

  if (isError) {
    return (
      <div className="rounded-xl border border-neutral bg-white p-4 font-orchid-ui text-sm leading-6 text-orchid-ink">
        Failed to load issues. Please refresh.
      </div>
    );
  }

  if (isLoading && !items) {
    return (
      <div className="flex w-full flex-col gap-4 font-orchid-ui leading-6">
        <IssuesInboxEmptyState mode={mode} loading />
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-4 font-orchid-ui leading-6">
        {computedItems.length > 0 ? (
          computedItems.map((item) => (
            <IssuesInboxListItem key={item.id} item={item} mode={mode} onOpenIssue={openIssue} />
          ))
        ) : (
          <IssuesInboxEmptyState mode={mode} />
        )}
      </div>

      {openIssueId ? (
        <div className="fixed inset-0 z-[90] bg-background">
          <div
            className="min-h-0 h-full w-full overflow-y-auto pb-4"
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <IssueChatProvider issueId={openIssueId}>
              <ConversationPromptBackdrop className="inset-x-0" />
              <div className="fixed inset-x-0 bottom-6 z-[95] mx-auto w-full max-w-2xl px-5 md:px-0">
                <Prompt variant="issues" issueIdForComment={openIssueId} />
              </div>
              <IssueDetailClient
                issueId={openIssueId}
                listMode={mode === "done" ? "done" : mode === "sent" ? "sent" : "inbox"}
                onNavigateIssueIdAction={(nextId) => openIssue(nextId)}
                onNavigateToListAction={() => closeIssue()}
                onCloseAction={() => closeIssue()}
              />
            </IssueChatProvider>
          </div>
        </div>
      ) : null}
    </>
  );
}

