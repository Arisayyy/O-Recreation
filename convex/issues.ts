import { collection } from "@trestleinc/replicate/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { components } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

export const { material, delta, replicate, presence, session } = collection.create<
  Doc<"issues">
>(components.replicate, "issues");

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

