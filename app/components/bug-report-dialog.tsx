"use client";

import React, { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";

function closeButtonClassName() {
  return [
    "group/button focus-visible:ring-neutral-strong",
    "absolute right-4 top-4 inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap",
    "transition-transform outline-none select-none focus-visible:ring-2",
    "size-7 min-w-7 min-h-7",
  ].join(" ");
}

function closeButtonBgClassName() {
  return [
    "absolute rounded-lg border transition-transform",
    "border-transparent bg-surface-strong opacity-0",
    "inset-2 blur-sm",
    "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0",
    "group-active/button:inset-shadow-xs group-active/button:shadow-none",
  ].join(" ");
}

const dialogActionButtonBaseClassName = [
  "group/button focus-visible:ring-neutral-strong",
  "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap",
  "transition-transform outline-none select-none focus-visible:ring-2",
  "h-7 px-1.5",
].join(" ");

const dialogSecondaryButtonBgClassName = [
  "absolute rounded-lg border transition-transform bg-surface-weak border-transparent inset-0",
  "group-hover/button:bg-surface-strong group-hover/button:border-neutral group-hover/button:shadow-xs",
  "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
].join(" ");

const dialogPrimaryButtonBgClassName = [
  "absolute rounded-lg border transition-transform inset-0",
  "bg-gradient-to-t from-surface to-surface border-neutral shadow-xs",
  "group-hover/button:to-surface-weak dark:group-hover/button:to-surface-strong",
  "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
  "group-active/button:to-surface-subtle",
].join(" ");

const dialogActionButtonInnerClassName =
  "relative z-10 flex items-center gap-1 text-[14px] leading-[21px] text-orchid-ink";

export function BugReportDialog({
  open,
  onOpenChangeAction,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}) {
  const [report, setReport] = useState("");

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChangeAction(next);
        if (!next) setReport("");
      }}
      modal="trap-focus"
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 z-[100] grid place-items-center p-4">
          <Dialog.Popup
            className={[
              "font-orchid-ui leading-6",
              "w-[min(448px,calc(100vw-32px))] h-[min(286px,calc(100vh-32px))]",
              "rounded-[var(--radius-orchid-prompt-outer)] border border-neutral bg-surface outline-none",
              "shadow-[0_1px_1px_0_rgb(0_0_0_/0.02),0_4px_8px_-4px_rgb(0_0_0_/0.04),0_16px_24px_-8px_rgb(0_0_0_/0.06)]",
              "relative overflow-hidden p-0.5",
              "animate-[orchid-dialog-content-in_150ms_ease-out]",
            ].join(" ")}
            initialFocus={true}
            finalFocus={false}
          >
            <Dialog.Close aria-label="Close" className={closeButtonClassName()}>
              <div aria-hidden="true" className={closeButtonBgClassName()} />
              <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  className="size-4 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
                  />
                </svg>
              </div>
            </Dialog.Close>

            <div className="flex h-full flex-col gap-4 p-6">
              <div className="flex flex-col gap-2">
                <Dialog.Title className="m-0 text-orchid-ink font-medium">
                  Report a Bug
                </Dialog.Title>
                <Dialog.Description className="m-0 text-sm leading-[21px] text-orchid-muted">
                  What went wrong? Please describe the issue you encountered.
                </Dialog.Description>
              </div>

              <textarea
                placeholder="Describe what went wrong..."
                rows={4}
                className={[
                  "w-full resize-none rounded-lg border border-surface-strong bg-surface-weak",
                  "px-3 py-2 text-sm leading-[21px] text-orchid-ink",
                  "focus:border-neutral focus:outline-none",
                ].join(" ")}
                value={report}
                onChange={(e) => setReport(e.currentTarget.value)}
              />

              <div className="flex justify-end gap-2">
                <Dialog.Close className={dialogActionButtonBaseClassName}>
                  <div aria-hidden="true" className={dialogSecondaryButtonBgClassName} />
                  <div className={dialogActionButtonInnerClassName}>
                    <div className="px-0.5 leading-[0px] transition-transform">Cancel</div>
                  </div>
                </Dialog.Close>

                <button
                  type="button"
                  disabled={report.trim().length === 0}
                  className={[
                    dialogActionButtonBaseClassName,
                    report.trim().length === 0 ? "cursor-not-allowed opacity-50 pointer-events-none" : "",
                  ].join(" ")}
                  onClick={() => {
                    // TODO: wire to real bug reporting endpoint.
                    onOpenChangeAction(false);
                    setReport("");
                  }}
                >
                  <div aria-hidden="true" className={dialogPrimaryButtonBgClassName} />
                  <div className={dialogActionButtonInnerClassName}>
                    <div className="px-0.5 leading-[0px] transition-transform">Send Report</div>
                  </div>
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

