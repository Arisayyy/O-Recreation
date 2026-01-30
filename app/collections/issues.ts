import { collection } from "@trestleinc/replicate/client";
import { ConvexClient } from "convex/browser";
import type { Infer } from "convex/values";
import { issuesSchema } from "@/convex/schema";
import { api } from "@/convex/_generated/api";
import { sqlite } from "@/app/lib/replicate/sqlite";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
}

// Singleton client: collections are module-level to avoid duplicate sync loops.
const convexClient = new ConvexClient(CONVEX_URL);

type IssueDoc = Infer<(typeof issuesSchema)["shape"]>;

export const issues = collection.create<IssueDoc>({
  schema: issuesSchema,
  persistence: sqlite,
  config: () => ({
    convexClient,
    api: api.issues,
    getKey: (issue) => issue.id,
    user: () => getAnonymousIdentity(),
  }),
});

export type Issue = NonNullable<typeof issues.$docType>;

