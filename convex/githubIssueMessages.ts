import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

// Replicate sync to Convex can take a few seconds (or longer on cold start / bad network).
// We retry for ~60s max, without a global cron.
const ENQUEUE_RETRY_MAX_ATTEMPTS = 30;

function delayForAttempt(attempt: number): number {
  // attempt=0 is the first retry (after the initial miss).
  const base = Math.min(2000, 250 * (attempt + 1));
  // Small jitter to avoid thundering herd.
  const jitter = Math.floor(Math.random() * 150);
  return base + jitter;
}

export const getIssueMessageForSync = internalQuery({
  args: { issueMessageId: v.string() },
  handler: async (ctx, { issueMessageId }) => {
    const msg = await ctx.db
      .query("issueMessages")
      .withIndex("by_doc_id", (q) => q.eq("id", issueMessageId))
      .first();
    if (!msg) return null;

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", msg.issueId))
      .first();

    return {
      id: msg.id,
      issueId: msg.issueId,
      type: msg.type,
      body: msg.body,
      createdAt: msg.createdAt,
      author: msg.author,
      githubCommentId: msg.githubCommentId,
      githubCommentUrl: msg.githubCommentUrl,
      githubSyncStatus: msg.githubSyncStatus,
      githubSyncError: msg.githubSyncError,
      githubSyncedAt: msg.githubSyncedAt,
      githubIssueNumber: issue?.githubIssueNumber,
      githubIssueUrl: issue?.githubIssueUrl,
    };
  },
});

export const enqueueIssueMessageSync = mutation({
  args: { issueMessageId: v.string() },
  handler: async (ctx, { issueMessageId }) => {
    console.log("[githubIssueMessages.enqueueIssueMessageSync] called", { issueMessageId });
    const msg = await ctx.db
      .query("issueMessages")
      .withIndex("by_doc_id", (q) => q.eq("id", issueMessageId))
      .first();
    if (!msg) {
      const delayMs = delayForAttempt(0);
      console.log(
        "[githubIssueMessages.enqueueIssueMessageSync] message not found (likely replication delay), scheduling retry",
        { issueMessageId, attempt: 0, delayMs },
      );
      await ctx.scheduler.runAfter(delayMs, internal.githubIssueMessages.enqueueIssueMessageSyncRetry, {
        issueMessageId,
        attempt: 0,
      });
      return { status: "scheduled_retry" as const };
    }

    // Only sync user replies (not system comments / assistant content).
    if (msg.type !== "reply") {
      return { status: "noop" as const };
    }

    const existingId = msg.githubCommentId;
    const syncStatus = msg.githubSyncStatus;
    if (typeof existingId === "number" || syncStatus === "creating" || syncStatus === "synced") {
      return { status: "noop" as const };
    }

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", msg.issueId))
      .first();
    if (!issue?.githubIssueNumber) {
      const delayMs = delayForAttempt(0);
      console.log(
        "[githubIssueMessages.enqueueIssueMessageSync] missing githubIssueNumber, scheduling retry",
        { issueMessageId, attempt: 0, delayMs },
      );
      await ctx.scheduler.runAfter(delayMs, internal.githubIssueMessages.enqueueIssueMessageSyncRetry, {
        issueMessageId,
        attempt: 0,
      });
      return { status: "scheduled_retry" as const };
    }

    const now = Date.now();
    await ctx.db.patch(msg._id, {
      githubSyncStatus: "creating",
      githubSyncError: undefined,
      githubSyncedAt: undefined,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });

    await ctx.scheduler.runAfter(0, internal.githubIssuesNode.syncIssueMessage, { issueMessageId });
    return { status: "enqueued" as const };
  },
});

export const enqueueIssueMessageSyncRetry = internalMutation({
  args: { issueMessageId: v.string(), attempt: v.number() },
  handler: async (ctx, { issueMessageId, attempt }) => {
    const nextAttempt = attempt + 1;
    console.log("[githubIssueMessages.enqueueIssueMessageSyncRetry] attempt", { issueMessageId, attempt });

    const msg = await ctx.db
      .query("issueMessages")
      .withIndex("by_doc_id", (q) => q.eq("id", issueMessageId))
      .first();

    if (!msg) {
      if (nextAttempt >= ENQUEUE_RETRY_MAX_ATTEMPTS) {
        console.log("[githubIssueMessages.enqueueIssueMessageSyncRetry] giving up; message still not found", {
          issueMessageId,
          attempt,
        });
        return;
      }

      const delayMs = delayForAttempt(nextAttempt);
      await ctx.scheduler.runAfter(delayMs, internal.githubIssueMessages.enqueueIssueMessageSyncRetry, {
        issueMessageId,
        attempt: nextAttempt,
      });
      return;
    }

    if (msg.type !== "reply") return;

    const existingId = msg.githubCommentId;
    const syncStatus = msg.githubSyncStatus;
    if (typeof existingId === "number" || syncStatus === "creating" || syncStatus === "synced") {
      return;
    }

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", msg.issueId))
      .first();

    if (!issue?.githubIssueNumber) {
      if (nextAttempt >= ENQUEUE_RETRY_MAX_ATTEMPTS) {
        console.log(
          "[githubIssueMessages.enqueueIssueMessageSyncRetry] giving up; still missing githubIssueNumber",
          { issueMessageId, attempt },
        );
        return;
      }

      const delayMs = delayForAttempt(nextAttempt);
      await ctx.scheduler.runAfter(delayMs, internal.githubIssueMessages.enqueueIssueMessageSyncRetry, {
        issueMessageId,
        attempt: nextAttempt,
      });
      return;
    }

    const now = Date.now();
    await ctx.db.patch(msg._id, {
      githubSyncStatus: "creating",
      githubSyncError: undefined,
      githubSyncedAt: undefined,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });

    await ctx.scheduler.runAfter(0, internal.githubIssuesNode.syncIssueMessage, { issueMessageId });
  },
});

export const setIssueMessageSyncSuccess = internalMutation({
  args: { issueMessageId: v.string(), githubCommentId: v.number(), githubCommentUrl: v.string() },
  handler: async (ctx, { issueMessageId, githubCommentId, githubCommentUrl }) => {
    const msg = await ctx.db
      .query("issueMessages")
      .withIndex("by_doc_id", (q) => q.eq("id", issueMessageId))
      .first();
    if (!msg) return;

    const now = Date.now();
    await ctx.db.patch(msg._id, {
      githubCommentId,
      githubCommentUrl,
      githubSyncStatus: "synced",
      githubSyncError: undefined,
      githubSyncedAt: now,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });
  },
});

export const setIssueMessageSyncError = internalMutation({
  args: { issueMessageId: v.string(), error: v.string() },
  handler: async (ctx, { issueMessageId, error }) => {
    const msg = await ctx.db
      .query("issueMessages")
      .withIndex("by_doc_id", (q) => q.eq("id", issueMessageId))
      .first();
    if (!msg) return;

    const now = Date.now();
    await ctx.db.patch(msg._id, {
      githubSyncStatus: "error",
      githubSyncError: error.slice(0, 2000),
      githubSyncedAt: undefined,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });
  },
});

