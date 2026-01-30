import { defineSchema, type TableDefinition } from "convex/server";
import { v } from "convex/values";
import { schema } from "@trestleinc/replicate/server";

const IssueStatus = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("canceled"),
);

export const issuesSchema = schema.define({
  version: 1,
  shape: v.object({
    id: v.string(),
    title: v.string(),
    body: v.string(),
    status: IssueStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.object({
      name: v.string(),
      color: v.string(),
      avatar: v.optional(v.string()),
    }),
  }),
});

export const issueMessagesSchema = schema.define({
  version: 1,
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
  }),
});

export default defineSchema({
  issues: schema.table(
    {
      id: v.string(),
      title: v.string(),
      body: v.string(),
      status: IssueStatus,
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.object({
        name: v.string(),
        color: v.string(),
        avatar: v.optional(v.string()),
      }),
    },
    (t: TableDefinition) =>
      t
        // Required by Replicate
        .index("by_doc_id", ["id"])
        .index("by_timestamp", ["timestamp"])
        // Useful query indexes
        .index("by_status", ["status"])
        .index("by_updatedAt", ["updatedAt"]),
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

