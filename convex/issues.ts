import { collection } from "@trestleinc/replicate/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

const IssueStatus = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done"),
  v.literal("canceled"),
);

export const { material, delta, replicate, presence, session } = collection.create<
  Doc<"issues">
>(components.replicate, "issues");

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    status: v.optional(IssueStatus),
    createdBy: v.object({
      name: v.string(),
      color: v.string(),
      avatar: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { title, body, status, createdBy }) => {
    const now = Date.now();
    const id =
      globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`;

    await ctx.db.insert("issues", {
      id,
      title,
      body,
      status: status ?? "backlog",
      createdAt: now,
      updatedAt: now,
      createdBy,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });

    return { id };
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db.query("issues").withIndex("by_doc_id", (q) => q.eq("id", id)).first();
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const q = ctx.db.query("issues").withIndex("by_updatedAt").order("desc");
    if (!limit) return await q.collect();
    return await q.take(limit);
  },
});

export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, { status }) => {
    return await ctx.db.query("issues").withIndex("by_status", (q) => q.eq("status", status)).collect();
  },
});

