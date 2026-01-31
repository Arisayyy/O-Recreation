"use client";

import React, { useState } from "react";
import { DraftIcon } from "@/app/components/icons/draft-icon";
import { PaperclipIcon } from "@/app/components/icons/paperclip-icon";
import { TrashIcon } from "@/app/components/icons/trash-icon";
import { Keycap } from "@/app/components/issue-detail/keycap";

function openButtonClass() {
  return [
    "group/button relative inline-flex h-8 flex-none cursor-pointer items-center",
    "rounded-orchid-pill px-2 whitespace-nowrap outline-none transition-transform select-none",
    "focus-visible:ring-2 focus-visible:ring-orchid-ink",
  ].join(" ");
}

function openButtonBgClass() {
  return [
    "absolute inset-0 rounded-orchid-pill border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs",
    "transition-transform group-hover/button:to-surface-weak",
    "group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle",
  ].join(" ");
}

function hoverActionButtonClass() {
  return [
    "group/button focus-visible:ring-neutral-strong",
    "relative inline-flex shrink-0 cursor-pointer",
    "rounded-lg whitespace-nowrap outline-none transition-transform select-none",
    "focus-visible:ring-2",
    "h-7 px-1.5",
  ].join(" ");
}

function hoverActionButtonBgClass() {
  return [
    "absolute rounded-lg border transition-transform",
    "border-transparent bg-surface-strong opacity-0",
    "inset-2 blur-sm",
    "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0",
    "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
  ].join(" ");
}

function sendButtonBgClass() {
  // Match the hover/active treatment of the draft section "Open" pill.
  return [
    "absolute inset-0 rounded-lg border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs",
    "transition-transform",
    "group-hover/button:to-surface-weak",
    "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
    "group-active/button:to-surface-subtle",
  ].join(" ");
}

