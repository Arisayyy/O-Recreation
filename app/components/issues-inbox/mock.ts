import type { IssuesInboxItemModel } from "./types";

export const MOCK_ITEMS: IssuesInboxItemModel[] = [
  {
    id: "m1",
    kind: "issue",
    avatarInitial: "R",
    avatarId: "me, Rishi at Polar",
    avatarName: "Rishi at Polar",
    fromLabel: "me, Rishi at Polar",
    summary:
      "Rishi from Polar has enabled seat-based pricing access for your account after you updated your email to arisay@rift.mx.",
    draftTitle: "Draft",
    draftBody: "Thanks so much",
    ctaLabel: "Review Reply",
  },
  {
    id: "m2",
    kind: "issue",
    avatarInitial: "A",
    avatarId: "me, API Gateway",
    avatarName: "API Gateway",
    fromLabel: "me, API Gateway",
    summary:
      "The `/issues` page intermittently renders blank after navigation. This seems tied to layout measurement timing and a stale rect reference.",
    draftTitle: "Draft",
    draftBody: "I can reproduce this about.",
    ctaLabel: "Review Reply",
  },
];

