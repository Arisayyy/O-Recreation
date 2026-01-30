import React from "react";
import type { IssueThreadMessageModel } from "./types";

function FileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4 text-orchid-muted"
    >
      <path
        fillRule="evenodd"
        d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm1 5.75A.75.75 0 0 1 5.75 7h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 7.75Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function IssueThreadMessage({ message }: { message: IssueThreadMessageModel }) {
  const attachments = message.attachments ?? [];
  const attachmentCount = attachments.length;

  return (
    <div className="bg-surface-subtle p-0.5 ease-out-expo w-full overflow-hidden rounded-[14px]">
      <div className="rounded-orchid-prompt-inner bg-white shadow-none">
        <div className="flex items-start justify-between gap-3 p-3">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded="false"
            className="group/button inline-flex cursor-pointer items-center gap-2 rounded-orchid-pill px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-orchid-ink"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-orchid-border bg-white text-[10px] font-semibold leading-[15px] text-orchid-ink">
              {message.fromInitial}
            </span>
            <span className="text-sm leading-[21px] text-orchid-ink">
              {message.fromName}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm leading-[21px] text-orchid-muted">
              {message.timeLabel}
            </span>

            <button
              type="button"
              className="group/button relative inline-flex h-8 flex-none cursor-pointer items-center rounded-orchid-pill px-2 outline-none transition-transform select-none focus-visible:ring-2 focus-visible:ring-orchid-ink"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-orchid-pill border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs transition-transform group-hover/button:to-surface-weak group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle"
              />
              <span className="relative z-10 inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-4 w-4 text-orchid-muted group-hover/button:text-orchid-ink"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>

            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded="false"
              className="group/button relative inline-flex h-8 flex-none cursor-pointer items-center rounded-orchid-pill px-2 outline-none transition-transform select-none focus-visible:ring-2 focus-visible:ring-orchid-ink"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-orchid-pill border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs transition-transform group-hover/button:to-surface-weak group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle"
              />
              <span className="relative z-10 inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-4 w-4 text-orchid-muted group-hover/button:text-orchid-ink"
                >
                  <path d="M2 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM12.5 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="rounded-xl border border-neutral bg-white px-3 py-2 text-sm leading-[21px] text-orchid-ink">
            {message.body}
          </div>

          {attachmentCount > 0 ? (
            <div className="mt-3">
              <button
                type="button"
                className="group/button relative inline-flex h-8 items-center rounded-orchid-pill px-2 outline-none transition-transform select-none focus-visible:ring-2 focus-visible:ring-orchid-ink"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-orchid-pill border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs transition-transform group-hover/button:to-surface-weak group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle"
                />
                <span className="relative z-10 inline-flex items-center gap-2 text-sm leading-[21px] text-orchid-ink">
                  <span className="px-[2px]">
                    {attachmentCount} Attachment{attachmentCount === 1 ? "" : "s"}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 text-orchid-muted"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>

              <div className="mt-2 space-y-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral bg-surface-weak px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileIcon />
                      <div className="min-w-0">
                        <div className="truncate text-sm leading-[21px] text-orchid-ink">
                          {a.name}
                        </div>
                        <div className="text-sm leading-[21px] text-orchid-muted">
                          {a.sizeLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

