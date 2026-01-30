import { IssueDetailClient } from "@/app/components/issue-detail/issue-detail-client";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId } = await params;

  return (
    <IssueDetailClient issueId={issueId} />
  );
}

