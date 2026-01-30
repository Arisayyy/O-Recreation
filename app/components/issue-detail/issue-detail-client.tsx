"use client";

import React, { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { issues as issuesCollection } from "@/app/collections/issues";
import { issueMessages as issueMessagesCollection } from "@/app/collections/issueMessages";
import { IssueDetailHeader } from "@/app/components/issue-detail/issue-detail-header";
import { IssueThreadMessage } from "@/app/components/issue-detail/issue-thread-message";
import { IssueReplyComposer } from "@/app/components/issue-detail/issue-reply-composer";
import { IssueComment } from "@/app/components/issue-detail/issue-comment";

export function IssueDetailClient({ issueId }: { issueId: string }) {
  const issues = issuesCollection.get();
  const messages = issueMessagesCollection.get();

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
    items.push({
      kind: "reply",
      id: `issue:${issue.id}`,
      createdAt: issue.createdAt,
      fromName: issue.createdBy?.name ?? "Anonymous",
      fromInitial: (issue.createdBy?.name?.trim()?.[0] ?? "A").toUpperCase(),
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
          body: m.body,
        });
      }
    }

    items.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return items;
  }, [allMessages, issueId, issue]);

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
      <IssueDetailHeader title={issue.title} />

      <div className="mx-auto w-full max-w-2xl px-5 pb-8 md:px-0">
        {/* Thread */}
        <div className="mt-4 space-y-4">
          {feed.map((item) => {
            if (item.kind === "comment") {
              return (
                <IssueComment
                  key={item.id}
                  name={item.fromName}
                  body={item.body}
                  timeLabel={new Date(item.createdAt).toLocaleString()}
                />
              );
            }

            return (
              <IssueThreadMessage
                key={item.id}
                message={{
                  id: item.id,
                  fromInitial: item.fromInitial,
                  fromName: item.fromName,
                  timeLabel: new Date(item.createdAt).toLocaleString(),
                  body: item.body,
                  attachments: [],
                }}
              />
            );
          })}
        </div>

        {/* Reply composer */}
        <div className="mt-4">
          <IssueReplyComposer
            issueId={issueId}
            replyToLabel={issue.createdBy?.name ?? "Anonymous"}
            replyToInitial={(issue.createdBy?.name?.trim()?.[0] ?? "A").toUpperCase()}
            defaultSubject={`Re: ${issue.title}`}
          />
        </div>
      </div>
    </div>
  );
}

