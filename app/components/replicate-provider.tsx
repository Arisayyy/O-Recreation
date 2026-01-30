"use client";

import React, { useEffect, useState } from "react";
import { issues } from "@/app/collections/issues";
import { issueMessages } from "@/app/collections/issueMessages";

export function ReplicateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([issues.init(), issueMessages.init()])
      .then(() => {
        if (cancelled) return;
        setReady(true);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 font-orchid-ui text-sm leading-6 text-orchid-ink">
        <div className="rounded-xl border border-neutral bg-white p-4">
          <div className="font-medium">Failed to initialize offline storage</div>
          <div className="mt-1 text-orchid-muted">{error.message}</div>
        </div>
      </div>
    );
  }

  if (!ready) return null;

  return <>{children}</>;
}

