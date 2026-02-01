import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

const GITHUB_REPO = "Arisayyy/rift" as const;
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

export const getIssueForSync = internalQuery({
  args: { issueId: v.string() },
  handler: async (ctx, { issueId }) => {
    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", issueId))
      .first();
    if (!issue) return null;

    return {
      id: issue.id,
      title: issue.title,
      body: issue.body,
      createdAt: issue.createdAt,
      createdBy: issue.createdBy,
      githubIssueUrl: (issue as any).githubIssueUrl as string | undefined,
    };
  },
});

export const enqueueIssueSync = mutation({
  args: { issueId: v.string() },
  handler: async (ctx, { issueId }) => {
    console.log("[githubIssues.enqueueIssueSync] called", { issueId });
    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", issueId))
      .first();
    if (!issue) {
      const delayMs = delayForAttempt(0);
      console.log("[githubIssues.enqueueIssueSync] issue not found (likely replication delay), scheduling retry", {
        issueId,
        attempt: 0,
        delayMs,
      });
      await ctx.scheduler.runAfter(
        delayMs,
        internal.githubIssues.enqueueIssueSyncRetry,
        { issueId, attempt: 0 },
      );
      return { status: "scheduled_retry" as const };
    }

    const syncStatus = (issue as any).githubSyncStatus as
      | "pending"
      | "creating"
      | "synced"
      | "error"
      | undefined;
    const existingUrl = (issue as any).githubIssueUrl as string | undefined;
    if (existingUrl || syncStatus === "creating" || syncStatus === "synced") {
      console.log("[githubIssues.enqueueIssueSync] noop", { issueId, syncStatus, hasUrl: !!existingUrl });
      return { status: "noop" as const };
    }

    const now = Date.now();
    await ctx.db.patch(issue._id, {
      githubRepo: GITHUB_REPO,
      githubSyncStatus: "creating",
      githubSyncError: undefined,
      updatedAt: now,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });

    console.log("[githubIssues.enqueueIssueSync] patched creating + scheduling GitHub action", { issueId });
    await ctx.scheduler.runAfter(0, internal.githubIssuesNode.syncIssue, { issueId });

    return { status: "enqueued" as const };
  },
});

export const enqueueIssueSyncRetry = internalMutation({
  args: { issueId: v.string(), attempt: v.number() },
  handler: async (ctx, { issueId, attempt }) => {
    const nextAttempt = attempt + 1;
    console.log("[githubIssues.enqueueIssueSyncRetry] attempt", { issueId, attempt });

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", issueId))
      .first();

    if (!issue) {
      if (nextAttempt >= ENQUEUE_RETRY_MAX_ATTEMPTS) {
        console.log("[githubIssues.enqueueIssueSyncRetry] giving up; issue still not found", {
          issueId,
          attempt,
        });
        return;
      }

      const delayMs = delayForAttempt(nextAttempt);
      console.log("[githubIssues.enqueueIssueSyncRetry] issue still not found; rescheduling", {
        issueId,
        attempt: nextAttempt,
        delayMs,
      });
      await ctx.scheduler.runAfter(delayMs, internal.githubIssues.enqueueIssueSyncRetry, {
        issueId,
        attempt: nextAttempt,
      });
      return;
    }

    const syncStatus = (issue as any).githubSyncStatus as
      | "pending"
      | "creating"
      | "synced"
      | "error"
      | undefined;
    const existingUrl = (issue as any).githubIssueUrl as string | undefined;
    if (existingUrl || syncStatus === "creating" || syncStatus === "synced") {
      console.log("[githubIssues.enqueueIssueSyncRetry] noop", { issueId, syncStatus, hasUrl: !!existingUrl });
      return;
    }

    const now = Date.now();
    await ctx.db.patch(issue._id, {
      githubRepo: GITHUB_REPO,
      githubSyncStatus: "creating",
      githubSyncError: undefined,
      updatedAt: now,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });

    console.log("[githubIssues.enqueueIssueSyncRetry] patched creating + scheduling GitHub action", { issueId });
    await ctx.scheduler.runAfter(0, internal.githubIssuesNode.syncIssue, { issueId });
  },
});

export const setGithubSyncSuccess = internalMutation({
  args: {
    issueId: v.string(),
    githubIssueUrl: v.string(),
    githubIssueNumber: v.number(),
  },
  handler: async (ctx, { issueId, githubIssueUrl, githubIssueNumber }) => {
    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", issueId))
      .first();
    if (!issue) return;

    const now = Date.now();
    await ctx.db.patch(issue._id, {
      githubRepo: GITHUB_REPO,
      githubIssueUrl,
      githubIssueNumber,
      githubSyncStatus: "synced",
      githubSyncError: undefined,
      githubSyncedAt: now,
      updatedAt: now,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });
    console.log("[githubIssues.setGithubSyncSuccess] synced", {
      issueId,
      githubIssueUrl,
      githubIssueNumber,
    });
  },
});

export const setGithubSyncError = internalMutation({
  args: { issueId: v.string(), error: v.string() },
  handler: async (ctx, { issueId, error }) => {
    const issue = await ctx.db
      .query("issues")
      .withIndex("by_doc_id", (q) => q.eq("id", issueId))
      .first();
    if (!issue) return;

    const now = Date.now();
    await ctx.db.patch(issue._id, {
      githubRepo: GITHUB_REPO,
      githubSyncStatus: "error",
      githubSyncError: error.slice(0, 2000),
      updatedAt: now,
      // Required by @trestleinc/replicate replication tables.
      timestamp: now,
    });
    console.log("[githubIssues.setGithubSyncError] error", { issueId, error: error.slice(0, 500) });
  },
});

