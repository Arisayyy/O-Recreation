"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "convex/react";
import { IssuesInboxListItem } from "./list-item";
import type { IssuesInboxItemModel } from "./types";
import { issues as issuesCollection } from "@/app/collections/issues";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";
import { api } from "@/convex/_generated/api";
import { formatIssueStatusLabel } from "@/app/components/icons/issue-status-icon";
import { useReplicateInitState } from "@/app/components/replicate-context";

export function IssuesInboxList({
  items,
}: {
  items?: IssuesInboxItemModel[];
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

  return <IssuesInboxListReady items={items} />;
}

function IssuesInboxListReady({ items }: { items?: IssuesInboxItemModel[] }) {
  const collection = issuesCollection.get();
  const enqueueIssueSync = useMutation(api.githubIssues.enqueueIssueSync);
  const { data: issues, isLoading, isError } = useLiveQuery(collection);

  const computedItems: IssuesInboxItemModel[] =
    items ??
    [...(issues ?? [])]
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

  if (!items && computedItems.length === 0) {
    return (
      <div className="rounded-xl border border-neutral bg-white p-4 font-orchid-ui text-sm leading-6 text-orchid-ink">
        <div className="font-medium">No issues yet</div>
        <div className="mt-1 text-orchid-muted">
          Create one to verify offline-first sync.
        </div>
        <button
          type="button"
          className="mt-3 inline-flex h-8 items-center rounded-orchid-pill border border-neutral bg-white px-3 text-sm font-medium text-orchid-ink shadow-xs"
          onClick={async () => {
            const now = Date.now();
            const author = getAnonymousIdentity();
            const id = globalThis.crypto?.randomUUID?.() ?? `${now}`;
            collection.insert({
              id,
              title: "New issue",
              body: "Describe the issue…",
              status: "todo",
              createdAt: now,
              updatedAt: now,
              createdBy: { name: author.name ?? "Anonymous", color: author.color ?? "#6366f1" },
              githubRepo: "Arisayyy/rift",
              githubSyncStatus: "pending",
            });
            try {
              await enqueueIssueSync({ issueId: id });
            } catch {
              // Keep the issue; GitHub sync isn't critical for inbox demo UX.
            }
          }}
        >
          Create issue
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 font-orchid-ui leading-6">
      {computedItems.map((item) => (
        <IssuesInboxListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

