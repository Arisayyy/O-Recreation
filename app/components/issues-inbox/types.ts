export type IssuesInboxItemModel = {
  id: string;
  kind: "issue";
  status: string;
  avatarInitial: string;
  avatarId?: string;
  avatarName?: string;
  fromLabel: string;
  summary: string;
  draftTitle: string;
  draftBody: string;
  ctaLabel: string;
};

