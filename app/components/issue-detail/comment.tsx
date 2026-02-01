"use client";

import React from "react";
import { Streamdown } from "streamdown";
import { streamdownComponents, streamdownRehypePlugins } from "./streamdown-media";

export const IssueComment = React.forwardRef(function IssueComment(
  {
    name,
    body,
    timeLabel,
    variant = "default",
  }: {
  name: string;
  body: string;
  timeLabel?: string;
  variant?: "default" | "chatUser" | "chatAssistant";
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  if (variant === "chatUser") {
    return (
      <div ref={ref} className="group flex w-full items-end gap-2 py-4 is-user">
        <div className="text-copy overflow-hidden flex w-full flex-col gap-3 text-[18px] leading-[27px]">
          <div className="space-y-4 size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <Streamdown
              mode="static"
              linkSafety={{ enabled: false }}
              rehypePlugins={streamdownRehypePlugins}
              components={streamdownComponents}
            >
              {body}
            </Streamdown>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "chatAssistant") {
    return (
      <div ref={ref} className="group flex w-full items-end gap-2 py-4 is-assistant">
        <div className="text-copy overflow-hidden flex w-full flex-col gap-3 text-[14px] leading-[21px]">
          <div className="space-y-4 size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <Streamdown
              mode="static"
              linkSafety={{ enabled: false }}
              rehypePlugins={streamdownRehypePlugins}
              components={streamdownComponents}
            >
              {body}
            </Streamdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="px-1">
      <div className="flex items-baseline gap-2 px-2 py-1.5">
        <span className="text-sm font-medium leading-[21px] text-orchid-ink">
          {name}
        </span>
        {timeLabel ? (
          <span className="text-sm leading-[21px] text-orchid-muted">
            {timeLabel}
          </span>
        ) : null}
      </div>
      <div className="px-2 pb-1.5 text-sm leading-[21px] text-orchid-ink">
        <Streamdown
          mode="static"
          linkSafety={{ enabled: false }}
          rehypePlugins={streamdownRehypePlugins}
          components={streamdownComponents}
        >
          {body}
        </Streamdown>
      </div>
    </div>
  );
});

