"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { IssuesInboxListItem } from "./issues-inbox-list-item";
import type { IssuesInboxItemModel } from "./types";
import { issues as issuesCollection } from "@/app/collections/issues";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";

export function IssuesInboxList({
  items,
}: {
  items?: IssuesInboxItemModel[];
}) {
  const collection = issuesCollection.get();
  const { data: issues, isLoading, isError } = useLiveQuery(collection);

  const computedItems: IssuesInboxItemModel[] =
    items ??
    [...(issues ?? [])]
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .map((issue) => {
        const initial = (issue.createdBy?.name?.trim()?.[0] ?? "A").toUpperCase();
        return {
          id: issue.id,
          kind: "issue",
          avatarInitial: initial,
          fromLabel: `me, ${issue.createdBy?.name ?? "Anonymous"}`,
          summary: issue.title,
          draftTitle: issue.status,
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
          onClick={() => {
            const now = Date.now();
            const author = getAnonymousIdentity();
            collection.insert({
              id: globalThis.crypto?.randomUUID?.() ?? `${now}`,
              title: "New issue",
              body: "Describe the issue…",
              status: "todo",
              createdAt: now,
              updatedAt: now,
              createdBy: { name: author.name ?? "Anonymous", color: author.color ?? "#6366f1" },
            });
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

