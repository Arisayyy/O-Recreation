"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { IssuesInboxListItem } from "./list-item";
import type { IssuesInboxItemModel } from "./types";
import { issues as issuesCollection } from "@/app/collections/issues";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";
import { formatIssueStatusLabel } from "@/app/components/icons/issue-status-icon";
import { useReplicateInitState } from "@/app/components/replicate-context";

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
      <div className="rounded-xl border border-neutral bg-white p-4 font-orchid-ui text-sm leading-6 text-orchid-muted">
        Loading issues…
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
      <div className="rounded-xl border border-neutral bg-white p-4 font-orchid-ui text-sm leading-6 text-orchid-muted">
        Loading issues…
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 font-orchid-ui leading-6">
      {computedItems.length > 0 ? (
        computedItems.map((item) => (
          <IssuesInboxListItem key={item.id} item={item} mode={mode} />
        ))
      ) : null}
    </div>
  );
}

