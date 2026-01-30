import type { IssueDetailModel } from "./types";

const ISSUE_DETAILS: Record<string, IssueDetailModel> = {
  m1: {
    id: "m1",
    title: "ACTION REQUIRED: update your payment method",
    fromInitial: "R",
    fromName: "Rishi at Polar",
    timeLabel: "22h ago",
    attachments: [
      {
        id: "a1",
        name: "greptile_compound_2026-01-25.pdf",
        sizeLabel: "53.5 KB",
      },
    ],
    thread: [
      {
        id: "t1",
        fromInitial: "A",
        fromName: "AR Team",
        timeLabel: "22h ago",
        body:
          "Hi — we’re having trouble processing your payment method. Please update your billing details to avoid disruption.",
        attachments: [
          {
            id: "a1",
            name: "greptile_compound_2026-01-25.pdf",
            sizeLabel: "53.5 KB",
          },
        ],
      },
    ],
    replyToLabel: "AR Team",
    replySubject: "Re: ACTION REQUIRED: update your payment method",
  },
  m2: {
    id: "m2",
    title: "The `/issues` page intermittently renders blank after navigation",
    fromInitial: "A",
    fromName: "API Gateway",
    timeLabel: "2d ago",
    attachments: [],
    thread: [
      {
        id: "t1",
        fromInitial: "A",
        fromName: "API Gateway",
        timeLabel: "2d ago",
        body:
          "We saw intermittent blank renders after navigation. It appears related to layout measurement timing and stale rect references.",
        attachments: [],
      },
    ],
    replyToLabel: "API Gateway",
    replySubject:
      "Re: The `/issues` page intermittently renders blank after navigation",
  },
};

export function getIssueDetail(issueId: string): IssueDetailModel {
  const d = ISSUE_DETAILS[issueId];
  if (d) return d;

  return {
    id: issueId,
    title: `Issue ${issueId}`,
    fromInitial: "A",
    fromName: "AR Team",
    timeLabel: "Just now",
    attachments: [],
    thread: [
      {
        id: "t1",
        fromInitial: "A",
        fromName: "AR Team",
        timeLabel: "Just now",
        body:
          "This is a placeholder issue detail. Hook this up to real issue data when available.",
        attachments: [],
      },
    ],
    replyToLabel: "AR Team",
    replySubject: `Re: Issue ${issueId}`,
  };
}

