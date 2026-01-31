"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";

export function EnsureAnonymousUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (isLoading) return;
    if (isAuthenticated) return;

    attemptedRef.current = true;
    void signIn("anonymous").catch(() => {
      // If this fails (network issues, provider not configured, etc.),
      // avoid a sign-in loop. The app can still render signed-out UI.
    });
  }, [isAuthenticated, isLoading, signIn]);

  return null;
}

