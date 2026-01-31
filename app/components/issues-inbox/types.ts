export type IssuesInboxItemModel = {
  id: string;
  kind: "issue";
  avatarInitial: string;
  avatarId?: string;
  avatarName?: string;
  fromLabel: string;
  summary: string;
  draftTitle: string;
  draftBody: string;
  ctaLabel: string;
};

