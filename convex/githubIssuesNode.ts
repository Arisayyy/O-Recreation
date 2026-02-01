"use node";

import * as crypto from "node:crypto";
import * as Y from "yjs";
import { v } from "convex/values";
import { api, components, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

type IssueStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "canceled";
type Severity = "low" | "medium" | "high" | "critical";
type GithubLabelConfig = { name: string; color: string; description: string };

const STATUS_LABELS: Record<IssueStatus, GithubLabelConfig> = {
  backlog: { name: "Backlog", color: "d0d7de", description: "Orchid status: Backlog" },
  todo: { name: "Todo", color: "ededed", description: "Orchid status: Todo" },
  in_progress: { name: "In Progress", color: "fbca04", description: "Orchid status: In Progress" },
  in_review: { name: "In Review", color: "0e8a16", description: "Orchid status: In Review" },
  done: { name: "Done", color: "1d76db", description: "Orchid status: Done" },
  canceled: { name: "Cancelled", color: "9e9e9e", description: "Orchid status: Cancelled" },
};

const STATUS_LABEL_NAMES = new Set<string>(Object.values(STATUS_LABELS).map((l) => l.name));

const SEVERITY_LABELS: Record<Severity, GithubLabelConfig> = {
  low: { name: "Low", color: "2da44e", description: "Orchid severity: Low" },
  medium: { name: "Medium", color: "bf8700", description: "Orchid severity: Medium" },
  high: { name: "High", color: "d93f0b", description: "Orchid severity: High" },
  critical: { name: "Critical", color: "b60205", description: "Orchid severity: Critical" },
};

const SEVERITY_LABEL_NAMES = new Set<string>(Object.values(SEVERITY_LABELS).map((l) => l.name));

function stripMarkdownSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(String.raw`(^|\n)## ${escaped}\n[\s\S]*?(?=\n## |\n?$)`, "g");
  return markdown.replace(re, "\n").trim();
}

function parseSeverityFromBody(markdown: string): Severity | null {
  const escaped = "Severity".replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(String.raw`(^|\n)## ${escaped}\n([\s\S]*?)(?=\n## |\n?$)`, "g");
  const m = re.exec(markdown);
  const raw = (m?.[2] ?? "").trim();
  if (!raw) return null;
  const firstLine = raw.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
  const normalized = firstLine.replace(/^[*-]\s*/, "").trim().toLowerCase();
  if (normalized === "low") return "low";
  if (normalized === "medium") return "medium";
  if (normalized === "high") return "high";
  if (normalized === "critical") return "critical";
  return null;
}

function getGithubRepo(): string {
  const repo = process.env.GITHUB_REPO?.trim();
  if (!repo) throw new Error("Missing GITHUB_REPO env var (owner/repo).");
  return repo;
}

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

function base64UrlEncode(input: string | Uint8Array): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input);
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function getGithubAppConfig():
  | { appId: string; installationId: string; privateKeyPem: string }
  | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !installationId || !privateKeyRaw) return null;

  // Many secret stores provide PEMs with literal "\n" sequences.
  const privateKeyPem = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replaceAll("\\n", "\n")
    : privateKeyRaw;

  return { appId, installationId, privateKeyPem };
}

function createGithubAppJwt(params: { appId: string; privateKeyPem: string }): string {
  // GitHub requires exp <= 10 minutes from iat.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const iat = nowSeconds - 10; // small clock skew allowance
  const exp = nowSeconds + 9 * 60; // 9 minutes

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iat,
      exp,
      iss: params.appId,
    }),
  );
  const signingInput = `${header}.${payload}`;

  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .end()
    .sign(params.privateKeyPem);

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

let cachedInstallationToken:
  | { token: string; expiresAtMs: number }
  | null = null;

async function getGithubInstallationToken(): Promise<string> {
  const cfg = getGithubAppConfig();
  if (!cfg) {
    throw new Error(
      "Missing GitHub App env vars. Set GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY.",
    );
  }

  const now = Date.now();
  if (cachedInstallationToken && cachedInstallationToken.expiresAtMs > now + 30_000) {
    return cachedInstallationToken.token;
  }

  const jwt = createGithubAppJwt({ appId: cfg.appId, privateKeyPem: cfg.privateKeyPem });
  const res = await fetch(
    `https://api.github.com/app/installations/${cfg.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "orchid-convex",
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GitHub App token error ${res.status}: ${text || res.statusText}`,
    );
  }

  const json = (await res.json()) as { token: string; expires_at: string };
  const expiresAtMs = Date.parse(json.expires_at);
  cachedInstallationToken = { token: json.token, expiresAtMs };
  return json.token;
}

