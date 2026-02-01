"use client";

import React, { createContext, useContext } from "react";

export type ReplicateInitState = {
  ready: boolean;
  error: Error | null;
  retry: () => void;
};

const ReplicateContext = createContext<ReplicateInitState | null>(null);

export function ReplicateContextProvider({
  value,
  children,
}: {
  value: ReplicateInitState;
  children: React.ReactNode;
}) {
  return <ReplicateContext.Provider value={value}>{children}</ReplicateContext.Provider>;
}

export function useReplicateInitState(): ReplicateInitState {
  const ctx = useContext(ReplicateContext);
  if (!ctx) {
    // Should not happen because RootLayout wraps the app in `ReplicateProvider`.
    return { ready: false, error: null, retry: () => {} };
  }
  return ctx;
}

