"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type EphemeralChatMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: number;
};

type ChatContextValue = {
  messages: EphemeralChatMessage[];
  appendUserMessage: (body: string) => EphemeralChatMessage | null;
  appendAssistantMessage: (body: string) => EphemeralChatMessage | null;
  clear: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function safeRandomUUID() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<EphemeralChatMessage[]>([]);

  const clear = useCallback(() => setMessages([]), []);

  const appendUserMessage = useCallback((body: string) => {
    const trimmed = body.trim();
    if (trimmed.length === 0) return null;

    const next: EphemeralChatMessage = {
      id: safeRandomUUID(),
      role: "user",
      body: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, next]);
    return next;
  }, []);

  const appendAssistantMessage = useCallback((body: string) => {
    const trimmed = body.trim();
    if (trimmed.length === 0) return null;

    const next: EphemeralChatMessage = {
      id: safeRandomUUID(),
      role: "assistant",
      body: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, next]);
    return next;
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({ messages, appendUserMessage, appendAssistantMessage, clear }),
    [messages, appendUserMessage, appendAssistantMessage, clear],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return ctx;
}

