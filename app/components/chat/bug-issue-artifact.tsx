"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";
import { uploadToUploadsRoute } from "@/app/lib/uploads";
import { issues as issuesCollection } from "@/app/collections/issues";
import { TrashIcon } from "@/app/components/icons/trash-icon";
import { PaperclipIcon } from "@/app/components/icons/paperclip-icon";
import { MenuDropdown, type MenuDropdownItem } from "@/app/components/menu-dropdown";
import { api } from "@/convex/_generated/api";
import { CheckCircleIcon } from "@/app/components/icons/check-circle-icon";
import { useReplicateInitState } from "@/app/components/replicate-context";

export type BugIssueArtifactDraft = {
  title: string;
  severity?: "low" | "medium" | "high" | "critical";
  body: string;
  stepsToReproduce?: string;
  debugReport?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
};

type Attachment = {
  filename: string;
  url: string;
  contentType: string | null;
  size: number;
};

type Severity = NonNullable<BugIssueArtifactDraft["severity"]>;

const MAX_ATTACHMENTS = 10;

const SEVERITY_ITEMS: ReadonlyArray<MenuDropdownItem<Severity>> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function severitySwatchClass(severity: Severity) {
  switch (severity) {
    case "low":
      return "bg-emerald-500";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-orange-500";
    case "critical":
      return "bg-red-500";
  }
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
  return [
    "absolute inset-0 rounded-lg border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs",
    "transition-transform",
    "group-hover/button:to-surface-weak",
    "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
    "group-active/button:to-surface-subtle",
  ].join(" ");
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  const digits = i === 0 ? 0 : value >= 10 ? 1 : 1;
  return `${value.toFixed(digits)} ${units[i]}`;
}

function stripSection(markdown: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    String.raw`(^|\n)## ${escaped}\n[\s\S]*?(?=\n## |\n?$)`,
    "g",
  );
  return markdown.replace(re, "\n").trim();
}

function appendSection(out: string, heading: string, content: string) {
  const c = content.trim();
  if (!c) return out.trim();
  const base = out.trim();
  return [base, `## ${heading}`, "", c].filter(Boolean).join("\n\n").trim();
}

