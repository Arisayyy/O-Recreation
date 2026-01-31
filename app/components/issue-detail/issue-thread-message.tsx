import React from "react";
import type { IssueThreadMessageModel } from "./types";

function SquareHoverButton({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={[
        "group/button focus-visible:ring-neutral-strong",
        "relative inline-flex shrink-0 cursor-pointer",
        "rounded-lg whitespace-nowrap outline-none transition-transform select-none",
        "focus-visible:ring-2",
        "size-7 min-w-7 min-h-7",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className={[
          "absolute rounded-lg border transition-transform",
          "border-transparent bg-surface-strong opacity-0",
          "inset-2 blur-sm",
          "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0",
          "group-active/button:inset-shadow-xs group-active/button:shadow-none",
        ].join(" ")}
      />
      <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
        {children}
      </div>
    </button>
  );
}

function FileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4 min-w-4 shrink-0 text-orchid-muted"
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
    <div className="bg-surface-subtle group flex w-full flex-col gap-0.5 overflow-hidden rounded-xl p-0.5">
      <div className="bg-surface flex flex-col gap-1 rounded-[10px] shadow-md">
        {/* Header */}
        <div className="relative z-0 flex items-center justify-between gap-2 p-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              tabIndex={0}
              aria-expanded="false"
              aria-haspopup="dialog"
              className="outline-none"
            >
              <div className="text-orchid-ink group/zhover relative z-0 flex items-center outline-none">
                <div
                  aria-hidden="true"
                  className={[
                    // Match the “Add files” hover glow (light surface, blur -> crisp)
                    "absolute rounded-lg border border-transparent bg-orchid-surface-2 transition-transform",
                    "inset-2 opacity-0 blur-sm",
                    "group-hover/zhover:opacity-100 group-hover/zhover:blur-none group-hover/zhover:inset-0",
                    "group-active/zhover:inset-shadow-xs group-active/zhover:shadow-none",
                  ].join(" ")}
                />
                <div className="relative z-[2] flex w-full items-center gap-1 px-1 py-1">
                  <div className="bg-surface border-neutral text-orchid-ink flex items-center justify-center overflow-hidden rounded-full border font-semibold size-6 min-w-6 min-h-6 text-[10px] leading-[15px]">
                    <span className="grid place-items-center size-6 min-w-6 min-h-6 text-[10px] leading-[15px]">
                      {message.fromInitial}
                    </span>
                  </div>
                  <span className="px-1 text-sm leading-[21px] text-orchid-ink">
                    {message.fromName}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="relative flex items-center gap-3">
            {/* Time label (slides out on hover) */}
            <div className="ease-out-expo absolute right-0 top-1 flex items-center gap-2 px-2 transition-transform duration-200 group-hover:-translate-x-1 group-hover:opacity-0">
              <span className="whitespace-nowrap text-[12px] leading-[17.6px] text-orchid-muted">
                {message.timeLabel}
              </span>
            </div>

            {/* Action buttons (slide in on hover) */}
            <div className="ease-out-expo flex translate-x-1 items-center gap-1 opacity-0 transition-transform duration-200 group-hover:translate-x-0 group-hover:opacity-100">
              <SquareHoverButton ariaLabel="Reply">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  className="size-4 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </SquareHoverButton>
              <SquareHoverButton ariaLabel="More">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  className="size-4 transition-transform"
                >
                  <path d="M2 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM12.5 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                </svg>
              </SquareHoverButton>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-3">
          <div
            role="presentation"
            dir="ltr"
            className="relative w-full flex-1"
            style={{
              position: "relative",
              ["--scroll-area-corner-height" as never]: "0px",
              ["--scroll-area-corner-width" as never]: "0px",
            }}
          >
            <div
              role="presentation"
              data-id="base-ui-issue-body-viewport"
              className="size-full base-ui-disable-scrollbar"
              style={{ overflow: "scroll" }}
            >
              <div role="presentation" style={{ minWidth: "fit-content" }}>
                <div className="prose w-full max-w-none rounded-md m-0 p-0 text-orchid-ink">
                  {message.body}
                </div>
              </div>
            </div>
          </div>
        </div>

        {attachmentCount === 0 ? <div className="p-2" /> : null}

        {/* Attachments */}
        {attachmentCount > 0 ? (
          <div className="p-2">
            <div className="px-1 py-1">
              <div className="flex items-center justify-between gap-2">
                <button
                  tabIndex={0}
                  type="button"
                  className={[
                    "group/button focus-visible:ring-neutral-strong",
                    "relative inline-flex shrink-0 cursor-pointer",
                    "rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                    "h-7 px-1.5",
                  ].join(" ")}
                >
                  <div
                    aria-hidden="true"
                    className={[
                      "absolute rounded-lg border transition-transform",
                      "border-transparent bg-surface-strong opacity-0",
                      "inset-2 blur-sm",
                      "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0",
                      "group-active/button:inset-shadow-xs group-active/button:shadow-none",
                    ].join(" ")}
                  />
                  <div className="relative z-10 flex items-center gap-1 text-orchid-muted group-hover/button:text-orchid-ink">
                    <div className="px-0.5 leading-none">
                      {attachmentCount} Attachment{attachmentCount === 1 ? "" : "s"}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                      className="size-4 transition-transform"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>

                <div className="ease-out-expo flex items-center gap-1 transition-transform duration-300">
                  {attachments.slice(0, 1).map((a) => (
                    <div
                      key={a.id}
                      className="bg-surface-subtle hover:bg-surface-strong transition-colors group relative inline-flex h-7 max-w-[250px] items-center gap-1.5 rounded-md px-2 duration-150 select-none cursor-pointer"
                    >
                      <FileIcon />
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="min-w-0 truncate text-[12px] leading-[17.6px] text-orchid-ink">
                          {a.name}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-[12px] leading-[17.6px] text-orchid-muted">
                          {a.sizeLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keep the expanded list collapsed for now (matches ref DOM) */}
              <div className="ease-out-expo grid overflow-hidden transition-transform duration-300 grid-rows-[0fr]">
                <div className="min-h-0">
                  <div className="flex flex-wrap gap-2 pt-2">
                    {attachments.map((a) => (
                      <div
                        key={a.id}
                        className="bg-surface-subtle hover:bg-surface-strong transition-colors group relative inline-flex h-7 max-w-[250px] items-center gap-1.5 rounded-md px-2 duration-150 select-none cursor-pointer"
                      >
                        <FileIcon />
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                          <span className="min-w-0 truncate text-[12px] leading-[17.6px] text-orchid-ink">
                            {a.name}
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-[12px] leading-[17.6px] text-orchid-muted">
                            {a.sizeLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

