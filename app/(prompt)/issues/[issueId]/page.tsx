export default async function IssuePage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId } = await params;

  // Issue page (placeholder)
  return (
    <div className="font-orchid-ui text-orchid-ink">
      <div className="text-sm leading-[21px] text-orchid-muted">Issue</div>
      <div className="text-lg leading-7">{issueId}</div>
    </div>
  );
}