export function BugIssueArtifact({ initialDraft }: { initialDraft: BugIssueArtifactDraft }) {
  const { ready, error, retry } = useReplicateInitState();

  if (!ready) {
    return (
      <div className="not-prose text-copy w-full font-orchid-ui text-sm leading-6 text-orchid-muted">
        Initializing offline storage…
      </div>
    );
  }

  if (error) {
    return (
      <div className="not-prose text-copy w-full font-orchid-ui text-sm leading-6 text-orchid-ink">
        <div className="font-medium">Failed to initialize offline storage</div>
        <div className="mt-1 text-orchid-muted">{error.message}</div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="pointer-events-auto inline-flex h-8 items-center rounded-orchid-pill border border-neutral bg-white px-3 text-sm font-medium text-orchid-ink shadow-xs"
            onClick={retry}
          >
            Retry
          </button>
          <button
            type="button"
            className="pointer-events-auto inline-flex h-8 items-center rounded-orchid-pill border border-neutral bg-white px-3 text-sm font-medium text-orchid-ink shadow-xs"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return <BugIssueArtifactReady initialDraft={initialDraft} />;
}

function BugIssueArtifactReady({ initialDraft }: { initialDraft: BugIssueArtifactDraft }) {
  const router = useRouter();
  const enqueueIssueSync = useMutation(api.githubIssues.enqueueIssueSync);
  const issues = issuesCollection.get();

  const initialTitle = initialDraft.title ?? "";
  const initialBody = initialDraft.body?.trim() ?? "";
  const initialStepsToReproduce = (initialDraft.stepsToReproduce ?? "").trim();
  const initialDebugReport = (initialDraft.debugReport ?? "").trim();
  const initialExpectedBehavior = (initialDraft.expectedBehavior ?? "").trim();
  const initialActualBehavior = (initialDraft.actualBehavior ?? "").trim();
  const initialSeverity: Severity = initialDraft.severity ?? "medium";

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [stepsToReproduce, setStepsToReproduce] = useState(initialStepsToReproduce);
  const [debugReport, setDebugReport] = useState(initialDebugReport);
  const [expectedBehavior, setExpectedBehavior] = useState(initialExpectedBehavior);
  const [actualBehavior, setActualBehavior] = useState(initialActualBehavior);
  const [severity, setSeverity] = useState<Severity>(initialSeverity);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [areAttachmentsExpanded, setAreAttachmentsExpanded] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const [fileInputEl, setFileInputEl] = useState<HTMLInputElement | null>(null);

  const bodyForSubmit = useMemo(() => {
    let out = stripSection(body.trim(), "Attachments");
    out = appendSection(out, "Steps to reproduce", stepsToReproduce);
    out = appendSection(out, "Debug report", debugReport);
    out = appendSection(out, "Expected behavior", expectedBehavior);
    out = appendSection(out, "Actual behavior", actualBehavior);
    out = appendSection(out, "Severity", severity);
    if (attachments.length > 0) {
      const lines = attachments.map((a) => {
        const isImage = (a.contentType ?? "").startsWith("image/");
        return isImage ? `- ![${a.filename}](${a.url})` : `- [${a.filename}](${a.url})`;
      });
      out = appendSection(out, "Attachments", lines.join("\n"));
    }
    return out;
  }, [
    actualBehavior,
    attachments,
    body,
    debugReport,
    expectedBehavior,
    severity,
    stepsToReproduce,
  ]);

  const canCreate = useMemo(() => {
    if (createdIssueId != null) return false;
    if (isSaving) return false;
    return title.trim().length > 0 && bodyForSubmit.trim().length > 0;
  }, [bodyForSubmit, createdIssueId, isSaving, title]);

  const removeAttachment = useCallback((url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }, []);

  if (isDismissed) {
    return (
      <div className="not-prose text-copy w-full">
        <div className="py-1">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
              className="size-3 text-orchid-muted"
            >
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
            <span className="text-copy text-orchid-muted text-sm leading-[21px]">
              Issue draft discarded.
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (createdIssueId) {
    return (
      <div className="not-prose text-copy w-full">
        <div className="py-1">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-left outline-none hover:bg-surface-strong focus-visible:ring-2 focus-visible:ring-neutral-strong"
            onClick={() => router.push(`/issues/${createdIssueId}`)}
          >
            <CheckCircleIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-copy text-orchid-muted text-sm leading-[21px]">
              Issue created. Click to open it.
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "bg-surface-subtle flex w-full flex-col overflow-hidden rounded-xl p-0.5",
        "ease-out-expo outline-none transition-none",
        "transform-gpu will-change-transform",
        "motion-reduce:transform-none motion-reduce:transition-none",
        "transition-[opacity,transform] duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
      ].join(" ")}
    >
      {/* Header fields (To / Subject) — match reference DOM closely (no Cc/Bcc). */}
      <div className="shrink-0">
        <div className="min-h-0">
          <div className="flex items-stretch gap-2 border-b border-neutral border-neutral-subtle p-1">
            <div className="flex w-full items-center justify-between">
              <label className="flex select-none items-center gap-2">
                <div className="rounded-lg px-2">
                  <span className="text-copy text-orchid-muted text-neutral-subtle">To:</span>
                </div>
              </label>

              <div className="flex flex-1 items-stretch">
                <div className="relative w-full">
                  <div className="flex min-h-9 flex-wrap items-center gap-1">
                    <div className="bg-surface-strong hover:bg-surface flex cursor-pointer items-center gap-1 rounded-full p-1 transition-colors">
                      <div className="bg-surface border-neutral text-orchid-ink text-neutral flex size-4 min-h-4 min-w-4 items-center justify-center overflow-hidden rounded-full border font-semibold text-[10px] leading-[15px] text-copy-xs">
                        <span className="text-orchid-ink text-neutral grid size-4 min-h-4 min-w-4 place-items-center text-[10px] leading-[15px] text-copy-xs">
                          A
                        </span>
                      </div>
                      <div>
                        <p className="text-[12px] leading-[17.6px] text-copy-sm">Orchid Team</p>
                      </div>
                      <button
                        tabIndex={-1}
                        type="button"
                        aria-label="Remove recipient"
                        className={[
                          "group/button focus-visible:ring-neutral-strong",
                          "relative inline-flex shrink-0 cursor-pointer",
                          "rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                          "size-5 min-w-5 min-h-5",
                        ].join(" ")}
                        onClick={() => {}}
                      >
                        <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                        <div className="text-copy relative z-10 flex w-full items-center justify-center gap-1 text-orchid-muted group-hover/button:text-orchid-ink">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            aria-hidden="true"
                            data-slot="icon"
                            className="size-4 transition-transform"
                          >
                            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                          </svg>
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pl-1">
                      <div className="rounded-lg px-2">
                        <span className="text-copy text-orchid-muted text-neutral-subtle">
                          Severity:
                        </span>
                      </div>

                      <MenuDropdown
                        value={severity}
                        items={SEVERITY_ITEMS}
                        onChangeAction={setSeverity}
                        align="end"
                        triggerClassName="outline-none"
                        trigger={
                          <div className="bg-surface-strong hover:bg-surface inline-flex cursor-pointer items-center gap-1 rounded-full p-1 transition-colors">
                            <div
                              className={[
                                "border-neutral flex size-4 min-h-4 min-w-4 items-center justify-center overflow-hidden rounded-full border",
                                severitySwatchClass(severity),
                              ].join(" ")}
                              aria-hidden
                            />
                            <div>
                              <p className="text-[12px] leading-[17.6px] text-copy-sm">
                                {severity[0]?.toUpperCase()}
                                {severity.slice(1)}
                              </p>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              aria-hidden="true"
                              data-slot="icon"
                              className="size-4 text-orchid-muted"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        }
                      />
                    </div>

                    <div className="relative min-w-20 flex-1">
                      <input
                        autoComplete="new-password"
                        className="h-6 w-full flex-1 bg-transparent text-sm font-normal leading-normal focus:outline-none"
                        type="email"
                        value=""
                        readOnly
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="none"
                        role="combobox"
                        aria-expanded="false"
                        aria-controls="bug-issue-artifact-to-listbox"
                        aria-haspopup="listbox"
                        aria-autocomplete="list"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-stretch gap-2 p-1">
            <div className="flex w-full items-center justify-between">
              <label className="flex select-none items-center gap-2">
                <div className="rounded-lg px-2">
                  <span className="text-copy text-orchid-muted text-neutral-subtle">
                    Subject:
                  </span>
                </div>
              </label>
              <div className="flex flex-1 items-stretch">
                <input
                  className="text-copy text-orchid-ink text-neutral h-8 flex-1 px-0 outline-none"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short, actionable title"
                />
              </div>
            </div>
          </div>

          <div className="px-3 pt-1">
            <div className="flex select-none items-center ">
              <div className="rounded-lg">
                <span className="text-copy text-orchid-muted">Bug issue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor card */}
      <div className="relative mt-2">
        <div className="bg-surface border-neutral flex min-h-0 w-full flex-1 flex-col rounded-xl border shadow-md">
          <div className="flex items-center justify-between gap-2 p-2">
            <div className="min-w-0">
              <div className="text-[12px] font-medium leading-[17.6px] text-orchid-muted" />
            </div>

            {createdIssueId ? null : null}
          </div>

          <div className="relative">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing your issue..."
              spellCheck
              className={[
                "z-10 block flex-1 border-0 p-2 relative",
                "px-[18px] pt-0 pb-5",
                "h-fit min-h-40 w-full overflow-auto hide-scrollbar",
                "bg-transparent outline-none focus:outline-none",
                "text-sm leading-[21px] text-orchid-ink",
                "whitespace-pre-wrap break-words",
                "resize-none",
              ].join(" ")}
              aria-label="Issue body"
            />
          </div>
        </div>
      </div>

      <div className="relative z-0 rounded-xl">
        <div className="flex flex-col gap-1">
          {/* Steps-to-reproduce draft strip (styled like the bottom action area) */}
          <div className="flex gap-2 pt-5">
            <div className="flex flex-1 items-stretch gap-2 rounded-xl bg-surface-subtle">
              <div className="flex w-full flex-col gap-2">
                <label className="flex select-none items-center gap-2 px-3">
                  <div className="">
                    <span className="text-copy text-orchid-muted">Steps to reproduce:</span>
                  </div>
                </label>

                <textarea
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1) ...\n2) ..."
                  rows={6}
                  className={[
                    "w-full rounded-lg border border-neutral bg-surface px-3 py-2 shadow-md hide-scrollbar",
                    "text-sm leading-[21px] text-orchid-ink",
                    "outline-none",
                    "transition-colors duration-150 ease-in-out",
                    "resize-none",
                  ].join(" ")}
                />
              </div>
            </div>

            <div className="flex flex-1 items-stretch gap-2 rounded-xl bg-surface-subtle">
              <div className="flex w-full flex-col gap-2">
                <label className="flex select-none items-center gap-2 px-3">
                  <div className="rounded-lg">
                    <span className="text-copy text-orchid-muted">Debug report:</span>
                  </div>
                </label>

                <textarea
                  value={debugReport}
                  onChange={(e) => setDebugReport(e.target.value)}
                  placeholder="Logs, console output, screenshot/recording links, environment details…"
                  rows={6}
                  className={[
                    "w-full rounded-lg border border-neutral bg-surface px-3 py-2 shadow-md hide-scrollbar",
                    "text-sm leading-[21px] text-orchid-ink",
                    "outline-none",
                    "transition-colors duration-150 ease-in-out",
                    "resize-none",
                  ].join(" ")}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-5">
            <div className="flex flex-1 items-stretch gap-2 rounded-xl bg-surface-subtle">
              <div className="flex w-full flex-col gap-2">
                <label className="flex select-none items-center gap-2 px-3">
                  <div className="">
                    <span className="text-copy text-orchid-muted">Expected behavior:</span>
                  </div>
                </label>

                <textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What should happen?"
                  rows={6}
                  className={[
                    "w-full rounded-lg border border-neutral bg-surface px-3 py-2 shadow-md hide-scrollbar",
                    "text-sm leading-[21px] text-orchid-ink",
                    "outline-none",
                    "transition-colors duration-150 ease-in-out",
                    "resize-none",
                  ].join(" ")}
                />
              </div>
            </div>

            <div className="flex flex-1 items-stretch gap-2 rounded-xl bg-surface-subtle">
              <div className="flex w-full flex-col gap-2">
                <label className="flex select-none items-center gap-2 px-3">
                  <div className="rounded-lg">
                    <span className="text-copy text-orchid-muted">Actual behavior:</span>
                  </div>
                </label>

                <textarea
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually happens?"
                  rows={6}
                  className={[
                    "w-full rounded-lg border border-neutral bg-surface px-3 py-2 shadow-md hide-scrollbar",
                    "text-sm leading-[21px] text-orchid-ink",
                    "outline-none",
                    "transition-colors duration-150 ease-in-out",
                    "resize-none",
                  ].join(" ")}
                />
              </div>
            </div>
          </div>

          <div className="relative z-0 rounded-xl">
            <div className="flex w-full shrink-0 flex-col gap-2 p-1">
              {attachments.length > 0 ? (
                  <div className="ease-out-expo grid overflow-hidden transition-transform duration-300 grid-rows-[1fr] py-1">
                    <div className="px-1 py-1">
                      <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className={hoverActionButtonClass()}
                        aria-label={
                          areAttachmentsExpanded
                            ? "Collapse attachments"
                            : "Expand attachments"
                        }
                        onClick={() => setAreAttachmentsExpanded((v) => !v)}
                      >
                        <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                        <div className="text-copy relative z-10 flex items-center gap-1 text-neutral-subtle group-hover/button:text-neutral">
                          <div className="text-copy px-0.5 leading-0 transition-transform">
                            {attachments.length}{" "}
                            {attachments.length === 1 ? "Attachment" : "Attachments"}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            aria-hidden="true"
                            className={[
                              "size-4 transition-transform",
                              areAttachmentsExpanded ? "rotate-90" : "",
                            ].join(" ")}
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
                        {!areAttachmentsExpanded ? (
                          <div className="ease-out-expo flex items-center gap-1 transition-transform duration-300">
                            {attachments.slice(0, 1).map((a) => (
                              <div
                                key={a.url}
                                className="bg-surface hover:bg-surface-strong transition-colors group/item relative inline-flex h-7 max-w-[250px] items-center gap-1.5 rounded-md px-2 duration-150 select-none cursor-pointer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 16 16"
                                  fill="currentColor"
                                  aria-hidden="true"
                                  className="text-orchid-muted h-3 w-3 min-w-3 shrink-0"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm10.5 5.707a.5.5 0 0 0-.146-.353l-1-1a.5.5 0 0 0-.708 0L9.354 9.646a.5.5 0 0 1-.708 0L6.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0-.146.353V12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.707ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                                    clipRule="evenodd"
                                  />
                                </svg>

                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex min-w-0 flex-1 items-center gap-1.5"
                                >
                                  <span className="text-[12px] font-medium leading-[17.6px] text-orchid-ink line-clamp-1 min-w-0 truncate">
                                    {a.filename}
                                  </span>
                                  <span className="text-[12px] leading-[17.6px] text-orchid-muted whitespace-nowrap shrink-0">
                                    {formatBytes(a.size)}
                                  </span>
                                </a>

                                <div className="absolute -top-1 -right-1 opacity-0 transition-opacity duration-150 group-hover/item:opacity-100">
                                  <button
                                    type="button"
                                    aria-label={`Remove ${a.filename}`}
                                    className="group/button focus-visible:ring-neutral-strong relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2 size-5 min-w-5 min-h-5"
                                    onClick={() => removeAttachment(a.url)}
                                  >
                                    <div
                                      aria-hidden="true"
                                      className={[
                                        "absolute rounded-lg border transition-transform bg-gradient-to-t from-surface to-surface border-neutral shadow-xs inset-0",
                                        "group-hover/button:to-surface-weak dark:group-hover/button:to-surface-strong",
                                        "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none group-active/button:to-surface-subtle",
                                      ].join(" ")}
                                    />
                                    <div className="text-copy relative z-10 flex items-center gap-1 w-full justify-center text-orchid-ink">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                        aria-hidden="true"
                                        className="size-4 transition-transform"
                                      >
                                        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                      </svg>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={[
                        "ease-out-expo grid overflow-hidden transition-transform duration-300",
                        areAttachmentsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      ].join(" ")}
                    >
                      <div className="min-h-0">
                        <div className="flex flex-wrap gap-2 pt-2">
                          {attachments.map((a) => (
                            <div
                              key={a.url}
                              className="bg-surface hover:bg-surface-strong transition-colors group/item relative inline-flex h-7 max-w-[250px] items-center gap-1.5 rounded-md px-2 duration-150 select-none cursor-pointer"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                aria-hidden="true"
                                className="text-orchid-muted h-3 w-3 min-w-3 shrink-0"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm10.5 5.707a.5.5 0 0 0-.146-.353l-1-1a.5.5 0 0 0-.708 0L9.354 9.646a.5.5 0 0 1-.708 0L6.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0-.146.353V12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.707ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                                  clipRule="evenodd"
                                />
                              </svg>

                              <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-w-0 items-center gap-1.5 flex-1"
                              >
                                <span className="text-[12px] font-medium leading-[17.6px] text-orchid-ink line-clamp-1 min-w-0 truncate">
                                  {a.filename}
                                </span>
                                <span className="text-[12px] leading-[17.6px] text-orchid-muted whitespace-nowrap shrink-0">
                                  {formatBytes(a.size)}
                                </span>
                              </a>

                              <div className="absolute -top-1 -right-1 opacity-0 transition-opacity duration-150 group-hover/item:opacity-100">
                                <button
                                  type="button"
                                  aria-label={`Remove ${a.filename}`}
                                  className="group/button focus-visible:ring-neutral-strong relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2 size-5 min-w-5 min-h-5"
                                  onClick={() => removeAttachment(a.url)}
                                >
                                  <div
                                    aria-hidden="true"
                                    className={[
                                      "absolute rounded-lg border transition-transform bg-gradient-to-t from-surface to-surface border-neutral shadow-xs inset-0",
                                      "group-hover/button:to-surface-weak dark:group-hover/button:to-surface-strong",
                                      "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none group-active/button:to-surface-subtle",
                                    ].join(" ")}
                                  />
                                  <div className="text-copy relative z-10 flex items-center gap-1 w-full justify-center text-orchid-ink">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 16 16"
                                      fill="currentColor"
                                      aria-hidden="true"
                                      className="size-4 transition-transform"
                                    >
                                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                    </svg>
                                  </div>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
              ) : null}

              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Attach files"
                    className={hoverActionButtonClass()}
                    disabled={isUploading || isSaving || attachments.length >= MAX_ATTACHMENTS}
                    onClick={() => {
                      if (isUploading || isSaving) return;
                      if (attachments.length >= MAX_ATTACHMENTS) {
                        setUploadError(`Maximum of ${MAX_ATTACHMENTS} attachments reached.`);
                        return;
                      }
                      fileInputEl?.click();
                    }}
                  >
                    <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                    <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                      <PaperclipIcon />
                      <div className="px-0.5 leading-none transition-transform">
                        {isUploading ? "Uploading…" : "Attach files"}
                      </div>
                    </div>
                  </button>

                  {uploadError ? (
                    <div className="text-[12px] leading-[17.6px] text-red-600 dark:text-red-400">
                      {uploadError}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="text-[12px] leading-[17.6px] text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Discard"
                    className={[
                      hoverActionButtonClass(),
                      isSaving || isUploading
                        ? "pointer-events-none cursor-not-allowed opacity-50"
                        : "",
                    ].join(" ")}
                    disabled={isSaving || isUploading}
                  onClick={() => setIsDismissed(true)}
                  >
                    <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                    <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                      <div className="px-0.5 leading-none transition-transform">Discard</div>
                      <TrashIcon />
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-label="Create issue"
                    className={[
                      "group/button focus-visible:ring-neutral-strong",
                      "relative inline-flex shrink-0 cursor-pointer",
                      "rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                      "h-7 px-1.5",
                      canCreate ? "" : "opacity-50 pointer-events-none cursor-not-allowed",
                    ].join(" ")}
                    onClick={async () => {
                      setError(null);
                      setIsSaving(true);
                      try {
                        const now = Date.now();
                        const createdBy = getAnonymousIdentity();
                        const id = globalThis.crypto?.randomUUID?.() ?? `${now}`;
                        issues.insert({
                          id,
                          title: title.trim() || "Untitled bug",
                          body: bodyForSubmit,
                          status: "backlog",
                          createdAt: now,
                          updatedAt: now,
                          createdBy: {
                            name: createdBy.name ?? "Anonymous",
                            color: createdBy.color ?? "#999999",
                          },
                          githubRepo: "Arisayyy/rift",
                          githubSyncStatus: "pending",
                        });
                        try {
                          await enqueueIssueSync({ issueId: id });
                        } catch (e) {
                          // Issue is created locally; GitHub sync can be retried manually if desired.
                          setError(
                            e instanceof Error
                              ? `Issue created, but GitHub sync failed: ${e.message}`
                              : "Issue created, but GitHub sync failed.",
                          );
                        }
                        setCreatedIssueId(id);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed to create issue.");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    <div aria-hidden="true" className={sendButtonBgClass()} />
                    <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                      <div className="px-0.5 leading-none transition-transform">
                        {isSaving ? "Creating…" : createdIssueId ? "Created" : "Create"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={setFileInputEl}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = "";
          if (files.length === 0) return;

          void (async () => {
            setUploadError(null);
            setIsUploading(true);
            try {
              const remainingSlots = MAX_ATTACHMENTS - attachments.length;
              if (remainingSlots <= 0) {
                throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments reached.`);
              }

              const filesToUpload =
                files.length > remainingSlots ? files.slice(0, remainingSlots) : files;

              if (files.length > remainingSlots) {
                setUploadError(
                  `Only ${remainingSlots} more attachment${
                    remainingSlots === 1 ? "" : "s"
                  } allowed (max ${MAX_ATTACHMENTS}). Extra files were ignored.`,
                );
              }

              const next: Attachment[] = [];
              for (const f of filesToUpload) {
                const res = await uploadToUploadsRoute({ file: f, prefix: "issues/" });
                if (!res.publicUrl) throw new Error("Upload did not return a public URL.");
                next.push({
                  filename: res.originalFilename,
                  url: res.publicUrl,
                  contentType: res.contentType,
                  size: f.size,
                });
              }
              setAttachments((prev) => [...prev, ...next]);
            } catch (err) {
              setUploadError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setIsUploading(false);
            }
          })();
        }}
      />
    </div>
  );
}

