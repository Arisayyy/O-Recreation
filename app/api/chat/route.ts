import { convertToModelMessages, jsonSchema, streamText, tool, UIMessage } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "moonshotai/kimi-k2.5",
    system:
      "You are Orchid, a helpful assistant. When the user asks to create/file a bug issue, you MUST call the createBugIssueArtifact tool to produce a structured draft the user can review and edit before submitting. Keep the title concise and actionable. Put the main description in `body`. Put reproduction steps, expected vs actual behavior, and debug logs/links in their respective fields when available. Before creating the draft, say a confirmation message",
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
    },
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

