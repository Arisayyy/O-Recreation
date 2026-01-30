import { collection } from "@trestleinc/replicate/client";
import { ConvexClient } from "convex/browser";
import type { Infer } from "convex/values";
import { issueMessagesSchema } from "@/convex/schema";
import { api } from "@/convex/_generated/api";
import { sqlite } from "@/app/lib/replicate/sqlite";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
}

// Singleton client: collections are module-level to avoid duplicate sync loops.
const convexClient = new ConvexClient(CONVEX_URL);

type IssueMessageDoc = Infer<(typeof issueMessagesSchema)["shape"]>;

export const issueMessages = collection.create<IssueMessageDoc>({
  schema: issueMessagesSchema,
  persistence: sqlite,
  config: () => ({
    convexClient,
    api: api.issueMessages,
    getKey: (m) => m.id,
    user: () => getAnonymousIdentity(),
  }),
});

export type IssueMessage = NonNullable<typeof issueMessages.$docType>;

