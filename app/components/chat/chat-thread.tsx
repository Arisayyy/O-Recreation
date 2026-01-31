"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Streamdown } from "streamdown";
import { streamdownComponents, streamdownRehypePlugins } from "@/app/components/issue-detail/streamdown-media";
import { useChat } from "./chat-context";

export function ChatThread() {
  const { messages } = useChat();
  const endRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(
    () => messages.slice().sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)),
    [messages],
  );

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
                  return (
                    <div
                      key={m.id}
                      className={[
                        "group flex w-full items-end gap-2 py-4",
                        isUser ? "is-user" : "is-assistant",
                      ].join(" ")}
                    >
                      <div className="text-copy overflow-hidden group-[.is-user]:text-copy-xl flex w-full flex-col gap-3">
                        <div className="space-y-4 size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <Streamdown
                            mode="static"
                            rehypePlugins={streamdownRehypePlugins}
                            components={streamdownComponents}
                          >
                            {m.body}
                          </Streamdown>
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

