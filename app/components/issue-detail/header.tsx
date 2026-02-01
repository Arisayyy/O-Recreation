import React from "react";
import { ChevronUpIcon } from "../icons/chevron-up-icon";
import { ChevronDownIcon } from "../icons/chevron-down-icon";
import { CheckIcon } from "../icons/check-icon";
import { ReplyIcon } from "../icons/reply-icon";
import { GitHubIcon } from "../icons/github-icon";
import { AltNavbar } from "@/app/components/alt-navbar";
import {
  SemiGhostButton,
  semiGhostButtonBaseClass,
  semiGhostButtonBgClass,
  semiGhostButtonInnerClass,
} from "./semi-ghost-button";
import { MenuDropdown, type MenuDropdownItem } from "@/app/components/menu-dropdown";
import { IssueStatusIcon, formatIssueStatusLabel, type IssueStatusKey } from "@/app/components/icons/issue-status-icon";

export function IssueDetailHeader({
  title,
  onReply,
  onPrevIssue,
  onNextIssue,
  prevIssueDisabled,
  nextIssueDisabled,
  githubIssueUrl,
  githubSyncStatus,
  status,
  onStatusChangeAction,
}: {
  title: string;
  onReply?: () => void;
  onPrevIssue?: () => void;
  onNextIssue?: () => void;
  prevIssueDisabled?: boolean;
  nextIssueDisabled?: boolean;
  githubIssueUrl?: string | null;
  githubSyncStatus?: "pending" | "creating" | "synced" | "error" | null;
  githubSyncError?: string | null;
  status: IssueStatusKey;
  onStatusChangeAction: (next: IssueStatusKey) => void;
}) {
  const STATUS_ITEMS: ReadonlyArray<MenuDropdownItem<IssueStatusKey>> = [
    { value: "backlog", label: "Backlog" },
    { value: "todo", label: "Todo" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "canceled", label: "Cancelled" },
  ];

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
              keycap="G"
              data-issue-detail-github-button="true"
              onClick={() => {
                window.open(githubIssueUrl, "_blank", "noreferrer");
              }}
            />
          ) : githubSyncStatus === "pending" || githubSyncStatus === "creating" ? (
            <SemiGhostButton
              icon={<GitHubIcon className="h-4 w-4" />}
              label="Syncing"
              keycap="G"
              data-issue-detail-github-button="true"
              disabled
            />
          ) : githubSyncStatus === "error" ? (
            <SemiGhostButton
              icon={<GitHubIcon className="h-4 w-4" />}
              label="GitHub"
              keycap="G"
              data-issue-detail-github-button="true"
              disabled
            />
          ) : null}

          <MenuDropdown
            value={status}
            items={STATUS_ITEMS}
            onChangeAction={onStatusChangeAction}
            align="end"
            numericKeycaps
            numericHotkeys
            triggerClassName="outline-none"
            trigger={
              <div
                data-issue-detail-status-trigger="true"
                className={[semiGhostButtonBaseClass, "px-1.5"].join(" ")}
              >
                <div className={semiGhostButtonBgClass} />
                <div className={semiGhostButtonInnerClass + " pointer-events-none"}>
                  <span className="block h-4 w-4 transition-transform">
                    <IssueStatusIcon status={status} className="h-[14px] w-[14px]" />
                  </span>
                  <div className="px-[2px] leading-[0px] transition-transform">
                    {formatIssueStatusLabel(status)}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-4 text-orchid-muted"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span
                    className={[
                      "bg-surface-weak border-neutral text-orchid-placeholder shadow-xs",
                      "inline-flex h-4 items-center rounded border px-1",
                      "text-[12px] leading-[17.6px]",
                    ].join(" ")}
                  >
                    S
                  </span>
                </div>
              </div>
            }
          />

          <SemiGhostButton
            icon={<ChevronUpIcon className="h-4 w-4" />}
            keycap="K"
            className="w-[50.0625px]"
            onClick={onPrevIssue}
            disabled={prevIssueDisabled}
          />
          <SemiGhostButton
            icon={<ChevronDownIcon className="h-4 w-4" />}
            keycap="J"
            className="w-[48.8594px]"
            onClick={onNextIssue}
            disabled={nextIssueDisabled}
          />
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

