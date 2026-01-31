"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Streamdown } from "streamdown";
import { streamdownComponents, streamdownRehypePlugins } from "@/app/components/issue-detail/streamdown-media";
import { useChat } from "./chat-context";

export function ChatThread() {
  const { messages, status } = useChat();
  const endRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(() => messages.slice(), [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [sorted.length]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col">
        <div
          className="relative flex size-full flex-col overflow-hidden"
          style={{ ["--bottom-padding" as never]: "144px" }}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col">
              <div className="flex min-h-[calc(100dvh-var(--bottom-padding))] flex-col py-9">
                {sorted.map((m) => {
                  const isUser = m.role === "user";
                  const textParts = m.parts.filter((p) => p.type === "text");
                  const fileParts = m.parts.filter((p) => p.type === "file");
                  const markdown = textParts
                    .map((p) => p.text)
                    .join("\n\n")
                    .trim();
                  const isStreamingAssistantPlaceholder =
                    m.role === "assistant" &&
                    (status === "submitted" || status === "streaming") &&
                    markdown.length === 0 &&
                    fileParts.length === 0;

                  return (
                    <div
                      key={m.id}
                      className={[
                        "group flex w-full items-end gap-2 py-4",
                        isUser ? "is-user" : "is-assistant",
                      ].join(" ")}
                    >
                      <div className="text-copy overflow-hidden flex w-full flex-col gap-3 text-[14px] leading-[21px] group-[.is-user]:text-[18px] group-[.is-user]:leading-[27px]">
                        <div className="space-y-4 size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {isStreamingAssistantPlaceholder ? (
                            <div className="not-prose text-copy w-full">
                              <div className="py-1">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="bg-ai animate-pulse-size size-2 rounded-full"
                                    aria-hidden="true"
                                  />
                                  <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                                    Thinking...
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {markdown.length > 0 ? (
                            <Streamdown
                              mode="static"
                              rehypePlugins={streamdownRehypePlugins}
                              components={streamdownComponents}
                            >
                              {markdown}
                            </Streamdown>
                          ) : null}

                          {fileParts.map((part, idx) => {
                            const isImage = part.mediaType.startsWith("image/");
                            return isImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={`${m.id}-file-${idx}`}
                                src={part.url}
                                alt={part.filename ?? "attachment"}
                                className="max-w-full rounded-lg border border-neutral"
                              />
                            ) : (
                              <a
                                key={`${m.id}-file-${idx}`}
                                href={part.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm underline underline-offset-4"
                              >
                                {part.filename ?? part.url}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div ref={endRef} />
      </div>
    </div>
  );
}

