"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";

export type PromptStatus =
  | {
      kind: "issue_marked_done";
      message: string;
    }
  | {
      kind: "reply_removed";
      message: string;
    }
  | {
      kind: "issue_removed";
      message: string;
    }
  | null;

type IssueChatContextValue = Pick<
  ReturnType<typeof useAIChat>,
  "messages" | "status" | "error" | "sendMessage" | "stop" | "setMessages"
> & {
  issueId: string | null;
  clear: () => void;
  setIssueContext: (contextText: string) => void;
  promptStatus: PromptStatus;
  flashPromptStatus: (status: Exclude<PromptStatus, null>, ttlMs?: number) => void;
};

const IssueChatContext = createContext<IssueChatContextValue | null>(null);

const ISSUE_CONTEXT_ID = "issue-context";

function makeIssueContextMessage(contextText: string): UIMessage {
  return {
    id: ISSUE_CONTEXT_ID,
    role: "system",
    parts: [
      {
        type: "text",
        text: contextText,
      },
    ],
  };
}

export function IssueChatProvider({
  issueId,
  children,
}: {
  issueId: string | null;
  children: React.ReactNode;
}) {
  const { messages, status, error, sendMessage, stop, setMessages } = useAIChat({
    transport: new DefaultChatTransport({ api: "/api/issue-chat" }),
  });

  const [promptStatus, setPromptStatus] = useState<PromptStatus>(null);
  const promptStatusTimerRef = useRef<number | null>(null);

  // Clear when switching issues (private + ephemeral per render, like /chat).
  useEffect(() => {
    setMessages([]);
  }, [issueId, setMessages]);

  const clear = useCallback(() => setMessages([]), [setMessages]);

  const lastContextTextRef = useRef<string>("");
  useEffect(() => {
    lastContextTextRef.current = "";
  }, [issueId]);

  useEffect(() => {
    return () => {
      if (promptStatusTimerRef.current != null) {
        window.clearTimeout(promptStatusTimerRef.current);
        promptStatusTimerRef.current = null;
      }
    };
  }, []);

  const flashPromptStatus = useCallback(
    (next: Exclude<PromptStatus, null>, ttlMs: number = 1400) => {
      setPromptStatus(next);
      if (promptStatusTimerRef.current != null) {
        window.clearTimeout(promptStatusTimerRef.current);
      }
      promptStatusTimerRef.current = window.setTimeout(() => {
        setPromptStatus(null);
        promptStatusTimerRef.current = null;
      }, ttlMs);
    },
    [],
  );

  const setIssueContext = useCallback(
    (contextText: string) => {
      const text = contextText.trim();

      // Prevent update loops: if the computed context hasn't changed, do nothing.
      // (IssueDetailClient recomputes context frequently due to live queries.)
      if (text === lastContextTextRef.current) return;
      lastContextTextRef.current = text;

      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== ISSUE_CONTEXT_ID);
        if (!text) return without;
        return [makeIssueContextMessage(text), ...without];
      });
    },
    [setMessages],
  );

  const value = useMemo<IssueChatContextValue>(() => {
    return {
      issueId,
      messages,
      status,
      error,
      sendMessage,
      stop,
      setMessages,
      clear,
      setIssueContext,
      promptStatus,
      flashPromptStatus,
    };
  }, [
    issueId,
    messages,
    status,
    error,
    sendMessage,
    stop,
    setMessages,
    clear,
    setIssueContext,
    promptStatus,
    flashPromptStatus,
  ]);

  return <IssueChatContext.Provider value={value}>{children}</IssueChatContext.Provider>;
}

export function useIssueChat() {
  const ctx = useContext(IssueChatContext);
  if (!ctx) {
    throw new Error("useIssueChat must be used within IssueChatProvider");
  }
  return ctx;
}

