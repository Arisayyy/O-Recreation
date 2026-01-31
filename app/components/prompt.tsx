"use client";

import React from "react";
import { Playfair_Display } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { issueMessages } from "@/app/collections/issueMessages";
import { issues, type Issue } from "@/app/collections/issues";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";
import { StripeIcon } from "@/app/components/icons/stripe-icon";
import { GitHubIcon } from "@/app/components/icons/github-icon";
import { LinearIcon } from "@/app/components/icons/linear-icon";
import { ExaIcon } from "@/app/components/icons/exa-icon";
import { useChat } from "@/app/components/chat/chat-context";
import { useFirstMessageSendAnimation } from "@/app/components/chat/first-message-send-animation";
import { uploadToUploadsRoute } from "@/app/lib/uploads";
import type { FileUIPart } from "ai";

const playfairDisplay = Playfair_Display({
  weight: ["500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair-display",
});

const SUGGESTIONS = [
  "What's new?",
  "Draft an email to emails that need a response",
  "What can you do?",
] as const;

type PromptVariant = "home" | "issues" | "chat";
type NavDirection = "toIssues" | "toHome";

type ConnectionKey = "stripe" | "github" | "linear" | "exa";
type ConnectionItem = {
  id: ConnectionKey;
  label: string;
  icon: React.ReactNode;
};

type MentionType = "tool";
type MentionProvider = ConnectionKey;

const CONNECTION_ITEMS: ReadonlyArray<ConnectionItem> = [
  {
    id: "stripe",
    label: "Stripe",
    icon: <StripeIcon className="rounded-md size-4" />,
  },
  {
    id: "github",
    label: "GitHub",
    icon: <GitHubIcon className="rounded-md size-4" />,
  },
  {
    id: "linear",
    label: "Linear",
    icon: <LinearIcon className="rounded-md size-4" />,
  },
  {
    id: "exa",
    label: "Exa",
    icon: <ExaIcon className="rounded-md size-4" />,
  },
] as const;

function menuPanelClassName() {
  // Match the dropdown panel structure in the reference design.
  return [
    "bg-surface border-neutral z-50 min-w-48 rounded-xl border p-0.5 shadow-lg outline-none",
    "transition-[transform,scale,opacity] duration-150 ease-out",
    "group-data-[starting-style]:scale-90 group-data-[starting-style]:opacity-0",
    "group-data-[ending-style]:scale-90 group-data-[ending-style]:opacity-0",
    "origin-[var(--transform-origin)] group-data-[instant]:duration-0",
    "max-h-60 w-fit overflow-auto",
  ].join(" ");
}

function menuItemBgClassName() {
  // Matches highlight/hover backgrounds in `MenuDropdown`.
  return [
    "absolute bg-surface-subtle rounded-lg opacity-0 inset-1",
    "transition-transform",
    "group-hover/zhover:opacity-100 group-hover/zhover:inset-0",
    "group-data-[highlighted]/zhover:opacity-100 group-data-[highlighted]/zhover:inset-0",
    "group-active/zhover:!inset-0.5",
  ].join(" ");
}

type AtContext = { atIndex: number; query: string };
function getAtContext(text: string, cursorIndex: number): AtContext | null {
  const cursor = Math.max(0, Math.min(cursorIndex, text.length));
  const uptoCursor = text.slice(0, cursor);
  const atIndex = uptoCursor.lastIndexOf("@");
  if (atIndex === -1) return null;

  const prev = atIndex === 0 ? "" : text[atIndex - 1] ?? "";
  const isStartOrWhitespace = atIndex === 0 || /\s/.test(prev);
  if (!isStartOrWhitespace) return null;

  const query = text.slice(atIndex + 1, cursor);
  // If the query already contains whitespace/newlines, it's not an active mention.
  if (/\s/.test(query)) return null;

  return { atIndex, query };
}

function getCaretTextOffsetWithin(root: HTMLElement): number | null {
  if (typeof window === "undefined") return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.endContainer)) return null;

  const pre = range.cloneRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function findDomPositionAtTextOffset(root: HTMLElement, offset: number) {
  // Map a plain-text offset (based on Range.toString()) back to a concrete DOM position.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  let remaining = offset;

  while (node) {
    const len = node.data.length;
    if (remaining <= len) return { node, offset: remaining };
    remaining -= len;
    node = walker.nextNode() as Text | null;
  }

  // Fallback: end of root.
  return { node: root, offset: root.childNodes.length };
}

