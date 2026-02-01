"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { issues } from "@/app/collections/issues";
import { issueMessages } from "@/app/collections/issueMessages";
import { useReplicateInitState } from "@/app/components/replicate-context";

function IssuesPrefetchReady() {
  const issuesCollection = issues.get();
  const issueMessagesCollection = issueMessages.get();

  // Subscribe to both collections to start the initial replication + cache fill
  // before the user ever visits `/issues`.
  useLiveQuery(issuesCollection);
  useLiveQuery(issueMessagesCollection);

  const router = useRouter();
  useEffect(() => {
    router.prefetch("/issues");
  }, [router]);

  return null;
}

export function IssuesPrefetch() {
  const { ready } = useReplicateInitState();
  if (!ready) return null;
  return <IssuesPrefetchReady />;
}