async function getGithubAccessToken(): Promise<string> {
  // Always use GitHub App identity (shows as <AppName>[bot]).
  return await getGithubInstallationToken();
}

async function githubHeaders() {
  const token = await getGithubAccessToken();
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

async function githubRequestOptional<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, init);
  if (res.status === 404) return null;
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

type GithubIssueComment = {
  id: number;
  html_url: string;
  body?: string | null;
};

type GithubLabel = {
  name: string;
  color?: string;
  description?: string | null;
};

async function ensureGithubLabelExists(repo: string, label: GithubLabelConfig): Promise<void> {
  const headers = await githubHeaders();
  const existing = await githubRequestOptional<GithubLabel>(
    `https://api.github.com/repos/${repo}/labels/${encodeURIComponent(label.name)}`,
    { method: "GET", headers },
  );
  if (existing) return;

  await githubRequest<GithubLabel>(`https://api.github.com/repos/${repo}/labels`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: label.name,
      color: label.color,
      description: label.description,
    }),
  });
}

async function syncGithubIssueLabels(params: {
  repo: string;
  issueNumber: number;
  status: IssueStatus;
  severity?: Severity | null;
}): Promise<void> {
  const statusLabel = STATUS_LABELS[params.status];
  const severityLabel = params.severity ? SEVERITY_LABELS[params.severity] : null;

  if (statusLabel) {
    await ensureGithubLabelExists(params.repo, statusLabel);
  }
  if (severityLabel) {
    await ensureGithubLabelExists(params.repo, severityLabel);
  }

  const headers = await githubHeaders();
  const current = await githubRequest<GithubLabel[]>(
    `https://api.github.com/repos/${params.repo}/issues/${params.issueNumber}/labels`,
    { method: "GET", headers },
  );
  const currentNames = (current ?? []).map((l) => l.name).filter(Boolean);

  const keep = currentNames.filter((n) => !STATUS_LABEL_NAMES.has(n) && !SEVERITY_LABEL_NAMES.has(n));
  const additions = [statusLabel?.name, severityLabel?.name].filter(Boolean) as string[];
  const next = Array.from(new Set([...keep, ...additions]));

  await githubRequest<unknown>(
    `https://api.github.com/repos/${params.repo}/issues/${params.issueNumber}/labels`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ labels: next }),
    },
  );
}

