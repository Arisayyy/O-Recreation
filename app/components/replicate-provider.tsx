"use client";

import React, { useCallback, useEffect, useState } from "react";
import { issues } from "@/app/collections/issues";
import { issueMessages } from "@/app/collections/issueMessages";
import { ReplicateContextProvider } from "@/app/components/replicate-context";

export function ReplicateProvider({ children }: { children: React.ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    issuesRef: typeof issues;
    issueMessagesRef: typeof issueMessages;
    ready: boolean;
    error: Error | null;
  }>(() => ({
    issuesRef: issues,
    issueMessagesRef: issueMessages,
    ready: false,
    error: null,
  }));

  // If Turbopack/HMR replaces the `app/collections/*` modules, the imported bindings can
  // change while this component stays mounted. In that case, treat the app as "not ready"
  // until the new collection instances are initialized.
  const isCurrent = state.issuesRef === issues && state.issueMessagesRef === issueMessages;
  const ready = isCurrent ? state.ready : false;
  const error = isCurrent ? state.error : null;

  const retry = useCallback(() => {
    // Reset state for the current collection instances and kick another init attempt.
    setState({
      issuesRef: issues,
      issueMessagesRef: issueMessages,
      ready: false,
      error: null,
    });
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([issues.init(), issueMessages.init()])
      .then(() => {
        if (cancelled) return;
        // Validate initialization (esp. across HMR/module replacement).
        issues.get();
        issueMessages.get();
        setState({
          issuesRef: issues,
          issueMessagesRef: issueMessages,
          ready: true,
          error: null,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({
          issuesRef: issues,
          issueMessagesRef: issueMessages,
          ready: false,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      });

    return () => {
      cancelled = true;
    };
    // Intentionally depend on module-level bindings so we re-init after Turbopack/HMR
    // replaces `app/collections/*` while this provider remains mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, issueMessages, attempt]);

  return (
    <ReplicateContextProvider value={{ ready, error, retry }}>
      {children}
    </ReplicateContextProvider>
  );
}

