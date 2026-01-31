import { convertToModelMessages, streamText, UIMessage } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "moonshotai/kimi-k2.5",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