export const syncIssue = internalAction({
  args: { issueId: v.string() },
  handler: async (ctx, { issueId }) => {
    const repo = getGithubRepo();
    console.log("[githubIssuesNode.syncIssue] start", { issueId, repo });
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

      const status = (issue.status ?? "backlog") as IssueStatus;
      const statusLabel = STATUS_LABELS[status]?.name;
      const severity =
        ((issue.severity ?? null) as Severity | null) ??
        parseSeverityFromBody(issue.body?.trim() ?? "");
      const severityLabel = severity ? SEVERITY_LABELS[severity]?.name : undefined;

      const marker = issueMarker(issueId);
      // GitHub Search API requires `is:issue` or `is:pull-request`.
      const q = encodeURIComponent(`repo:${repo} is:issue in:body "${marker}"`);
      console.log("[githubIssuesNode.syncIssue] searching existing", { issueId, query: q });
      const search = await githubRequest<GithubSearchIssuesResponse>(
        `https://api.github.com/search/issues?q=${q}`,
        { method: "GET", headers: await githubHeaders() },
      );

      const found = search.items?.[0];
      if (found?.html_url && typeof found.number === "number") {
        await syncGithubIssueLabels({ repo, issueNumber: found.number, status, severity });

        console.log("[githubIssuesNode.syncIssue] found existing", {
          issueId,
          githubIssueUrl: found.html_url,
          githubIssueNumber: found.number,
        });
        const now = Date.now();
        const delta = buildYjsDeltaForFields({
          baseBytes: docState?.bytes ?? null,
          set: {
            githubRepo: repo,
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
            githubRepo: repo,
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

      const cleanedBody = stripMarkdownSection(issue.body?.trim() ?? "", "Severity");
      const bodyParts = [
        cleanedBody,
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

      const labelCfg = STATUS_LABELS[status];
      if (labelCfg) {
        await ensureGithubLabelExists(repo, labelCfg);
      }
      const severityCfg = severity ? SEVERITY_LABELS[severity] : null;
      if (severityCfg) {
        await ensureGithubLabelExists(repo, severityCfg);
      }

      const created = await githubRequest<GithubCreateIssueResponse>(
        `https://api.github.com/repos/${repo}/issues`,
        {
          method: "POST",
          headers: await githubHeaders(),
          body: JSON.stringify({
            title: issue.title,
            body: bodyParts.join("\n"),
            labels: [statusLabel, severityLabel].filter(Boolean),
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
            githubRepo: repo,
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
            githubRepo: repo,
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
      const repo = getGithubRepo();
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
          githubRepo: repo,
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
          githubRepo: repo,
          githubSyncStatus: "error",
          githubSyncError: errorMsg.slice(0, 2000),
          updatedAt: now,
        },
        type: "update",
      });
    }
  },
});

export const syncIssueStatusLabel = internalAction({
  args: { issueId: v.string() },
  handler: async (ctx, { issueId }) => {
    const repo = getGithubRepo();
    const issue = await ctx.runQuery(internal.githubIssues.getIssueForSync, { issueId });
    if (!issue) return;

    const issueNumber = issue.githubIssueNumber;
    if (typeof issueNumber !== "number") {
      console.log("[githubIssuesNode.syncIssueStatusLabel] missing githubIssueNumber; skipping", { issueId });
      return;
    }

    const status = (issue.status ?? "backlog") as IssueStatus;
    const severity =
      ((issue.severity ?? null) as Severity | null) ??
      parseSeverityFromBody(issue.body?.trim() ?? "");
    console.log("[githubIssuesNode.syncIssueStatusLabel] syncing", { issueId, repo, issueNumber, status, severity });
    await syncGithubIssueLabels({ repo, issueNumber, status, severity });
  },
});

export const syncIssueMessage = internalAction({
  args: { issueMessageId: v.string() },
  handler: async (ctx, { issueMessageId }) => {
    const repo = getGithubRepo();
    console.log("[githubIssuesNode.syncIssueMessage] start", { issueMessageId, repo });

    const msg = await ctx.runQuery(internal.githubIssueMessages.getIssueMessageForSync, { issueMessageId });
    if (!msg) return;

    if (msg.type !== "reply") return;

    if (typeof msg.githubCommentId === "number") {
      console.log("[githubIssuesNode.syncIssueMessage] already synced; skipping", {
        issueMessageId,
        githubCommentId: msg.githubCommentId,
      });
      return;
    }

    const issueNumber = msg.githubIssueNumber;
    if (typeof issueNumber !== "number") {
      console.log("[githubIssuesNode.syncIssueMessage] missing githubIssueNumber; skipping", { issueMessageId });
      return;
    }

    const authorName = msg.author?.name ?? "Anonymous";
    const replyBody = msg.body?.trim() ?? "";
    const body = [`**${authorName}:**`, "", replyBody].filter(Boolean).join("\n");

    try {
      const headers = await githubHeaders();

      // Idempotency: best-effort matching (no explicit marker in the comment body).
      const existing = await githubRequest<GithubIssueComment[]>(
        `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments?per_page=100`,
        { method: "GET", headers },
      );
      // Back-compat: if an older comment exists with the previous marker format, reuse it.
      const legacyMarker = `Orchid issueMessage id: ${issueMessageId}`;
      const found =
        (existing ?? []).find((c) => (c.body ?? "").includes(legacyMarker)) ??
        (existing ?? []).find((c) => (c.body ?? "").trim() === body.trim());
      if (found) {
        await ctx.runMutation(internal.githubIssueMessages.setIssueMessageSyncSuccess, {
          issueMessageId,
          githubCommentId: found.id,
          githubCommentUrl: found.html_url,
        });
        return;
      }

      const created = await githubRequest<GithubIssueComment>(
        `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ body }),
        },
      );

      await ctx.runMutation(internal.githubIssueMessages.setIssueMessageSyncSuccess, {
        issueMessageId,
        githubCommentId: created.id,
        githubCommentUrl: created.html_url,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.githubIssueMessages.setIssueMessageSyncError, {
        issueMessageId,
        error: errorMsg,
      });
    }
  },
});