function createMentionIcon(provider: MentionProvider): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("xmlns", ns);
  svg.setAttribute("class", "rounded-md size-4");

  if (provider === "exa") {
    svg.setAttribute("viewBox", "0 0 395 480");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    path.setAttribute(
      "d",
      "M0 475.765C0 478.104 1.8948 480 4.23215 480H390.768C393.105 480 395 478.104 395 475.765V455.637C395 453.672 394.318 451.767 393.07 450.248L222.539 242.69C221.255 241.127 221.255 238.873 222.539 237.31L393.07 29.7517C394.318 28.2333 395 26.3285 395 24.3627V4.23529C395 1.89621 393.105 0 390.768 0H4.23214C1.89479 0 0 1.8962 0 4.23529V475.765ZM199.802 270.589C198.668 269.208 196.554 269.216 195.43 270.605L58.3178 440.106C56.8245 441.952 58.1374 444.706 60.5108 444.706H336.886C339.269 444.706 340.579 441.932 339.065 440.089L199.802 270.589ZM39.0286 407.858C37.7739 409.409 35.2679 408.521 35.2679 406.525V260.471C35.2679 258.911 36.5311 257.647 38.0893 257.647H154.623C156.996 257.647 158.309 260.401 156.816 262.247L39.0286 407.858ZM154.623 222.353C156.996 222.353 158.309 219.599 156.816 217.753L39.0286 72.1424C37.7739 70.5913 35.2679 71.4792 35.2679 73.4749V219.529C35.2679 221.089 36.5311 222.353 38.0893 222.353H154.623ZM58.3178 39.8942C56.8245 38.0482 58.1374 35.2941 60.5108 35.2941H336.886C339.269 35.2941 340.579 38.0685 339.065 39.9109L199.802 209.411C198.668 210.792 196.554 210.784 195.43 209.395L58.3178 39.8942Z",
    );
    path.setAttribute("fill", "#1E40ED");
    svg.appendChild(path);
    return svg;
  }

  svg.setAttribute("viewBox", "0 0 16 16");
  const rect = document.createElementNS(ns, "rect");
  rect.setAttribute("width", "16");
  rect.setAttribute("height", "16");
  rect.setAttribute("fill", provider === "stripe" ? "#533AFD" : provider === "github" ? "black" : "#5E6AD2");
  svg.appendChild(rect);

  if (provider === "stripe") {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    path.setAttribute("d", "M4.3 11.7L11.7 10.1307V4.3L4.3 5.88765V11.7Z");
    path.setAttribute("fill", "white");
    svg.appendChild(path);
    return svg;
  }

  if (provider === "github") {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    path.setAttribute(
      "d",
      "M8.00495 1.99997C4.69699 1.99997 2.02283 4.74997 2.02283 8.1521C2.02283 10.8716 3.73626 13.1736 6.11324 13.9883C6.41042 14.0496 6.51928 13.856 6.51928 13.6931C6.51928 13.5505 6.50948 13.0616 6.50948 12.5522C4.8454 12.919 4.49887 11.8188 4.49887 11.8188C4.23144 11.1058 3.83519 10.9226 3.83519 10.9226C3.29054 10.5457 3.87487 10.5457 3.87487 10.5457C4.47903 10.5865 4.79605 11.1772 4.79605 11.1772C5.33079 12.1142 6.19246 11.8495 6.53911 11.6865C6.58858 11.2892 6.74715 11.0142 6.91552 10.8615C5.5883 10.7188 4.19189 10.1892 4.19189 7.8261C4.19189 7.15385 4.42944 6.60385 4.80585 6.1761C4.74646 6.02335 4.53842 5.39172 4.86536 4.54634C4.86536 4.54634 5.37046 4.38334 6.50936 5.17784C6.99696 5.04318 7.49982 4.97467 8.00495 4.97409C8.51005 4.97409 9.02495 5.04547 9.50042 5.17784C10.6394 4.38334 11.1445 4.54634 11.1445 4.54634C11.4715 5.39172 11.2633 6.02335 11.2039 6.1761C11.5903 6.60385 11.818 7.15385 11.818 7.8261C11.818 10.1892 10.4216 10.7086 9.08446 10.8615C9.30242 11.055 9.4905 11.4216 9.4905 12.0022C9.4905 12.8272 9.48071 13.4893 9.48071 13.693C9.48071 13.856 9.58968 14.0496 9.88675 13.9885C12.2637 13.1735 13.9772 10.8716 13.9772 8.1521C13.987 4.74997 11.303 1.99997 8.00495 1.99997Z",
    );
    path.setAttribute("fill", "white");
    svg.appendChild(path);
    return svg;
  }

  // linear
  const paths = [
    "M3.01004 8.52407C3.12544 9.62576 3.60532 10.6966 4.44965 11.5409C5.29398 12.3852 6.36476 12.8651 7.4665 12.9805L3.01004 8.52407Z",
    "M2.99048 7.7175L8.27303 13C8.72131 12.9749 9.16681 12.8899 9.59661 12.7448L3.24564 6.39391C3.10063 6.82368 3.01558 7.26922 2.99048 7.7175Z",
    "M3.47309 5.83434L10.1561 12.5174C10.5028 12.3513 10.8344 12.143 11.1431 11.8924L4.09805 4.84741C3.84754 5.15609 3.63921 5.48764 3.47309 5.83434Z",
    "M4.47254 4.43479C6.43033 2.50155 9.58463 2.50913 11.533 4.45754C13.4814 6.40594 13.489 9.5602 11.5558 11.518L4.47254 4.43479Z",
  ];
  for (const d of paths) {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "white");
    svg.appendChild(p);
  }
  return svg;
}

