import { ReplyButton } from "./reply-button";
import { DraftIcon } from "@/app/components/icons/draft-icon";
import type { IssuesInboxItemModel } from "./types";
import Link from "next/link";

export function IssuesInboxListItem({ item }: { item: IssuesInboxItemModel }) {
  const href = `/issues/${encodeURIComponent(item.id)}`;

  return (
    <div
      className={[
        "relative bg-surface-subtle p-0.5 ease-out-expo w-full overflow-hidden cursor-pointer outline-none",
        "rounded-[14px] transition-none hover:ring-3 hover:ring-bg-surface-strong",
        "focus-within:ring-3 focus-within:ring-bg-surface-strong",
      ].join(" ")}
    >
      {/* Card link */}
      <Link
        href={href}
        aria-label={`Open issue ${item.id}`}
        className="absolute inset-0 z-10 rounded-[14px] outline-none"
      />

      {/* Header */}
      <div className="relative z-0 pointer-events-none rounded-orchid-prompt-inner bg-white shadow-none">
        <div className="flex flex-row gap-1 p-2">
          <div className="flex h-[25px] w-4 min-w-4 items-center justify-center">
            <div className="size-1 rounded-full bg-orchid-surface-2 transition-transform" />
          </div>

          <div className="flex flex-1 items-start gap-2 min-w-0">
            <div className="flex-1 min-w-0 space-x-2">
              <div className="border-neutral inline-flex -translate-y-px items-center gap-1 rounded-lg border bg-white px-1 py-px shadow-xs">
                <div className="bg-white border-neutral text-orchid-ink flex items-center justify-center overflow-hidden border font-semibold rounded size-4 min-w-4 min-h-4 text-[10px] leading-[15px]">
                  <span className="grid place-items-center size-4 min-w-4 min-h-4 text-[10px] leading-[15px]">
                    {item.avatarInitial}
                  </span>
                </div>
                <span className="flex shrink flex-row items-center gap-1 px-0.5 text-sm leading-[21px] text-orchid-muted">
                  <span>{item.fromLabel}</span>
                </span>
              </div>

              <span className="text-sm leading-[25px] text-orchid-muted">
                {item.summary}
              </span>
            </div>

            <div className="flex h-[25px] items-center">
              <div className="flex h-[25px] items-center" />
            </div>
          </div>
        </div>
      </div>

      {/* Draft preview + actions */}
      <div className="relative z-0 pointer-events-none rounded-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 select-none px-1.5">
              <DraftIcon />

              <div className="flex min-w-0 flex-1 flex-row items-center gap-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="text-sm leading-[21px] text-orchid-ink">
                    {item.draftTitle}
                  </span>
                  <span
                    className={[
                      "min-w-0 text-sm leading-[21px] text-orchid-muted",
                      "truncate",
                    ].join(" ")}
                    title={item.draftBody}
                  >
                    {item.draftBody}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 pointer-events-auto relative z-20">
              <ReplyButton label={item.ctaLabel} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

