import { convertToModelMessages, streamText, UIMessage } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "moonshotai/kimi-k2.5",
    system:
      "You are Orchid, a helpful assistant. You are assisting within an existing issue detail page. The conversation may include a hidden system message containing the issue and its persisted replies as context. Use that information to answer the user's questions or propose next steps. Do not call or reference any artifact/drafting tools.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

