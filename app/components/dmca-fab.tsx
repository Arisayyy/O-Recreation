"use client";

import React, { useState } from "react";
import { DmcaNoticeDialog } from "@/app/components/dmca-notice-dialog";
import {
  semiGhostButtonBaseClass,
  semiGhostButtonBgClass,
  semiGhostButtonInnerClass,
} from "@/app/components/issue-detail/semi-ghost-button";

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={["size-4 transition-transform", className ?? ""].join(" ")}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 2.5c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25V6.621a1.25 1.25 0 0 0-.366-.884L10.513 3.366A1.25 1.25 0 0 0 9.629 3H4Zm5.5 1.72V6.25c0 .69.56 1.25 1.25 1.25h2.03a.25.25 0 0 0 .177-.427L9.926 4.043A.25.25 0 0 0 9.5 4.22Z"
      />
      <path d="M5 8.25c0-.414.336-.75.75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 8.25Z" />
      <path d="M5 10.75c0-.414.336-.75.75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 5 10.75Z" />
    </svg>
  );
}

export function DmcaFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          className={[semiGhostButtonBaseClass, "px-2.5"].join(" ")}
          onClick={() => setOpen(true)}
        >
          <div className={semiGhostButtonBgClass} />
          <div className={semiGhostButtonInnerClass + " pointer-events-none"}>
            <span className="block h-4 w-4 transition-transform">
              <DocumentIcon />
            </span>
            <div className="px-[2px] leading-[0px] transition-transform">Submit DMCA</div>
          </div>
        </button>
      </div>

      <DmcaNoticeDialog open={open} onOpenChangeAction={setOpen} />
    </>
  );
}

