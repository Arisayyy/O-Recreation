import { collection } from "@trestleinc/replicate/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { components } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

export const { material, delta, replicate, presence, session } = collection.create<
  Doc<"issueMessages">
>(components.replicate, "issueMessages");

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("issueMessages")
      .withIndex("by_doc_id", (q) => q.eq("id", id))
      .first();
  },
});

export const listByIssueId = query({
  args: { issueId: v.string() },
  handler: async (ctx, { issueId }) => {
    return await ctx.db
      .query("issueMessages")
      .withIndex("by_issueId_createdAt", (q) => q.eq("issueId", issueId))
      .order("asc")
      .collect();
  },
});

