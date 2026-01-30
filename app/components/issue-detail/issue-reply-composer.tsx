"use client";

import React, { useMemo, useRef, useState } from "react";
import { issueMessages } from "@/app/collections/issueMessages";
import { issues, type Issue } from "@/app/collections/issues";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";

function pillButtonClass(disabled?: boolean) {
  return [
    "group/button relative inline-flex h-8 flex-none items-center rounded-orchid-pill px-2",
    "whitespace-nowrap outline-none transition-transform select-none",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "cursor-pointer focus-visible:ring-2 focus-visible:ring-orchid-ink",
  ].join(" ");
}

function pillButtonBgClass(disabled?: boolean) {
  return [
    "absolute inset-0 rounded-orchid-pill border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs",
    "transition-transform",
    disabled ? "" : "group-hover/button:to-surface-weak",
    disabled ? "" : "group-active/button:inset-shadow-xs group-active/button:shadow-none",
    disabled ? "" : "group-active/button:to-surface-subtle",
  ].join(" ");
}

function RecipientChip({
  initial,
  label,
}: {
  initial: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-orchid-pill bg-orchid-surface-2 px-1 py-1">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-orchid-border bg-white text-[10px] font-semibold leading-[15px] text-orchid-ink">
        {initial}
      </span>
      <span className="text-sm leading-[21px] text-orchid-ink">{label}</span>
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded-orchid-pill outline-none focus-visible:ring-2 focus-visible:ring-orchid-ink"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
        </svg>
      </button>
    </span>
  );
}

