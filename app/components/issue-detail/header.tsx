import React from "react";
import Link from "next/link";
import { XIcon } from "../icons/x-icon";
import { ChevronUpIcon } from "../icons/chevron-up-icon";
import { ChevronDownIcon } from "../icons/chevron-down-icon";
import { CheckIcon } from "../icons/check-icon";
import { ReplyIcon } from "../icons/reply-icon";
import { AvatarMenu } from "@/app/components/avatar-menu";
import {
  SemiGhostButton,
  semiGhostButtonBaseClass,
  semiGhostButtonBgClass,
  semiGhostButtonInnerClass,
} from "./semi-ghost-button";

const keycapClass = "bg-surface-weak border-neutral text-orchid-placeholder shadow-xs";

const navRowClass = "flex items-center gap-5";
const navTitleClass =
  "min-w-0 flex-1 truncate text-sm leading-[21px] text-copy";

export function IssueDetailHeader({
  title,
  onReply,
}: {
  title: string;
  onReply?: () => void;
}) {
  return (
    <nav className="relative z-10 px-6 py-5 font-orchid-ui leading-6">
      <div className={navRowClass}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link
            href="/issues"
            className={[
              semiGhostButtonBaseClass,
              "w-[73.6875px] px-[6px]",
            ].join(" ")}
          >
            <div className={semiGhostButtonBgClass} />
            <div className={semiGhostButtonInnerClass + " pointer-events-none"}>
            <XIcon className="h-4 w-4" />
            <span className="px-[2px]">
              <span className="sr-only">Go back</span>
            </span>
            <span
              className={[
                keycapClass,
                "inline-flex h-4 items-center rounded border px-1",
                "text-[12px] leading-[17.6px]",
              ].join(" ")}
            >
              ESC
            </span>
            </div>
          </Link>

          <p className={navTitleClass}>
            {title}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <SemiGhostButton
                icon={<ChevronUpIcon className="h-4 w-4" />}
                keycap="K"
                className="w-[50.0625px]"
              />
              <SemiGhostButton
                icon={<ChevronDownIcon className="h-4 w-4" />}
                keycap="J"
                className="w-[48.8594px]"
              />
              <SemiGhostButton
                icon={<CheckIcon className="h-4 w-4" />}
                label="Done"
                keycap="E"
                className="w-[92.1562px]"
              />
              <SemiGhostButton
                icon={<ReplyIcon className="h-4 w-4" />}
                label="Reply"
                keycap="R"
                className="w-[94.7344px]"
                onClick={onReply}
              />
            </div>
          </div>

          <div className="flex">
            <AvatarMenu avatarInitial="A" align="end" />
          </div>
        </div>
      </div>
    </nav>
  );
}

