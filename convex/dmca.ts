import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const logFinish = mutation({
  args: {
    repo: v.string(),
    deviceId: v.optional(v.string()),
    userName: v.optional(v.string()),
    userColor: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { repo, deviceId, userName, userColor, userAgent }) => {
    const now = Date.now();
    // Avoid needing regenerated types for new tables.
    await (ctx.db as any).insert("dmcaSubmissions", {
      createdAt: now,
      repo,
      deviceId,
      userName,
      userColor,
      userAgent,
    });
    return { ok: true as const };
  },
});

