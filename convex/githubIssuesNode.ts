"use node";

import * as Y from "yjs";
import { v } from "convex/values";
import { api, components, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const GITHUB_REPO = "Arisayyy/rift" as const;

function buildYjsDeltaForFields(params: {
  baseBytes: ArrayBuffer | null;
  set: Record<string, unknown>;
  deleteKeys?: string[];
}): Uint8Array {
  const doc = new Y.Doc();
  const fields = doc.getMap<unknown>("fields");

  if (params.baseBytes) {
    Y.applyUpdateV2(doc, new Uint8Array(params.baseBytes), "server");
  }

  const beforeVector = Y.encodeStateVector(doc);
  doc.transact(() => {
    for (const [k, v] of Object.entries(params.set)) {
      fields.set(k, v);
    }
    for (const k of params.deleteKeys ?? []) {
      fields.delete(k);
    }
  }, "server");

  return Y.encodeStateAsUpdateV2(doc, beforeVector);
}

function getGithubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN env var (GitHub PAT).");
  return token;
}

function githubHeaders() {
  const token = getGithubToken();
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "orchid-convex",
    "Content-Type": "application/json",
  };
}

function issueMarker(issueId: string) {
  return `Orchid issue id: ${issueId}`;
}

async function githubRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

type GithubSearchIssuesResponse = {
  items: Array<{
    number: number;
    html_url: string;
  }>;
};

type GithubCreateIssueResponse = {
  number: number;
  html_url: string;
};

export const syncIssue = internalAction({
  args: { issueId: v.string() },
  handler: async (ctx, { issueId }) => {
    console.log("[githubIssuesNode.syncIssue] start", { issueId, repo: GITHUB_REPO });
    const issue = await ctx.runQuery(internal.githubIssues.getIssueForSync, { issueId });
    if (!issue) {
      console.log("[githubIssuesNode.syncIssue] issue not found (unexpected once enqueued)", { issueId });
      return;
    }

    // If already synced, don't do duplicate work.
    if (issue.githubIssueUrl) {
      console.log("[githubIssuesNode.syncIssue] already synced; skipping", {
        issueId,
        githubIssueUrl: issue.githubIssueUrl,
      });
      return;
    }

    try {
      const docState = await ctx.runQuery(components.replicate.mutations.getDocumentState, {
        collection: "issues",
        document: issueId,
      });

      const marker = issueMarker(issueId);
      // GitHub Search API requires `is:issue` or `is:pull-request`.
      const q = encodeURIComponent(`repo:${GITHUB_REPO} is:issue in:body "${marker}"`);
      console.log("[githubIssuesNode.syncIssue] searching existing", { issueId, query: q });
      const search = await githubRequest<GithubSearchIssuesResponse>(
        `https://api.github.com/search/issues?q=${q}`,
        { method: "GET", headers: githubHeaders() },
      );

      const found = search.items?.[0];
      if (found?.html_url && typeof found.number === "number") {
        console.log("[githubIssuesNode.syncIssue] found existing", {
          issueId,
          githubIssueUrl: found.html_url,
          githubIssueNumber: found.number,
        });
        const now = Date.now();
        const delta = buildYjsDeltaForFields({
          baseBytes: docState?.bytes ?? null,
          set: {
            githubRepo: GITHUB_REPO,
            githubIssueUrl: found.html_url,
            githubIssueNumber: found.number,
            githubSyncStatus: "synced",
            githubSyncedAt: now,
            updatedAt: now,
          },
          deleteKeys: ["githubSyncError"],
        });

        await ctx.runMutation(api.issues.replicate, {
          document: issueId,
          bytes: delta.buffer as ArrayBuffer,
          material: {
            ...issue,
            githubRepo: GITHUB_REPO,
            githubIssueUrl: found.html_url,
            githubIssueNumber: found.number,
            githubSyncStatus: "synced",
            githubSyncedAt: now,
            updatedAt: now,
          },
          type: "update",
        });
        return;
      }

      const bodyParts = [
        issue.body?.trim() ?? "",
        "",
        "---",
        marker,
        `Orchid createdAt: ${new Date(issue.createdAt).toISOString()}`,
        `Orchid createdBy: ${issue.createdBy?.name ?? "Unknown"}`,
      ].filter(Boolean);

      console.log("[githubIssuesNode.syncIssue] creating new GitHub issue", {
        issueId,
        title: issue.title,
        bodyLength: bodyParts.join("\n").length,
      });
      const created = await githubRequest<GithubCreateIssueResponse>(
        `https://api.github.com/repos/${GITHUB_REPO}/issues`,
        {
          method: "POST",
          headers: githubHeaders(),
          body: JSON.stringify({
            title: issue.title,
            body: bodyParts.join("\n"),
          }),
        },
      );

      console.log("[githubIssuesNode.syncIssue] created", {
        issueId,
        githubIssueUrl: created.html_url,
        githubIssueNumber: created.number,
      });
      {
        const now = Date.now();
        const delta = buildYjsDeltaForFields({
          baseBytes: docState?.bytes ?? null,
          set: {
            githubRepo: GITHUB_REPO,
            githubIssueUrl: created.html_url,
            githubIssueNumber: created.number,
            githubSyncStatus: "synced",
            githubSyncedAt: now,
            updatedAt: now,
          },
          deleteKeys: ["githubSyncError"],
        });

        await ctx.runMutation(api.issues.replicate, {
          document: issueId,
          bytes: delta.buffer as ArrayBuffer,
          material: {
            ...issue,
            githubRepo: GITHUB_REPO,
            githubIssueUrl: created.html_url,
            githubIssueNumber: created.number,
            githubSyncStatus: "synced",
            githubSyncedAt: now,
            updatedAt: now,
          },
          type: "update",
        });
      }
    } catch (err) {
      console.log("[githubIssuesNode.syncIssue] error", {
        issueId,
        error: err instanceof Error ? err.message : String(err),
      });
      const now = Date.now();
      const docState = await ctx
        .runQuery(components.replicate.mutations.getDocumentState, {
          collection: "issues",
          document: issueId,
        })
        .catch(() => null);

      const errorMsg = err instanceof Error ? err.message : String(err);
      const delta = buildYjsDeltaForFields({
        baseBytes: docState?.bytes ?? null,
        set: {
          githubRepo: GITHUB_REPO,
          githubSyncStatus: "error",
          githubSyncError: errorMsg.slice(0, 2000),
          updatedAt: now,
        },
      });

      await ctx.runMutation(api.issues.replicate, {
        document: issueId,
        bytes: delta.buffer as ArrayBuffer,
        material: {
          ...issue,
          githubRepo: GITHUB_REPO,
          githubSyncStatus: "error",
          githubSyncError: errorMsg.slice(0, 2000),
          updatedAt: now,
        },
        type: "update",
      });
    }
  },
});