export function IssueReplyComposer({
  open,
  issueId,
}: {
  open: boolean;
  issueId: string;
}) {
  if (!open) return null;

  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  return (
    <div
      className={[
        "relative bg-surface-subtle p-0.5 ease-out-expo w-full overflow-hidden outline-none",
        "rounded-[14px] transition-none hover:ring-3 hover:ring-bg-surface-strong",
        "focus-within:ring-3 focus-within:ring-bg-surface-strong",
      ].join(" ")}
      data-issue-id={issueId}
    >
      {/* Draft preview + actions (sits "behind" the editor card) */}
      <div className="relative z-0 pointer-events-none rounded-xl">
        <div className="flex cursor-pointer items-center justify-between gap-2 p-2 pb-5">
          <div className="pointer-events-auto">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded="false"
              className={[hoverActionButtonClass(), "shrink-0"].join(" ")}
            >
              <div aria-hidden="true" className={hoverActionButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="size-4 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="px-0.5 leading-none transition-transform">
                  Reply
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="size-4 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer pointer-events-auto">
            <div className="flex min-w-0 items-center space-x-1">
              <div className="bg-surface-strong hover:bg-surface flex items-center rounded-full p-1 whitespace-nowrap transition-[translate,opacity,background] translate-y-0 opacity-100">
                <div className="bg-surface border-neutral text-orchid-ink flex items-center justify-center overflow-hidden border font-semibold rounded-full size-4 min-w-4 min-h-4 text-[10px] leading-[15px] w-5">
                  <span className="text-orchid-ink grid place-items-center size-4 min-w-4 min-h-4 text-[10px] leading-[15px] w-5">
                    [
                  </span>
                </div>
                <div>
                  <p className="px-1 text-sm leading-[21px] text-orchid-ink">
                    [SANDBOX] Polar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor card */}
      <div className="relative z-10 -mt-3 pointer-events-auto">
        <div className="bg-surface border-neutral flex min-h-0 w-full flex-1 flex-col rounded-xl border shadow-md">
          <div className="relative flex min-h-0 w-full flex-1 flex-col">
            {/* Toolbar (visual-only) */}
            <div className="flex items-center gap-1 p-3">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded="false"
                className={[hoverActionButtonClass(), "shrink-0"].join(" ")}
              >
                <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                  <div className="px-0.5 leading-none transition-transform">
                    <span className="flex w-24 items-center gap-1 truncate">
                      <span className="text-sm">Normal</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        aria-hidden="true"
                        data-slot="icon"
                        className="size-3"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>

              <div
                data-orientation="vertical"
                role="separator"
                aria-orientation="vertical"
                className="border-neutral h-[18px] w-px border-r"
              />

              {[
                {
                  key: "bold",
                  path: "M3 3a1 1 0 0 1 1-1h5a3.5 3.5 0 0 1 2.843 5.541A3.75 3.75 0 0 1 9.25 14H4a1 1 0 0 1-1-1V3Zm2.5 3.5v-2H9a1 1 0 0 1 0 2H5.5Zm0 2.5v2.5h3.75a1.25 1.25 0 1 0 0-2.5H5.5Z",
                },
                {
                  key: "italic",
                  path: "M6.25 2.75A.75.75 0 0 1 7 2h6a.75.75 0 0 1 0 1.5h-2.483l-3.429 9H9A.75.75 0 0 1 9 14H3a.75.75 0 0 1 0-1.5h2.483l3.429-9H7a.75.75 0 0 1-.75-.75Z",
                },
                {
                  key: "underline",
                  path: "M4.75 2a.75.75 0 0 1 .75.75V7a2.5 2.5 0 0 0 5 0V2.75a.75.75 0 0 1 1.5 0V7a4 4 0 0 1-8 0V2.75A.75.75 0 0 1 4.75 2ZM2 13.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z",
                },
                {
                  key: "strike",
                  path: "M9.165 3.654c-.95-.255-1.921-.273-2.693-.042-.769.231-1.087.624-1.173.947-.087.323-.008.822.543 1.407.389.412.927.77 1.55 1.034H13a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 3 7h1.756l-.006-.006c-.787-.835-1.161-1.849-.9-2.823.26-.975 1.092-1.666 2.191-1.995 1.097-.33 2.36-.28 3.512.029.75.2 1.478.518 2.11.939a.75.75 0 0 1-.833 1.248 5.682 5.682 0 0 0-1.665-.738Zm2.074 6.365a.75.75 0 0 1 .91.543 2.44 2.44 0 0 1-.35 2.024c-.405.585-1.052 1.003-1.84 1.24-1.098.329-2.36.279-3.512-.03-1.152-.308-2.27-.897-3.056-1.73a.75.75 0 0 1 1.092-1.029c.552.586 1.403 1.056 2.352 1.31.95.255 1.92.273 2.692.042.55-.165.873-.417 1.038-.656a.942.942 0 0 0 .13-.803.75.75 0 0 1 .544-.91Z",
                },
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  className={[
                    "group/button focus-visible:ring-neutral-strong",
                    "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                    "size-7 min-w-7 min-h-7",
                  ].join(" ")}
                >
                  <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                  <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                      className="size-4 transition-transform"
                    >
                      <path fillRule="evenodd" d={b.path} clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              ))}

              <div
                data-orientation="vertical"
                role="separator"
                aria-orientation="vertical"
                className="border-neutral h-[18px] w-px border-r"
              />

              {[
                {
                  key: "list",
                  path: "M3 4.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM6.25 3a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 7.25a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 11.5a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM4 12.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM3 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
                },
                {
                  key: "ordered",
                  path: "M2.995 1a.625.625 0 1 0 0 1.25h.38v2.125a.625.625 0 1 0 1.25 0v-2.75A.625.625 0 0 0 4 1H2.995ZM3.208 7.385a2.37 2.37 0 0 1 1.027-.124L2.573 8.923a.625.625 0 0 0 .439 1.067l1.987.011a.625.625 0 0 0 .006-1.25l-.49-.003.777-.776c.215-.215.335-.506.335-.809 0-.465-.297-.957-.842-1.078a3.636 3.636 0 0 0-1.993.121.625.625 0 1 0 .416 1.179ZM2.625 11a.625.625 0 1 0 0 1.25H4.25a.125.125 0 0 1 0 .25H3.5a.625.625 0 1 0 0 1.25h.75a.125.125 0 0 1 0 .25H2.625a.625.625 0 1 0 0 1.25H4.25a1.375 1.375 0 0 0 1.153-2.125A1.375 1.375 0 0 0 4.25 11H2.625ZM7.25 2a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM7.25 7.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM6.5 13.25a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Z",
                },
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  className={[
                    "group/button focus-visible:ring-neutral-strong",
                    "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                    "size-7 min-w-7 min-h-7",
                  ].join(" ")}
                >
                  <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                  <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                      className="size-4 transition-transform"
                    >
                      <path d={b.path} />
                    </svg>
                  </div>
                </button>
              ))}

              <div
                data-orientation="vertical"
                role="separator"
                aria-orientation="vertical"
                className="border-neutral h-[18px] w-px border-r"
              />

              {[
                {
                  key: "image",
                  path: "M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm10.5 5.707a.5.5 0 0 0-.146-.353l-1-1a.5.5 0 0 0-.708 0L9.354 9.646a.5.5 0 0 1-.708 0L6.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0-.146.353V12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.707ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
                  fillRule: true,
                },
                {
                  key: "link",
                  paths: [
                    {
                      d: "M8.914 6.025a.75.75 0 0 1 1.06 0 3.5 3.5 0 0 1 0 4.95l-2 2a3.5 3.5 0 0 1-5.396-4.402.75.75 0 0 1 1.251.827 2 2 0 0 0 3.085 2.514l2-2a2 2 0 0 0 0-2.828.75.75 0 0 1 0-1.06Z",
                      fillRule: true,
                    },
                    {
                      d: "M7.086 9.975a.75.75 0 0 1-1.06 0 3.5 3.5 0 0 1 0-4.95l2-2a3.5 3.5 0 0 1 5.396 4.402.75.75 0 0 1-1.251-.827 2 2 0 0 0-3.085-2.514l-2 2a2 2 0 0 0 0 2.828.75.75 0 0 1 0 1.06Z",
                      fillRule: true,
                    },
                  ],
                },
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  className={[
                    "group/button focus-visible:ring-neutral-strong",
                    "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                    "size-7 min-w-7 min-h-7",
                  ].join(" ")}
                >
                  <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                  <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                      className="size-4 transition-transform"
                    >
                      {b.key === "link"
                        ? b.paths!.map((p) => (
                            <path
                              key={p.d}
                              fillRule={p.fillRule ? "evenodd" : undefined}
                              clipRule={p.fillRule ? "evenodd" : undefined}
                              d={p.d}
                            />
                          ))
                        : (
                            <path
                              fillRule={b.fillRule ? "evenodd" : undefined}
                              clipRule={b.fillRule ? "evenodd" : undefined}
                              d={b.path}
                            />
                          )}
                    </svg>
                  </div>
                </button>
              ))}

              <div
                data-orientation="vertical"
                role="separator"
                aria-orientation="vertical"
                className="border-neutral h-[18px] w-px border-r"
              />

              {[
                {
                  key: "undo",
                  path: "M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z",
                },
                {
                  key: "redo",
                  path: "M3.5 9.75A2.75 2.75 0 0 1 6.25 7h5.19L9.22 9.22a.75.75 0 1 0 1.06 1.06l3.5-3.5a.75.75 0 0 0 0-1.06l-3.5-3.5a.75.75 0 1 0-1.06 1.06l2.22 2.22H6.25a4.25 4.25 0 0 0 0 8.5h1a.75.75 0 0 0 0-1.5h-1A2.75 2.75 0 0 1 3.5 9.75Z",
                },
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  disabled
                  className={[
                    "group/button focus-visible:ring-neutral-strong",
                    "relative inline-flex shrink-0 rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                    "pointer-events-none cursor-not-allowed opacity-50",
                    "size-7 min-w-7 min-h-7",
                  ].join(" ")}
                >
                  <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                      className="size-4 transition-transform"
                    >
                      <path fillRule="evenodd" d={b.path} clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <input accept="image/*" type="file" className="hidden" />

            <div className="relative">
              <div
                className={[
                  "z-10 block flex-1 border-0 p-2 relative",
                  "px-[18px] pt-0 pb-5",
                  "h-fit min-h-40 w-full overflow-auto",
                  "bg-transparent outline-none focus:outline-none",
                  "text-sm leading-[21px] text-orchid-ink",
                ].join(" ")}
                contentEditable
                role="textbox"
                spellCheck
                aria-placeholder="Start writing your message..."
                style={{ userSelect: "text", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                onInput={(e) => {
                  const next = (e.currentTarget.textContent ?? "").trim();
                  setIsEditorEmpty(next.length === 0);
                }}
              />
              {isEditorEmpty ? (
                <div
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute left-[18px] top-0",
                    "overflow-hidden text-ellipsis select-none whitespace-nowrap",
                    "text-sm leading-[21px] text-orchid-placeholder",
                  ].join(" ")}
                >
                  Start writing your message...
                </div>
              ) : null}
            </div>
          </div>

          <div className="ease-out-expo grid overflow-hidden transition-transform duration-300 grid-rows-[0fr] p-0" />
        </div>
      </div>

      {/* Draft preview + actions (below editor card) */}
      <div className="relative z-0 rounded-xl">
        <div className="flex w-full shrink-0 items-center justify-between gap-2 p-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Attach files (not implemented)"
              className={hoverActionButtonClass()}
            >
              <div aria-hidden="true" className={hoverActionButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                <PaperclipIcon />
                <div className="px-0.5 leading-none transition-transform">
                  Attach files
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Discard (not implemented)"
              className={hoverActionButtonClass()}
            >
              <div aria-hidden="true" className={hoverActionButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                <div className="px-0.5 leading-none transition-transform">
                  Discard
                </div>
                <TrashIcon />
              </div>
            </button>

            <button
              type="button"
              aria-label="Send (not implemented)"
              className={[
                "group/button focus-visible:ring-neutral-strong",
                "relative inline-flex shrink-0 cursor-pointer",
                "rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                "h-7 px-1.5",
              ].join(" ")}
            >
              <div aria-hidden="true" className={sendButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                <div className="px-0.5 leading-none transition-transform">
                  Send
                </div>
                <Keycap>Ctrl+↵</Keycap>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

