import React from "react";
import { ChevronUpIcon } from "../icons/chevron-up-icon";
import { ChevronDownIcon } from "../icons/chevron-down-icon";
import { CheckIcon } from "../icons/check-icon";
import { ReplyIcon } from "../icons/reply-icon";
import { GitHubIcon } from "../icons/github-icon";
import { AltNavbar } from "@/app/components/alt-navbar";
import {
  SemiGhostButton,
} from "./semi-ghost-button";

export function IssueDetailHeader({
  title,
  onReply,
  githubIssueUrl,
  githubSyncStatus,
}: {
  title: string;
  onReply?: () => void;
  githubIssueUrl?: string | null;
  githubSyncStatus?: "pending" | "creating" | "synced" | "error" | null;
  githubSyncError?: string | null;
}) {
  return (
    <AltNavbar
      closeHref="/issues"
      title={<p className="m-0 truncate">{title}</p>}
      rightActions={
        <div className="flex gap-1">
          {githubIssueUrl ? (
            <SemiGhostButton
              icon={<GitHubIcon className="h-4 w-4" />}
              label="Open in GitHub"
              onClick={() => {
                window.open(githubIssueUrl, "_blank", "noreferrer");
              }}
            />
          ) : githubSyncStatus === "pending" || githubSyncStatus === "creating" ? (
            <SemiGhostButton
              icon={<GitHubIcon className="h-4 w-4" />}
              label="Syncing"
              disabled
            />
          ) : githubSyncStatus === "error" ? (
            <SemiGhostButton
              icon={<GitHubIcon className="h-4 w-4" />}
              label="GitHub"
              disabled
            />
          ) : null}
          <SemiGhostButton icon={<ChevronUpIcon className="h-4 w-4" />} keycap="K" className="w-[50.0625px]" />
          <SemiGhostButton icon={<ChevronDownIcon className="h-4 w-4" />} keycap="J" className="w-[48.8594px]" />
          <SemiGhostButton icon={<CheckIcon className="h-4 w-4" />} label="Done" keycap="E" className="w-[92.1562px]" />
          <SemiGhostButton
            icon={<ReplyIcon className="h-4 w-4" />}
            label="Reply"
            keycap="R"
            className="w-[94.7344px]"
            onClick={onReply}
          />
        </div>
      }
      layout="sticky"
    />
  );
}