export function IssueReplyComposer({
  issueId,
  replyToLabel,
  replyToInitial,
  defaultSubject,
}: {
  issueId: string;
  replyToLabel: string;
  replyToInitial: string;
  defaultSubject: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const isEmpty = useMemo(() => body.trim().length === 0, [body]);

  return (
    <div className="bg-surface-subtle p-0.5 ease-out-expo w-full overflow-hidden rounded-[14px]">
      <div className="rounded-orchid-prompt-inner bg-white shadow-none">
        {/* Collapsed row */}
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded="false"
              className={pillButtonClass(false)}
              onClick={() => setExpanded(true)}
            >
              <span aria-hidden="true" className={pillButtonBgClass(false)} />
              <span className="relative z-10 inline-flex items-center gap-2 text-sm leading-[21px] text-orchid-ink">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="px-[2px]">Reply</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
                  <path
                    fillRule="evenodd"
                    d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>
          </div>

          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral bg-white px-3 py-2 text-sm leading-[21px] text-orchid-placeholder outline-none focus-visible:ring-2 focus-visible:ring-orchid-ink"
            onClick={() => {
              setExpanded(true);
              window.setTimeout(() => bodyRef.current?.focus(), 0);
            }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-orchid-border bg-white text-[10px] font-semibold leading-[15px] text-orchid-ink">
              {replyToInitial}
            </span>
            <span className="truncate text-orchid-ink">{replyToLabel}</span>
            <span className="truncate text-orchid-placeholder">Start writing your message...</span>
          </button>
        </div>

        {/* Expanded composer */}
        <div
          className={[
            "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          ].join(" ")}
        >
          <div className="min-h-0">
            <form
              className="border-t border-neutral p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (isEmpty) return;

                const now = Date.now();
                const author = getAnonymousIdentity();

                const messages = issueMessages.get();
                messages.insert({
                  id: globalThis.crypto?.randomUUID?.() ?? `${now}`,
                  issueId,
                  type: "reply",
                  body: body.trim(),
                  createdAt: now,
                  author: {
                    name: author.name ?? "Anonymous",
                    color: author.color ?? "#6366f1",
                  },
                });

                const issueCollection = issues.get();
                issueCollection.update(issueId, (draft: Issue) => {
                  draft.updatedAt = now;
                });

                setBody("");
                if (bodyRef.current) bodyRef.current.textContent = "";
                setExpanded(false);
              }}
            >
              {/* To row */}
              <div className="flex items-center gap-2 border border-neutral rounded-xl bg-white px-2 py-1">
                <label className="shrink-0 px-1 text-sm leading-[21px] text-orchid-muted">
                  To:
                </label>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <RecipientChip initial={replyToInitial} label={replyToLabel} />
                  <input
                    type="email"
                    className="min-w-[120px] flex-1 bg-transparent px-1 py-2 text-sm leading-[21px] text-orchid-ink outline-none"
                    placeholder=""
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className={pillButtonClass(false)}>
                    <span aria-hidden="true" className={pillButtonBgClass(false)} />
                    <span className="relative z-10 inline-flex items-center text-sm leading-[21px] text-orchid-ink">
                      <span className="px-[2px]">Cc</span>
                    </span>
                  </button>
                  <button type="button" className={pillButtonClass(false)}>
                    <span aria-hidden="true" className={pillButtonBgClass(false)} />
                    <span className="relative z-10 inline-flex items-center text-sm leading-[21px] text-orchid-ink">
                      <span className="px-[2px]">Bcc</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Subject row */}
              <div className="mt-2 flex items-center gap-2 border border-neutral rounded-xl bg-white px-2 py-1">
                <label className="shrink-0 px-1 text-sm leading-[21px] text-orchid-muted">
                  Subject:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm leading-[21px] text-orchid-ink outline-none"
                />
              </div>

              {/* Toolbar */}
              <div className="mt-2 flex items-center gap-2">
                <button type="button" aria-haspopup="menu" aria-expanded="false" className={pillButtonClass(false)}>
                  <span aria-hidden="true" className={pillButtonBgClass(false)} />
                  <span className="relative z-10 inline-flex items-center gap-2 text-sm leading-[21px] text-orchid-ink">
                    <span className="px-[2px]">Normal</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>

                <div role="separator" aria-orientation="vertical" className="h-8 w-px bg-neutral" />

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
                  <button key={b.key} type="button" className={pillButtonClass(false)}>
                    <span aria-hidden="true" className={pillButtonBgClass(false)} />
                    <span className="relative z-10 inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
                        <path fillRule="evenodd" d={b.path} clipRule="evenodd" />
                      </svg>
                    </span>
                  </button>
                ))}

                <div role="separator" aria-orientation="vertical" className="h-8 w-px bg-neutral" />

                {[
                  {
                    key: "list",
                    path: "M3 4.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM6.25 3a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 7.25a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 11.5a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM4 12.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM3 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
                  },
                  {
                    key: "ordered",
                    path: "M2.995 1a.625.625 0 1 0 0 1.25h.38v2.125a.625.625 0 1 0 1.25 0v-2.75A.625.625 0 0 0 4 1H2.995ZM3.208 7.385a2.37 2.37 0 0 1 1.027-.124L2.573 8.923a.625.625 0 0 0 .439 1.067l1.987.011a.625.625 0 0 0 .006-1.25l-.49-.003.777-.776c.215-.215.335-.506.335-.809 0-.465-.297-.957-.842-1.078a3.636 3.636 0 0 0-1.993.121.625.625 0 1 0 .416 1.179ZM2.625 11a.625.625 0 1 0 0 1.25H4.25a.125.125 0 0 1 0 .25H3.5a.625.625 0 1 0 0 1.25h.75a.125.125 0 0 1 0 .25H2.625a.625.625 0 1 0 0 1.25H4.25a1.375 1.375 0 0 0 1.153-2.125A1.375 1.375 0 0 0 4.25 11H2.625ZM7.25 2a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM7.25 7.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM6.5 13.25a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Z",
                  },
                  {
                    key: "image",
                    path: "M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm10.5 5.707a.5.5 0 0 0-.146-.353l-1-1a.5.5 0 0 0-.708 0L9.354 9.646a.5.5 0 0 1-.708 0L6.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0-.146.353V12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.707ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
                  },
                  {
                    key: "link",
                    path: "M8.914 6.025a.75.75 0 0 1 1.06 0 3.5 3.5 0 0 1 0 4.95l-2 2a3.5 3.5 0 0 1-5.396-4.402.75.75 0 0 1 1.251.827 2 2 0 0 0 3.085 2.514l2-2a2 2 0 0 0 0-2.828.75.75 0 0 1 0-1.06Z M7.086 9.975a.75.75 0 0 1-1.06 0 3.5 3.5 0 0 1 0-4.95l2-2a3.5 3.5 0 0 1 5.396 4.402.75.75 0 0 1-1.251-.827 2 2 0 0 0-3.085-2.514l-2 2a2 2 0 0 0 0 2.828.75.75 0 0 1 0 1.06Z",
                  },
                ].map((b) => (
                  <button key={b.key} type="button" className={pillButtonClass(false)}>
                    <span aria-hidden="true" className={pillButtonBgClass(false)} />
                    <span className="relative z-10 inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
                        <path fillRule={b.key === "link" ? undefined : "evenodd"} d={b.path} clipRule={b.key === "link" ? undefined : "evenodd"} />
                      </svg>
                    </span>
                  </button>
                ))}

                <div role="separator" aria-orientation="vertical" className="h-8 w-px bg-neutral" />

                <button type="button" disabled className={pillButtonClass(true)}>
                  <span aria-hidden="true" className={pillButtonBgClass(true)} />
                  <span className="relative z-10 inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
                      <path
                        fillRule="evenodd"
                        d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
                <button type="button" disabled className={pillButtonClass(true)}>
                  <span aria-hidden="true" className={pillButtonBgClass(true)} />
                  <span className="relative z-10 inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
                      <path
                        fillRule="evenodd"
                        d="M3.5 9.75A2.75 2.75 0 0 1 6.25 7h5.19L9.22 9.22a.75.75 0 1 0 1.06 1.06l3.5-3.5a.75.75 0 0 0 0-1.06l-3.5-3.5a.75.75 0 1 0-1.06 1.06l2.22 2.22H6.25a4.25 4.25 0 0 0 0 8.5h1a.75.75 0 0 0 0-1.5h-1A2.75 2.75 0 0 1 3.5 9.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Body */}
              <div className="mt-2">
                <div className="relative rounded-xl border border-neutral bg-white px-3 py-2">
                  <div
                    ref={bodyRef}
                    contentEditable
                    role="textbox"
                    spellCheck
                    aria-label="Start writing your message..."
                    className="min-h-[120px] whitespace-pre-wrap break-words text-sm leading-[21px] text-orchid-ink outline-none"
                    onInput={(e) => {
                      const next = (e.currentTarget.textContent ?? "").toString();
                      setBody(next);
                    }}
                  />
                  {isEmpty ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-2 text-sm leading-[21px] text-orchid-placeholder"
                    >
                      Start writing your message...
                    </div>
                  ) : null}
                </div>
              </div>

              <input ref={fileInputRef} accept="image/*" type="file" className="hidden" />
              <input multiple type="file" className="hidden" />

              {/* Bottom actions */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className={pillButtonClass(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span aria-hidden="true" className={pillButtonBgClass(false)} />
                  <span className="relative z-10 inline-flex items-center gap-2 text-sm leading-[21px] text-orchid-ink">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M11.914 4.086a2 2 0 0 0-2.828 0l-5 5a2 2 0 1 0 2.828 2.828l.556-.555a.75.75 0 0 1 1.06 1.06l-.555.556a3.5 3.5 0 0 1-4.95-4.95l5-5a3.5 3.5 0 0 1 4.95 4.95l-1.972 1.972a2.125 2.125 0 0 1-3.006-3.005L9.97 4.97a.75.75 0 1 1 1.06 1.06L9.058 8.003a.625.625 0 0 0 .884.883l1.972-1.972a2 2 0 0 0 0-2.828Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="px-[2px]">Attach files</span>
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={pillButtonClass(false)}
                    onClick={() => {
                      setBody("");
                      setSubject(defaultSubject);
                      setExpanded(false);
                      if (bodyRef.current) bodyRef.current.textContent = "";
                    }}
                  >
                    <span aria-hidden="true" className={pillButtonBgClass(false)} />
                    <span className="relative z-10 inline-flex items-center gap-2 text-sm leading-[21px] text-orchid-ink">
                      <span className="px-[2px]">Discard</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-orchid-muted">
                        <path
                          fillRule="evenodd"
                          d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>

                  <button type="submit" className={pillButtonClass(false)} disabled={isEmpty}>
                    <span aria-hidden="true" className={pillButtonBgClass(isEmpty)} />
                    <span className="relative z-10 inline-flex items-center gap-2 text-sm leading-[21px] text-orchid-ink">
                      <span className="px-[2px]">Send</span>
                      <span className="text-sm leading-[21px] text-orchid-muted">
                        Ctrl+↵
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

