"use client";

import React from "react";
import { Streamdown } from "streamdown";
import { streamdownComponents, streamdownRehypePlugins } from "./streamdown-media";

export function IssueComment({
  name,
  body,
  timeLabel,
}: {
  name: string;
  body: string;
  timeLabel?: string;
}) {
  return (
    <div className="px-1">
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
          rehypePlugins={streamdownRehypePlugins}
          components={streamdownComponents}
        >
          {body}
        </Streamdown>
      </div>
    </div>
  );
}

