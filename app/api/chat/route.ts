import { convertToModelMessages, jsonSchema, stepCountIs, streamText, tool, UIMessage } from "ai";
import { webSearch } from "@exalabs/ai-sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const maxDuration = 60;

type RequestedTools = {
  exa?: boolean;
};

const EXA_MENTION_REPLACE_RE = /(^|\s)@exa\b/gi;
const MAX_ISSUES_LIMIT = 100;
const MAX_BODY_CHARS = 2000;

function stripExaMentionsForModel(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    if (m.role !== "user") return m;
    if (!m.parts?.length) return m;
    return {
      ...m,
      parts: m.parts.map((part) => {
        if (part.type !== "text") return part;
        const withoutMention = part.text.replace(EXA_MENTION_REPLACE_RE, "$1");
        const normalized = withoutMention
          .replace(/[ \t]{2,}/g, " ")
          .replace(/\s+\n/g, "\n");
        return { ...part, text: normalized };
      }),
    };
  });
}

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: `${text.slice(0, maxChars)}…`, truncated: true };
}

function exaNotConfiguredTool() {
  return tool({
    description:
      "Search the web with Exa. If this returns an error, tell the user to set EXA_API_KEY in their environment.",
    inputSchema: jsonSchema<{ query: string }>({
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    }),
    execute: async ({ query }) => {
      return {
        error:
          "Exa web search is not configured on the server. Set EXA_API_KEY in your environment, then try again.",
        query,
      };
    },
  });
}

export async function POST(req: Request) {
  const {
    messages,
    requestedTools,
  }: { messages: UIMessage[]; requestedTools?: RequestedTools } = await req.json();

  const wantsExa = !!requestedTools?.exa;
  const modelMessages = stripExaMentionsForModel(messages);

  const result = streamText({
    model: "openai/gpt-5.1-instant",
    providerOptions: {
      gateway: {
        only: ["openai"],
      },
    },
    system:
      [
        "You are Orchid, a helpful assistant.",
        "When the user asks to create/file a bug issue, you MUST call the createBugIssueArtifact tool to produce a structured draft the user can review and edit before submitting.",
        "Keep the title concise and actionable. Put the main description in `body`. Put reproduction steps, expected vs actual behavior, and debug logs/links in their respective fields when available.",
        "Before creating the draft, say a confirmation message.",
        "You have access to a listIssues tool that returns a bounded list of issues (active/done/all). Use it when you need context about existing issues (status, duplicates, priorities), but do not call it unless it is actually relevant.",
        "When presenting multiple issues together, use a markdown table with helpful columns (e.g. ID, Title, Status, Updated, Link). When presenting issues one-by-one, use headings (## for each issue, ### for sections).",
        wantsExa
          ? "The user enabled web search. Use the webSearch tool when you need up-to-date information, and include sources/links when possible."
          : "Web search is disabled unless the user enables it.",
        "After using any tool, you MUST write a normal assistant message that uses the tool output. Do not end the response with only a tool call.",
      ].join(" "),
    // Important: `streamText` defaults to stopWhen: stepCountIs(1), which can end
    // immediately after a tool call + tool result. Use a tool-safe default for all tools.
    stopWhen: stepCountIs(3),
    tools: {
      createBugIssueArtifact: tool({
        description:
          "Create a draft bug issue artifact (editable by the user) to be saved to the app as an Issue.",
        inputSchema: jsonSchema<{
          title: string;
          body: string;
          stepsToReproduce?: string;
          debugReport?: string;
          expectedBehavior?: string;
          actualBehavior?: string;
          severity?: "low" | "medium" | "high" | "critical";
        }>({
          type: "object",
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            stepsToReproduce: { type: "string" },
            debugReport: { type: "string" },
            expectedBehavior: { type: "string" },
            actualBehavior: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
          },
          required: ["title", "body"],
        }),
        execute: async (draft) => draft,
      }),
      listIssues: tool({
        description:
          "List issues so you can reference current work items. Use this to check what's active vs done and avoid duplicates. Keep calls minimal and request a small limit.",
        inputSchema: jsonSchema<{
          statusFilter?: "active" | "done" | "all";
          limit?: number;
          includeBody?: boolean;
        }>({
          type: "object",
          properties: {
            statusFilter: { type: "string", enum: ["active", "done", "all"] },
            limit: { type: "number" },
            includeBody: { type: "boolean" },
          },
        }),
        execute: async ({ statusFilter = "active", limit = 20, includeBody = false }) => {
          const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
          if (!convexUrl) {
            return {
              error: "NEXT_PUBLIC_CONVEX_URL is not configured on the server.",
            };
          }

          const normalizedLimit = Math.max(1, Math.min(MAX_ISSUES_LIMIT, Math.floor(limit)));
          const queryLimit = Math.min(MAX_ISSUES_LIMIT, Math.max(normalizedLimit, normalizedLimit * 3));

          // ConvexHttpClient is stateful; create a fresh instance per call.
          const convex = new ConvexHttpClient(convexUrl, { logger: false });
          const recent = await convex.query(api.issues.listRecent, { limit: queryLimit });

          const filtered = recent.filter((issue) => {
            const isDone = issue.status === "done";
            if (statusFilter === "done") return isDone;
            if (statusFilter === "active") return !isDone;
            return true;
          });

          const sliced = filtered.slice(0, normalizedLimit);
          const issues = sliced.map((issue) => {
            const title = truncateText(issue.title ?? "", 200);
            const body = includeBody ? truncateText(issue.body ?? "", MAX_BODY_CHARS) : null;
            return {
              id: issue.id,
              title: title.text,
              status: issue.status,
              severity: issue.severity,
              updatedAt: issue.updatedAt,
              createdAt: issue.createdAt,
              githubIssueUrl: issue.githubIssueUrl,
              githubIssueNumber: issue.githubIssueNumber,
              githubRepo: issue.githubRepo,
              githubSyncStatus: issue.githubSyncStatus,
              ...(includeBody
                ? {
                    bodyPreview: body?.text ?? "",
                    bodyTruncated: body?.truncated ?? false,
                  }
                : {}),
              titleTruncated: title.truncated,
            };
          });

          return {
            statusFilter,
            returned: issues.length,
            totalMatched: filtered.length,
            issues,
          };
        },
      }),
      ...(wantsExa
        ? {
            webSearch: process.env.EXA_API_KEY ? webSearch() : exaNotConfiguredTool(),
          }
        : {}),
    },
    messages: await convertToModelMessages(modelMessages),
  });

  return result.toUIMessageStreamResponse();
}