function createMentionNode({
  provider,
  name,
  type,
}: {
  provider: MentionProvider;
  name: string;
  type: MentionType;
}) {
  const outer = document.createElement("span");
  outer.setAttribute("contenteditable", "false");
  outer.className = "inline-flex items-center gap-1 text-orchid-muted align-baseline";
  outer.dataset.mention = "true";
  outer.dataset.mentionId = `${type}-${provider}`;
  outer.dataset.mentionName = name;
  outer.dataset.mentionType = type;
  outer.dataset.mentionProvider = provider;

  const inner = document.createElement("span");
  inner.className =
    "text-orchid-muted relative inline-flex h-[var(--lh)] items-center gap-1 pl-[calc(var(--icon-size)+4px)] [--icon-size:16px]";

  const iconWrap = document.createElement("div");
  iconWrap.className = "absolute left-0";
  iconWrap.appendChild(createMentionIcon(provider));

  const label = document.createElement("span");
  label.className = "max-w-[12rem] truncate";
  label.textContent = name;

  inner.appendChild(iconWrap);
  inner.appendChild(label);
  outer.appendChild(inner);
  return outer;
}

function serializeComposer(root: HTMLElement): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node as Text).data;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    if (el.dataset.mention === "true") {
      const provider = (el.dataset.mentionProvider as MentionProvider | undefined) ?? "stripe";
      out += `@${provider}`;
      return;
    }
    if (el.tagName === "BR") {
      out += "\n";
      return;
    }
    for (const child of Array.from(el.childNodes)) walk(child);
  };
  walk(root);
  return out;
}

function insertTextAtCaret(text: string) {
  if (typeof window === "undefined") return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const node = document.createTextNode(text);
  range.insertNode(node);

  // Move caret to end of inserted text node.
  const next = document.createRange();
  next.setStart(node, node.data.length);
  next.collapse(true);
  sel.removeAllRanges();
  sel.addRange(next);
}

