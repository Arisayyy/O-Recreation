import { defineSchema, type TableDefinition } from "convex/server";
import { v } from "convex/values";
import { schema } from "@trestleinc/replicate/server";

const IssueStatus = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done"),
  v.literal("canceled"),
);

const Severity = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const GithubSyncStatus = v.union(
  v.literal("pending"),
  v.literal("creating"),
  v.literal("synced"),
  v.literal("error"),
);

export const issuesSchema = schema.define({
  version: 3,
  shape: v.object({
    id: v.string(),
    title: v.string(),
    body: v.string(),
    status: IssueStatus,
    severity: v.optional(Severity),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.object({
      name: v.string(),
      color: v.string(),
      avatar: v.optional(v.string()),
    }),
    githubIssueUrl: v.optional(v.string()),
    githubIssueNumber: v.optional(v.number()),
    githubRepo: v.optional(v.string()),
    githubSyncStatus: v.optional(GithubSyncStatus),
    githubSyncError: v.optional(v.string()),
    githubSyncedAt: v.optional(v.number()),
  }),
});

export const issueMessagesSchema = schema.define({
  version: 2,
  shape: v.object({
    id: v.string(),
    issueId: v.string(),
    type: v.union(v.literal("reply"), v.literal("comment")),
    body: v.string(),
    createdAt: v.number(),
    author: v.object({
      name: v.string(),
      color: v.string(),
      avatar: v.optional(v.string()),
    }),
    githubCommentId: v.optional(v.number()),
    githubCommentUrl: v.optional(v.string()),
    githubSyncStatus: v.optional(
      v.union(v.literal("pending"), v.literal("creating"), v.literal("synced"), v.literal("error")),
    ),
    githubSyncError: v.optional(v.string()),
    githubSyncedAt: v.optional(v.number()),
  }),
});

export default defineSchema({
  issues: schema.table(
    {
      id: v.string(),
      title: v.string(),
      body: v.string(),
      status: IssueStatus,
      severity: v.optional(Severity),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.object({
        name: v.string(),
        color: v.string(),
        avatar: v.optional(v.string()),
      }),
      githubIssueUrl: v.optional(v.string()),
      githubIssueNumber: v.optional(v.number()),
      githubRepo: v.optional(v.string()),
      githubSyncStatus: v.optional(GithubSyncStatus),
      githubSyncError: v.optional(v.string()),
      githubSyncedAt: v.optional(v.number()),
    },
    (t: TableDefinition) =>
      t
        // Required by Replicate
        .index("by_doc_id", ["id"])
        .index("by_timestamp", ["timestamp"])
        // Useful query indexes
        .index("by_status", ["status"])
        .index("by_updatedAt", ["updatedAt"])
        .index("by_githubSyncStatus", ["githubSyncStatus"]),
  ),

  issueMessages: schema.table(
    {
      id: v.string(),
      issueId: v.string(),
      type: v.union(v.literal("reply"), v.literal("comment")),
      body: v.string(),
      createdAt: v.number(),
      author: v.object({
        name: v.string(),
        color: v.string(),
        avatar: v.optional(v.string()),
      }),
      githubCommentId: v.optional(v.number()),
      githubCommentUrl: v.optional(v.string()),
      githubSyncStatus: v.optional(
        v.union(v.literal("pending"), v.literal("creating"), v.literal("synced"), v.literal("error")),
      ),
      githubSyncError: v.optional(v.string()),
      githubSyncedAt: v.optional(v.number()),
    },
    (t: TableDefinition) =>
      t
        // Required by Replicate
        .index("by_doc_id", ["id"])
        .index("by_timestamp", ["timestamp"])
        // Useful query indexes
        .index("by_issueId", ["issueId"])
        .index("by_issueId_createdAt", ["issueId", "createdAt"]),
  ),
});

