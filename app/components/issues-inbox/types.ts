export type IssuesInboxItemModel = {
  id: string;
  kind: "issue";
  avatarInitial: string;
  fromLabel: string;
  summary: string;
  draftTitle: string;
  draftBody: string;
  ctaLabel: string;
};