function setComposerPlainText(root: HTMLElement, text: string) {
  // Replace all content (including mentions) with plain text.
  root.innerHTML = "";
  root.appendChild(document.createTextNode(text));

  // Place caret at end.
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function Prompt({
  variant = "home",
  isNavigating = false,
  navDirection = null,
  issueIdForComment = null,
}: {
  variant?: PromptVariant;
  isNavigating?: boolean;
  navDirection?: NavDirection | null;
  issueIdForComment?: string | null;
}) {
  const router = useRouter();
  const chat = useChat();
  const chatStatus = chat.status;
  const stopChat = chat.stop;
  const firstMessageAnim = useFirstMessageSendAnimation();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastAtContextRef = useRef<AtContext | null>(null);
  const prevVariantRef = useRef<PromptVariant | null>(null);

  const [displayValue, setDisplayValue] = useState("");
  const [serializedValue, setSerializedValue] = useState("");
  const [cursorIndex, setCursorIndex] = useState(0);
  const [dismissedAtIndex, setDismissedAtIndex] = useState<number | null>(null);
  const [activeConnectionIndex, setActiveConnectionIndex] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<FileUIPart[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const isEmpty = useMemo(() => serializedValue.trim().length === 0, [serializedValue]);
  const hideExtras = variant !== "home";
  const fadeNearEdgeDelay = isNavigating ? "delay-[420ms]" : "delay-0";
  const collapseNearBottomDelay =
    isNavigating && navDirection === "toIssues" ? "delay-[420ms]" : "delay-0";

  const canSendComment = variant === "issues" && !!issueIdForComment;
  const canSendChatMessage =
    variant === "home" || variant === "chat" || (variant === "issues" && !issueIdForComment);
  const isThinking =
    canSendChatMessage && (chatStatus === "submitted" || chatStatus === "streaming");

  // If we leave `/chat` while the assistant is still streaming, stop the in-flight request.
  // This avoids leaking the "Thinking..." prompt UI onto unrelated routes after exiting chat.
  useEffect(() => {
    const prev = prevVariantRef.current;
    prevVariantRef.current = variant;

    const leftChat = prev === "chat" && variant !== "chat";
    const isStreaming = chatStatus === "submitted" || chatStatus === "streaming";
    if (leftChat && isStreaming) stopChat();
  }, [chatStatus, stopChat, variant]);

  const atContext = useMemo(
    () => getAtContext(displayValue, cursorIndex),
    [displayValue, cursorIndex],
  );
  const isAtDropdownOpen = useMemo(() => {
    if (!atContext) return false;
    if (dismissedAtIndex === atContext.atIndex) return false;
    return true;
  }, [atContext, dismissedAtIndex]);

  const filteredConnections = useMemo(() => {
    if (!atContext) return CONNECTION_ITEMS;
    const q = atContext.query.trim().toLowerCase();
    if (!q) return CONNECTION_ITEMS;
    return CONNECTION_ITEMS.filter((it) => it.label.toLowerCase().includes(q));
  }, [atContext]);

  const syncFromComposer = () => {
    const root = composerRef.current;
    if (!root) return;

    const nextDisplay = root.textContent ?? "";
    const nextSerialized = serializeComposer(root);
    const nextCursor = getCaretTextOffsetWithin(root) ?? nextDisplay.length;

    setDisplayValue(nextDisplay);
    setSerializedValue(nextSerialized);
    setCursorIndex(nextCursor);

    resetActiveIndexIfAtContextChanged(getAtContext(nextDisplay, nextCursor));

    const ctx = getAtContext(nextDisplay, nextCursor);
    if (!ctx || dismissedAtIndex !== ctx.atIndex) {
      setDismissedAtIndex(null);
    }
  };

  const resetComposer = () => {
    setDisplayValue("");
    setSerializedValue("");
    setCursorIndex(0);
    const root = composerRef.current;
    if (root) root.innerHTML = "";
    composerRef.current?.focus();
  };

  const sendComment = () => {
    if (!canSendComment) return;
    if (isEmpty) return;

    const now = Date.now();
    const author = getAnonymousIdentity();
    const msg = serializedValue.trim();

    const messages = issueMessages.get();
    messages.insert({
      id: globalThis.crypto?.randomUUID?.() ?? `${now}`,
      issueId: issueIdForComment!,
      type: "comment",
      body: msg,
      createdAt: now,
      author: {
        name: author.name ?? "Anonymous",
        color: author.color ?? "#6366f1",
      },
    });

    // Bump issue updatedAt so it floats in the inbox.
    const issueCollection = issues.get();
    issueCollection.update(issueIdForComment!, (draft: Issue) => {
      draft.updatedAt = now;
    });

    resetComposer();
  };

  const sendChatMessage = () => {
    if (!canSendChatMessage) return;
    // Don't allow sending while the assistant is generating a response.
    // This is normally enforced by the disabled "Send" button, but we also guard
    // here so keyboard shortcuts (Enter) can't bypass it.
    if (chat.status !== "ready") return;
    if (isEmpty && pendingFiles.length === 0) return;
    if (isUploadingFiles) return;

    const msg = serializedValue.trim();
    const parts = [
      ...(msg.length ? [{ type: "text" as const, text: msg }] : []),
      ...pendingFiles,
    ];

    if (variant === "home" || variant === "issues") {
      // "First message send" animation: capture an origin point near the composer,
      // then animate the first user message into place on /chat.
      const anchor = inputAnchorRef.current ?? composerRef.current;
      if (anchor && typeof window !== "undefined") {
        const r = anchor.getBoundingClientRect();
        // Bias towards the left/top of the typed content area (matches chat alignment better).
        const sourcePoint = { x: r.left + 16, y: r.top + 18 };
        flushSync(() => firstMessageAnim.begin(sourcePoint));
      }

      chat.clear();
      void chat.sendMessage({ role: "user", parts });
      router.push("/chat");
    } else {
      void chat.sendMessage({ role: "user", parts });
    }

    resetComposer();
    setPendingFiles([]);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const res = await uploadToUploadsRoute({ file, prefix: "uploads/chat/" });
          const url = res.publicUrl ?? res.presignedUrl;
          return {
            type: "file" as const,
            mediaType: file.type || "application/octet-stream",
            filename: file.name,
            url,
          } satisfies FileUIPart;
        }),
      );

      setPendingFiles((prev) => [...prev, ...uploaded]);
    } finally {
      setIsUploadingFiles(false);
      // allow selecting the same file twice
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resetActiveIndexIfAtContextChanged = (next: AtContext | null) => {
    const prev = lastAtContextRef.current;
    const changed =
      (!prev && !!next) ||
      (!!prev && !next) ||
      (!!prev && !!next && (prev.atIndex !== next.atIndex || prev.query !== next.query));

    lastAtContextRef.current = next;
    if (changed) setActiveConnectionIndex(0);
  };

  const insertConnection = (item: ConnectionItem) => {
    const root = composerRef.current;
    if (!root) return;
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const caretOffset = getCaretTextOffsetWithin(root);
    if (caretOffset == null) return;

    const before = (root.textContent ?? "").slice(0, caretOffset);
    const atIndex = before.lastIndexOf("@");
    if (atIndex === -1) return;

    const prev = atIndex === 0 ? "" : before[atIndex - 1] ?? "";
    const isStartOrWhitespace = atIndex === 0 || /\s/.test(prev);
    if (!isStartOrWhitespace) return;

    const query = before.slice(atIndex + 1);
    if (/\s/.test(query)) return;

    const currentRange = sel.getRangeAt(0);
    if (!root.contains(currentRange.endContainer)) return;

    const startPos = findDomPositionAtTextOffset(root, atIndex);
    const replaceRange = document.createRange();
    if (startPos.node instanceof Node) {
      if (startPos.node === root) {
        replaceRange.setStart(root, startPos.offset);
      } else {
        replaceRange.setStart(startPos.node, startPos.offset);
      }
    }
    replaceRange.setEnd(currentRange.endContainer, currentRange.endOffset);

    replaceRange.deleteContents();

    const mentionNode = createMentionNode({
      provider: item.id,
      name: item.label,
      type: "tool",
    });
    replaceRange.insertNode(mentionNode);
    const space = document.createTextNode(" ");
    mentionNode.after(space);

    const nextRange = document.createRange();
    nextRange.setStart(space, 1);
    nextRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nextRange);

    setDismissedAtIndex(null);
    requestAnimationFrame(() => syncFromComposer());
  };

  const dropdownSide = variant === "issues" || variant === "chat" ? ("top" as const) : ("bottom" as const);

  return (
    <div
      className={[
        playfairDisplay.variable,
        "flex w-full flex-col",
        "font-orchid-ui",
        "leading-6",
      ].join(" ")}
    >
      <div
        aria-hidden={hideExtras}
        className={[
          "grid overflow-hidden transition-[grid-template-rows] duration-[600ms] ease-out-expo",
          collapseNearBottomDelay,
          hideExtras
            ? "grid-rows-[0fr]"
            : "grid-rows-[1fr]",
        ].join(" ")}
      >
        <div
          className={[
            "min-h-0 transition-opacity duration-[600ms] ease-out-expo",
            fadeNearEdgeDelay,
            hideExtras ? "opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <h1
            className={[
              "m-0 pb-6 text-center font-medium",
              "text-[48px] leading-[48px]",
              "text-orchid-ink",
              "font-orchid-display",
            ].join(" ")}
          >
            Hey, Orchid Team!
          </h1>
        </div>
      </div>

      <div className="relative z-10">
        {/* Composer */}
        <div
          data-orchid-flip="prompt-composer"
          className="bg-surface-subtle p-0.5 hover:ring-bg-surface-strong ease-out-expo w-full overflow-hidden rounded-[14px] transition-shadow duration-500 hover:ring-2"
        >
          <div
            className={[
              "grid overflow-hidden transition-all duration-500 ease-out",
              isThinking ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            ].join(" ")}
          >
            <div className="min-h-0">
              <div className="px-2 py-1 overflow-visible">
                <div className="flex items-center justify-between gap-2">
                  <div className="not-prose text-copy w-full flex-1 px-1">
                    <div className="px-1.5 py-1">
                      <div aria-live="polite" className="flex items-center gap-2">
                        <div className="bg-ai animate-pulse-size size-2 rounded-full" aria-hidden="true" />
                        <span className="text-copy text-orchid-muted text-sm leading-[21px]">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="group/button focus-visible:ring-neutral-strong relative inline-flex cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2 h-7 px-1.5 shrink-0"
                    onClick={() => chat.stop()}
                  >
                    <div className="absolute rounded-lg border transition-transform border-transparent bg-surface-strong opacity-0 group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0 inset-2 blur-sm group-active/button:inset-shadow-xs group-active/button:shadow-none" />
                    <div className="text-copy relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                      <div className="text-copy px-0.5 leading-0 transition-transform">Cancel</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="rounded-orchid-prompt-inner bg-white shadow-orchid-prompt">
            <div className="pl-[6px]">
              <div className="flex items-center pr-2">
                <div
                  className="relative flex-1 cursor-text pl-[6px]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    composerRef.current?.focus();
                  }}
                >
                  <div
                    ref={inputAnchorRef}
                    className="relative w-full"
                  >
                    <div
                      ref={composerRef}
                      contentEditable
                      suppressContentEditableWarning
                      aria-label="Ask anything..."
                      className={[
                        "min-h-10 w-full bg-transparent p-2",
                        "max-h-40 overflow-y-auto hide-scrollbar",
                        "text-sm leading-[21px] text-orchid-ink",
                        "whitespace-pre-wrap break-words",
                        "outline-none",
                      ].join(" ")}
                      onInput={() => syncFromComposer()}
                      onSelect={() => syncFromComposer()}
                      onClick={() => syncFromComposer()}
                      onKeyDown={(e) => {
                        if (isAtDropdownOpen) {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            if (atContext) setDismissedAtIndex(atContext.atIndex);
                            return;
                          }

                          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                            e.preventDefault();
                            const count = filteredConnections.length;
                            if (count <= 0) return;
                            setActiveConnectionIndex((prev) => {
                              if (e.key === "ArrowDown") return (prev + 1) % count;
                              return (prev - 1 + count) % count;
                            });
                            return;
                          }

                          if (e.key === "Enter" || e.key === "Tab") {
                            const item = filteredConnections[activeConnectionIndex];
                            if (item) {
                              e.preventDefault();
                              insertConnection(item);
                              return;
                            }
                          }
                        }

                        // Newline behavior:
                        // - Home/chat: Enter sends, Shift+Enter inserts a newline.
                        // - Comment mode: Enter sends, Shift+Enter inserts a newline.
                        if (e.key === "Enter") {
                          // Let the browser handle Shift+Enter newline insertion for contentEditable.
                          // (Our manual "\n" insertion was flaky on first press in some browsers.)
                          if (e.shiftKey) {
                            requestAnimationFrame(() => syncFromComposer());
                            return;
                          }
                          if (canSendComment && !e.shiftKey) {
                            e.preventDefault();
                            sendComment();
                            return;
                          }

                          if (canSendChatMessage && !e.shiftKey) {
                            // While the AI is generating, prevent Enter from sending another message.
                            if (isThinking || chat.status !== "ready") {
                              e.preventDefault();
                              return;
                            }
                            e.preventDefault();
                            sendChatMessage();
                            return;
                          }

                          // Fallback: allow default Enter behavior and sync after.
                          requestAnimationFrame(() => syncFromComposer());
                        }
                      }}
                      onKeyUp={() => syncFromComposer()}
                    />

                    {isAtDropdownOpen && (
                      <Autocomplete.Root
                        // We only use Base UI to render the dropdown + semantics, while the textarea
                        // remains the source of truth for typed text.
                        open
                        items={filteredConnections}
                        value={atContext?.query ?? ""}
                        onOpenChange={() => {}}
                        autoHighlight="always"
                      >
                        <Autocomplete.Portal>
                          <Autocomplete.Positioner
                            side={dropdownSide}
                            align="start"
                            sideOffset={6}
                            anchor={inputAnchorRef}
                            className="z-80"
                          >
                            <Autocomplete.Popup
                              // Keep focus in the textarea so the user can continue typing after `@`.
                              // We handle keyboard navigation/selection from the textarea itself.
                              initialFocus={false}
                              finalFocus={false}
                              className="group outline-none"
                            >
                              <div className={menuPanelClassName()}>
                                {filteredConnections.length === 0 ? (
                                  <Autocomplete.Empty className="px-2 py-1.5 text-sm leading-[21px] text-orchid-muted">
                                    No connections found.
                                  </Autocomplete.Empty>
                                ) : null}

                                <Autocomplete.List className="flex max-h-60 flex-col gap-0.5 overflow-auto outline-none select-none [--lh:1lh]">
                                  {(item: ConnectionItem, index: number) => (
                                    <Autocomplete.Item
                                      key={item.id}
                                      value={item}
                                      className="group/zhover outline-none"
                                      data-highlighted={index === activeConnectionIndex ? "" : undefined}
                                      onMouseDown={(ev) => {
                                        // Keep the textarea focused (so the cursor position is stable).
                                        ev.preventDefault();
                                      }}
                                      onClick={() => insertConnection(item)}
                                    >
                                      <div className="text-copy text-sm leading-[21px] group/zhover relative z-0 flex items-center outline-none">
                                        <div aria-hidden="true" className={menuItemBgClassName()} />
                                        <div className="relative z-2 flex w-full items-center gap-2 cursor-pointer px-2 py-1.5 transition-colors">
                                          <div className="flex flex-1 items-center gap-2">
                                            <span className="text-orchid-muted flex size-4 items-center justify-center">
                                              {item.icon}
                                            </span>
                                            <span className="max-w-[300px] flex-1 truncate text-orchid-ink">
                                              {item.label}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </Autocomplete.Item>
                                  )}
                                </Autocomplete.List>
                              </div>
                            </Autocomplete.Popup>
                          </Autocomplete.Positioner>
                        </Autocomplete.Portal>
                      </Autocomplete.Root>
                    )}

                    {/* Placeholder */}
                    <div
                      className={[
                        "pointer-events-none absolute left-2 top-2",
                        "h-[21px] w-auto overflow-hidden whitespace-nowrap",
                        "text-sm leading-[21px] text-orchid-placeholder",
                        !isEmpty ? "opacity-0" : "opacity-100",
                      ].join(" ")}
                    >
                      {canSendComment ? "Add a comment…" : "Ask anything..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-rows-[0px] overflow-hidden transition-[transform,translate,scale,rotate] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]" />
            <div className="flex-1 overflow-auto" />
          </div>

          <input
            ref={fileInputRef}
            multiple
            type="file"
            className="hidden"
            onChange={(e) => void handleFilesSelected(e.currentTarget.files)}
          />

          {/* Actions */}
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="group/button relative inline-flex h-7 flex-none cursor-pointer items-center rounded-orchid-pill px-1.5 py-0 whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2 focus-visible:ring-orchid-ink"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-2 rounded-orchid-pill border border-transparent bg-orchid-surface-2 opacity-0 blur-sm transition-transform group-hover/button:inset-0 group-hover/button:opacity-100 group-hover/button:blur-none group-active/button:inset-shadow-xs group-active/button:shadow-none" />
                <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 fill-orchid-muted transition-transform group-hover/button:fill-orchid-ink"
                  >
                    <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                  </svg>
                  <span className="px-[2px]">Add files</span>
                </div>
              </button>

              <button
                type="button"
                disabled
                className="relative inline-flex h-7 flex-none items-center rounded-orchid-pill px-1.5 py-0 opacity-50"
              >
                <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 fill-orchid-muted"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.89 4.111a5.5 5.5 0 1 0 0 7.778.75.75 0 1 1 1.06 1.061A7 7 0 1 1 15 8a2.5 2.5 0 0 1-4.083 1.935A3.5 3.5 0 1 1 11.5 8a1 1 0 0 0 2 0 5.48 5.48 0 0 0-1.61-3.889ZM10 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="px-[2px]">Add context</span>
                  <span className="pointer-events-none inline-flex items-center pr-2">
                    <StripeIcon className="h-4 w-4 overflow-hidden rounded-[6px] shadow-[0_0_0_2px_var(--color-orchid-surface)]" />
                    <GitHubIcon className="-ml-2 h-4 w-4 overflow-hidden rounded-[6px] shadow-[0_0_0_2px_var(--color-orchid-surface)]" />
                    <LinearIcon className="-ml-2 h-4 w-4 overflow-hidden rounded-[6px] shadow-[0_0_0_2px_var(--color-orchid-surface)]" />
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  (!canSendComment && !canSendChatMessage) ||
                  ((isEmpty && pendingFiles.length === 0) || isUploadingFiles || chat.status !== "ready")
                }
                className={[
                  (!canSendComment && !canSendChatMessage) ||
                  (isEmpty && pendingFiles.length === 0) ||
                  isUploadingFiles ||
                  chat.status !== "ready"
                    ? "relative inline-flex h-7 flex-none cursor-not-allowed items-center rounded-orchid-pill px-1.5 py-0 opacity-50"
                    : "group/button focus-visible:ring-neutral-strong relative inline-flex h-7 flex-none cursor-pointer items-center rounded-orchid-pill px-1.5 py-0 whitespace-nowrap outline-none transition-transform select-none focus-visible:ring-2",
                ].join(" ")}
                onClick={() => {
                  if (canSendComment) {
                    sendComment();
                    return;
                  }
                  if (canSendChatMessage) {
                    sendChatMessage();
                  }
                }}
              >
                {!isEmpty && (
                  <div className="absolute inset-0 rounded-orchid-pill border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs transition-transform group-hover/button:to-surface-weak group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle" />
                )}
                <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                  <span className="px-[2px]">
                    {isUploadingFiles
                      ? "Uploading…"
                      : canSendComment
                        ? "Comment"
                        : "Go"}
                  </span>
                  <span className="hidden h-4 items-center rounded border border-neutral bg-surface-weak px-1 text-[12px] leading-[17.6px] text-orchid-placeholder shadow-xs md:inline-flex">
                    ↵
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending uploads */}
      {pendingFiles.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {pendingFiles.map((f, i) => (
            <button
              key={`${f.url}-${i}`}
              type="button"
              className="rounded-orchid-pill border border-neutral bg-surface px-2 py-1 text-xs text-orchid-muted hover:text-orchid-ink"
              onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
              title="Remove attachment"
            >
              {f.filename ?? "attachment"} <span className="ml-1 opacity-70">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        aria-hidden={hideExtras}
        className={[
          "grid overflow-hidden transition-[grid-template-rows] duration-[600ms] ease-out-expo",
          collapseNearBottomDelay,
          hideExtras ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        ].join(" ")}
      >
        {/* Suggestions */}
        <div
          className={[
            "min-h-0 transition-opacity duration-[600ms] ease-out-expo",
            fadeNearEdgeDelay,
            hideExtras ? "opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((label) => (
              <button
                key={label}
                type="button"
                className={[
                  "group/button focus-visible:ring-neutral-strong",
                  "relative inline-flex h-7 flex-none cursor-pointer items-center rounded-orchid-pill px-1.5",
                  "whitespace-nowrap outline-none transition-transform select-none focus-visible:ring-2",
                ].join(" ")}
                onClick={() => {
                  const root = composerRef.current;
                  if (!root) return;
                  setComposerPlainText(root, label);
                  setDismissedAtIndex(null);
                  setActiveConnectionIndex(0);
                  root.focus();
                  requestAnimationFrame(() => syncFromComposer());
                }}
              >
                <div
                  className={[
                    "absolute inset-0 rounded-orchid-pill border !border-neutral !border-[1px] shadow-xs transition-transform",
                    "bg-gradient-to-t from-surface to-surface",
                    "group-hover/button:to-surface-weak",
                    "group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle",
                  ].join(" ")}
                />
                <div className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                  <span className="px-[2px]">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
