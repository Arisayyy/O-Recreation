"use client";

import React, { useMemo, useState } from "react";

function normalizeCodeChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(normalizeCodeChildren).join("");
  return "";
}

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const trimmed = useMemo(() => code.replace(/\n$/, ""), [code]);
  const langLabel = (language ?? "").trim() || "text";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-neutral bg-surface-subtle px-3 py-2">
        <span className="text-xs text-orchid-muted">{langLabel}</span>
        <button
          type="button"
          className="text-xs text-orchid-muted hover:text-orchid-ink"
          onClick={onCopy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="m-0 overflow-auto p-3 text-sm leading-6">
        <code className="whitespace-pre">{trimmed}</code>
      </pre>
    </div>
  );
}

export function StreamdownPre(props: React.ComponentPropsWithoutRef<"pre">) {
  const child = Array.isArray(props.children) ? props.children[0] : props.children;

  if (React.isValidElement(child) && child.type === "code") {
    const className = (child.props as { className?: string }).className ?? "";
    const match = className.match(/language-([a-zA-Z0-9_-]+)/);
    const language = match?.[1];
    const code = normalizeCodeChildren((child.props as { children?: React.ReactNode }).children);
    return <CodeBlock code={code} language={language} />;
  }

  return <pre {...props} />;
}

