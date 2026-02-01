"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { PaperclipIcon } from "@/app/components/icons/paperclip-icon";
import { TrashIcon } from "@/app/components/icons/trash-icon";
import { Keycap } from "@/app/components/issue-detail/keycap";
import { issueMessages } from "@/app/collections/issueMessages";
import { issues, type Issue } from "@/app/collections/issues";
import { getAnonymousIdentity } from "@/app/lib/replicate/anonymousIdentity";
import { uploadToUploadsRoute } from "@/app/lib/uploads";
import { $createMediaNode, MEDIA_MARKDOWN_TRANSFORMER, MediaNode } from "./lexical-media";
import { Dialog } from "@base-ui/react/dialog";
import type { LexicalEditor, LexicalNode } from "lexical";
import { MenuDropdown } from "@/app/components/menu-dropdown";
import { AvatarMarble } from "@/app/components/avatar-marble";
import { api } from "@/convex/_generated/api";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode, $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import { TRANSFORMERS, $convertToMarkdownString } from "@lexical/markdown";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";

const COMPOSER_TRANSFORMERS = [...TRANSFORMERS, MEDIA_MARKDOWN_TRANSFORMER];

function hoverActionButtonClass() {
  return [
    "group/button focus-visible:ring-neutral-strong",
    "relative inline-flex shrink-0 cursor-pointer",
    "rounded-lg whitespace-nowrap outline-none transition-transform select-none",
    "focus-visible:ring-2",
    "h-7 px-1.5",
  ].join(" ");
}

function hoverActionButtonBgClass() {
  return [
    "absolute rounded-lg border transition-transform",
    "border-transparent bg-surface-strong opacity-0",
    "inset-2 blur-sm",
    "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0",
    "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
  ].join(" ");
}

function sendButtonBgClass() {
  // Match the hover/active treatment of the draft section "Open" pill.
  return [
    "absolute inset-0 rounded-lg border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs",
    "transition-transform",
    "group-hover/button:to-surface-weak",
    "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
    "group-active/button:to-surface-subtle",
  ].join(" ");
}

function findMatchingParent(
  startNode: LexicalNode | null,
  predicate: (node: LexicalNode) => boolean,
): LexicalNode | null {
  let node: LexicalNode | null = startNode;
  while (node) {
    if (predicate(node)) return node;
    node = node.getParent();
  }
  return null;
}

function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditor | null> }) {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    editorRef.current = editor;
    return () => {
      if (editorRef.current === editor) {
        editorRef.current = null;
      }
    };
  }, [editor, editorRef]);
  return null;
}

function SendOnCtrlEnterPlugin({ onSend }: { onSend: () => void }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (e) => {
        if (e.key !== "Enter") return false;
        if (!(e.ctrlKey || e.metaKey)) return false;
        e.preventDefault();
        onSend();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onSend]);

  return null;
}

function ComposerToolbar({
  issueId,
  uploading,
  setUploading,
  setUploadError,
  onFileInputEl,
}: {
  issueId: string;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  setUploadError: (v: string | null) => void;
  onFileInputEl: (el: HTMLInputElement | null) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<
    "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  >("paragraph");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [fileInputEl, _setFileInputEl] = useState<HTMLInputElement | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogMode, setLinkDialogMode] = useState<"noSelection" | "withSelection">(
    "noSelection",
  );
  const [linkUrl, setLinkUrl] = useState("");
  const linkUrlInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        let element: LexicalNode = anchorNode;
        if (typeof anchorNode.getTopLevelElementOrThrow === "function") {
          try {
            element = anchorNode.getTopLevelElementOrThrow();
          } catch {
            // Lexical can throw here when selection is at the root; treat as paragraph.
            element = anchorNode;
          }
        }

        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          if (
            tag === "h1" ||
            tag === "h2" ||
            tag === "h3" ||
            tag === "h4" ||
            tag === "h5" ||
            tag === "h6"
          ) {
            setBlockType(tag);
            return;
          }
        }

        setBlockType("paragraph");
      });
    });
  }, [editor]);

  React.useEffect(() => {
    // HistoryPlugin registers the commands, we just subscribe.
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  React.useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  const blockLabel = useMemo(() => {
    switch (blockType) {
      case "h1":
        return "Heading 1";
      case "h2":
        return "Heading 2";
      case "h3":
        return "Heading 3";
      case "h4":
        return "Heading 4";
      case "h5":
        return "Heading 5";
      case "h6":
        return "Heading 6";
      default:
        return "Normal";
    }
  }, [blockType]);

  const setHeading = useCallback(
    (next: "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        if (next === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(next));
        }
      });
      editor.focus();
    },
    [editor],
  );

  const headingItems = useMemo(
    () =>
      [
        { value: "paragraph" as const, label: "Normal" },
        { value: "h1" as const, label: "Heading 1" },
        { value: "h2" as const, label: "Heading 2" },
        { value: "h3" as const, label: "Heading 3" },
        { value: "h4" as const, label: "Heading 4" },
        { value: "h5" as const, label: "Heading 5" },
        { value: "h6" as const, label: "Heading 6" },
      ] as const,
    [],
  );

  const toggleList = useCallback(
    (kind: "unordered" | "ordered") => {
      let isSameListType = false;
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const anchorNode = selection.anchor.getNode();
        const listParent = findMatchingParent(anchorNode, (n) => n instanceof ListNode);
        if (!(listParent instanceof ListNode)) return;
        const listType = listParent.getListType?.();
        isSameListType =
          (kind === "unordered" && listType === "bullet") ||
          (kind === "ordered" && listType === "number");
      });

      if (isSameListType) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(
          kind === "unordered" ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
          undefined,
        );
      }
      editor.focus();
    },
    [editor],
  );

  const applyLink = useCallback(() => {
    let url = linkUrl.trim();
    if (url.length === 0) return;

    let hasSelection = false;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      hasSelection = $isRangeSelection(selection) && !selection.isCollapsed();
    });

    if (!hasSelection) {
      setLinkDialogMode("noSelection");
      return;
    }

    // Accept "orchid.ai" style links by defaulting to https:// when needed.
    if (
      !url.includes("://") &&
      !url.startsWith("mailto:") &&
      !url.startsWith("tel:") &&
      !url.startsWith("#") &&
      !url.startsWith("/") &&
      !url.startsWith("?") &&
      !url.startsWith(".")
    ) {
      url = `https://${url}`;
    }

    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    setLinkDialogOpen(false);
    setLinkUrl("");
    // Give the dialog a moment to close before returning focus.
    window.setTimeout(() => editor.focus(), 0);
  }, [editor, linkUrl]);

  const toggleLink = useCallback(() => {
    let isInsideLink = false;
    let hasSelectedText = false;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      const linkParent = findMatchingParent(anchorNode, (n) => n instanceof LinkNode);
      isInsideLink = linkParent instanceof LinkNode;
      hasSelectedText = !selection.isCollapsed() && selection.getTextContent().trim().length > 0;
    });

    if (isInsideLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      editor.focus();
      return;
    }

    if (!hasSelectedText) {
      setLinkDialogMode("noSelection");
      setLinkDialogOpen(true);
      return;
    }

    setLinkUrl("");
    setLinkDialogMode("withSelection");
    setLinkDialogOpen(true);
  }, [editor]);

  const setFileInputEl = useCallback(
    (el: HTMLInputElement | null) => {
      _setFileInputEl(el);
      onFileInputEl(el);
    },
    [onFileInputEl],
  );

  const onPickFilesClick = useCallback(() => {
    if (uploading) return;
    fileInputEl?.click();
  }, [fileInputEl, uploading]);

  const onFilesChosen = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      if (uploading) return;

      const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB
      const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

      for (const file of files) {
        if (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
          window.alert(`"${file.name}" is too large (max 20MB for images).`);
          return;
        }
        if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
          window.alert(`"${file.name}" is too large (max 100MB for videos).`);
          return;
        }
      }

      setUploadError(null);
      setUploading(true);
      try {
        const prefix = `issues/${issueId}/replies/`;
        const uploaded = await Promise.all(
          files.map(async (file) => {
            const result = await uploadToUploadsRoute({ file, prefix });
            if (!result.publicUrl) {
              throw new Error(
                'Upload succeeded but publicUrl is not configured. Set R2_PUBLIC_BASE_URL or NEXT_PUBLIC_R2_PUBLIC_BASE_URL.',
              );
            }
            return { file, url: result.publicUrl };
          }),
        );

        editor.update(() => {
          const selection = $getSelection();
          const nodes = uploaded.map(({ file, url }) => {
            const kind = file.type.startsWith("video/") ? "video" : "image";
            return $createMediaNode(url, file.name, kind);
          });

          if ($isRangeSelection(selection)) {
            selection.insertNodes(nodes);
          } else {
            const root = $getRoot();
            for (const node of nodes) {
              root.append($createParagraphNode().append(node));
            }
          }
        });
        editor.focus();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setUploadError(message);
        window.alert(message);
      } finally {
        setUploading(false);
      }
    },
    [editor, issueId, setUploadError, setUploading, uploading],
  );

  return (
    <>
      <div className="flex items-center gap-1 p-3">
        <MenuDropdown
          value={blockType}
          items={headingItems}
          onChangeAction={setHeading}
          triggerClassName={[hoverActionButtonClass(), "shrink-0"].join(" ")}
          trigger={
            <>
              <div aria-hidden="true" className={hoverActionButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                <div className="px-0.5 leading-none transition-transform">
                  <span className="flex w-24 items-center gap-1 truncate">
                    <span className="text-sm">{blockLabel}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                      className="size-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </>
          }
        />

        <div
          data-orientation="vertical"
          role="separator"
          aria-orientation="vertical"
          className="border-neutral h-[18px] w-px border-r"
        />

        {[
          {
            key: "bold",
            path: "M3 3a1 1 0 0 1 1-1h5a3.5 3.5 0 0 1 2.843 5.541A3.75 3.75 0 0 1 9.25 14H4a1 1 0 0 1-1-1V3Zm2.5 3.5v-2H9a1 1 0 0 1 0 2H5.5Zm0 2.5v2.5h3.75a1.25 1.25 0 1 0 0-2.5H5.5Z",
            onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"),
          },
          {
            key: "italic",
            path: "M6.25 2.75A.75.75 0 0 1 7 2h6a.75.75 0 0 1 0 1.5h-2.483l-3.429 9H9A.75.75 0 0 1 9 14H3a.75.75 0 0 1 0-1.5h2.483l3.429-9H7a.75.75 0 0 1-.75-.75Z",
            onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"),
          },
          {
            key: "underline",
            path: "M4.75 2a.75.75 0 0 1 .75.75V7a2.5 2.5 0 0 0 5 0V2.75a.75.75 0 0 1 1.5 0V7a4 4 0 0 1-8 0V2.75A.75.75 0 0 1 4.75 2ZM2 13.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z",
            onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline"),
          },
          {
            key: "strike",
            path: "M9.165 3.654c-.95-.255-1.921-.273-2.693-.042-.769.231-1.087.624-1.173.947-.087.323-.008.822.543 1.407.389.412.927.77 1.55 1.034H13a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 3 7h1.756l-.006-.006c-.787-.835-1.161-1.849-.9-2.823.26-.975 1.092-1.666 2.191-1.995 1.097-.33 2.36-.28 3.512.029.75.2 1.478.518 2.11.939a.75.75 0 0 1-.833 1.248 5.682 5.682 0 0 0-1.665-.738Zm2.074 6.365a.75.75 0 0 1 .91.543 2.44 2.44 0 0 1-.35 2.024c-.405.585-1.052 1.003-1.84 1.24-1.098.329-2.36.279-3.512-.03-1.152-.308-2.27-.897-3.056-1.73a.75.75 0 0 1 1.092-1.029c.552.586 1.403 1.056 2.352 1.31.95.255 1.92.273 2.692.042.55-.165.873-.417 1.038-.656a.942.942 0 0 0 .13-.803.75.75 0 0 1 .544-.91Z",
            onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough"),
          },
        ].map((b) => (
          <button
            key={b.key}
            type="button"
            aria-label={b.key}
            className={[
              "group/button focus-visible:ring-neutral-strong",
              "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
              "size-7 min-w-7 min-h-7",
            ].join(" ")}
            onClick={() => {
              b.onClick();
              editor.focus();
            }}
          >
            <div aria-hidden="true" className={hoverActionButtonBgClass()} />
            <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
                data-slot="icon"
                className="size-4 transition-transform"
              >
                <path fillRule="evenodd" d={b.path} clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ))}

        <div
          data-orientation="vertical"
          role="separator"
          aria-orientation="vertical"
          className="border-neutral h-[18px] w-px border-r"
        />

        {[
          {
            key: "list",
            path: "M3 4.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM6.25 3a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 7.25a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 11.5a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM4 12.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM3 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
            onClick: () => toggleList("unordered"),
          },
          {
            key: "ordered",
            path: "M2.995 1a.625.625 0 1 0 0 1.25h.38v2.125a.625.625 0 1 0 1.25 0v-2.75A.625.625 0 0 0 4 1H2.995ZM3.208 7.385a2.37 2.37 0 0 1 1.027-.124L2.573 8.923a.625.625 0 0 0 .439 1.067l1.987.011a.625.625 0 0 0 .006-1.25l-.49-.003.777-.776c.215-.215.335-.506.335-.809 0-.465-.297-.957-.842-1.078a3.636 3.636 0 0 0-1.993.121.625.625 0 1 0 .416 1.179ZM2.625 11a.625.625 0 1 0 0 1.25H4.25a.125.125 0 0 1 0 .25H3.5a.625.625 0 1 0 0 1.25h.75a.125.125 0 0 1 0 .25H2.625a.625.625 0 1 0 0 1.25H4.25a1.375 1.375 0 0 0 1.153-2.125A1.375 1.375 0 0 0 4.25 11H2.625ZM7.25 2a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM7.25 7.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM6.5 13.25a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Z",
            onClick: () => toggleList("ordered"),
          },
        ].map((b) => (
          <button
            key={b.key}
            type="button"
            aria-label={b.key}
            className={[
              "group/button focus-visible:ring-neutral-strong",
              "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
              "size-7 min-w-7 min-h-7",
            ].join(" ")}
            onClick={b.onClick}
          >
            <div aria-hidden="true" className={hoverActionButtonBgClass()} />
            <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
                data-slot="icon"
                className="size-4 transition-transform"
              >
                <path d={b.path} />
              </svg>
            </div>
          </button>
        ))}

        <div
          data-orientation="vertical"
          role="separator"
          aria-orientation="vertical"
          className="border-neutral h-[18px] w-px border-r"
        />

        <button
          type="button"
          aria-label="upload media"
          disabled={uploading}
          className={[
            "group/button focus-visible:ring-neutral-strong",
            "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
            "size-7 min-w-7 min-h-7",
            uploading ? "pointer-events-none cursor-not-allowed opacity-50" : "",
          ].join(" ")}
          onClick={onPickFilesClick}
        >
          <div aria-hidden="true" className={hoverActionButtonBgClass()} />
          <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
              data-slot="icon"
              className="size-4 transition-transform"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm10.5 5.707a.5.5 0 0 0-.146-.353l-1-1a.5.5 0 0 0-.708 0L9.354 9.646a.5.5 0 0 1-.708 0L6.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0-.146.353V12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.707ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
              />
            </svg>
          </div>
        </button>

        <button
          type="button"
          aria-label="link"
          className={[
            "group/button focus-visible:ring-neutral-strong",
            "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
            "size-7 min-w-7 min-h-7",
          ].join(" ")}
          onClick={toggleLink}
        >
          <div aria-hidden="true" className={hoverActionButtonBgClass()} />
          <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
              data-slot="icon"
              className="size-4 transition-transform"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.914 6.025a.75.75 0 0 1 1.06 0 3.5 3.5 0 0 1 0 4.95l-2 2a3.5 3.5 0 0 1-5.396-4.402.75.75 0 0 1 1.251.827 2 2 0 0 0 3.085 2.514l2-2a2 2 0 0 0 0-2.828.75.75 0 0 1 0-1.06Z"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.086 9.975a.75.75 0 0 1-1.06 0 3.5 3.5 0 0 1 0-4.95l2-2a3.5 3.5 0 0 1 5.396 4.402.75.75 0 0 1-1.251-.827 2 2 0 0 0-3.085-2.514l-2 2a2 2 0 0 0 0 2.828.75.75 0 0 1 0 1.06Z"
              />
            </svg>
          </div>
        </button>

        <div
          data-orientation="vertical"
          role="separator"
          aria-orientation="vertical"
          className="border-neutral h-[18px] w-px border-r"
        />

        {[
          {
            key: "undo",
            path: "M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z",
            disabled: !canUndo,
            onClick: () => editor.dispatchCommand(UNDO_COMMAND, undefined),
          },
          {
            key: "redo",
            path: "M3.5 9.75A2.75 2.75 0 0 1 6.25 7h5.19L9.22 9.22a.75.75 0 1 0 1.06 1.06l3.5-3.5a.75.75 0 0 0 0-1.06l-3.5-3.5a.75.75 0 1 0-1.06 1.06l2.22 2.22H6.25a4.25 4.25 0 0 0 0 8.5h1a.75.75 0 0 0 0-1.5h-1A2.75 2.75 0 0 1 3.5 9.75Z",
            disabled: !canRedo,
            onClick: () => editor.dispatchCommand(REDO_COMMAND, undefined),
          },
        ].map((b) => (
          <button
            key={b.key}
            type="button"
            aria-label={b.key}
            disabled={b.disabled}
            className={[
              "group/button focus-visible:ring-neutral-strong",
              "relative inline-flex shrink-0 rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
              b.disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "cursor-pointer",
              "size-7 min-w-7 min-h-7",
            ].join(" ")}
            onClick={() => {
              if (b.disabled) return;
              b.onClick();
              editor.focus();
            }}
          >
            {!b.disabled ? <div aria-hidden="true" className={hoverActionButtonBgClass()} /> : null}
            <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
                data-slot="icon"
                className="size-4 transition-transform"
              >
                <path fillRule="evenodd" d={b.path} clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ))}

        {/* Hidden image input */}
        <input
          ref={setFileInputEl}
          accept="image/*,video/*"
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? []);
            e.currentTarget.value = "";
            if (files.length === 0) return;
            void onFilesChosen(files);
          }}
        />
      </div>

      <Dialog.Root
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) {
            setLinkUrl("");
            window.setTimeout(() => editor.focus(), 0);
          }
        }}
        modal="trap-focus"
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-[100] grid place-items-center p-4">
            <Dialog.Popup
              className={[
                "font-orchid-ui leading-6",
                "w-[min(360px,calc(100vw-32px))]",
                "rounded-xl border border-neutral bg-surface outline-none",
                "shadow-[0_1px_1px_0_rgb(0_0_0_/0.02),0_4px_8px_-4px_rgb(0_0_0_/0.04),0_16px_24px_-8px_rgb(0_0_0_/0.06)]",
                "relative overflow-hidden p-6",
              ].join(" ")}
              initialFocus={linkDialogMode === "withSelection" ? linkUrlInputRef : true}
              finalFocus={false}
            >
              <Dialog.Close
                aria-label="Close"
                className={[
                  "group/button focus-visible:ring-neutral-strong",
                  "absolute right-4 top-4 inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap",
                  "transition-transform outline-none select-none focus-visible:ring-2",
                  "size-7 min-w-7 min-h-7",
                ].join(" ")}
              >
                <div aria-hidden="true" className={hoverActionButtonBgClass()} />
                <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    data-slot="icon"
                    className="size-4 transition-transform"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
                    />
                  </svg>
                </div>
              </Dialog.Close>

              <Dialog.Title className="mb-4 text-sm font-semibold leading-[21px] text-orchid-ink">
                Add Link
              </Dialog.Title>

              {linkDialogMode === "noSelection" ? (
                <>
                  <Dialog.Description className="text-sm leading-[21px] text-orchid-muted">
                    Please select text first to create a link.
                  </Dialog.Description>

                  <div className="mt-4 flex justify-end gap-2">
                    <Dialog.Close
                      className={[
                        "group/button focus-visible:ring-neutral-strong",
                        "relative inline-flex shrink-0 cursor-pointer whitespace-nowrap",
                        "rounded-lg transition-transform outline-none select-none focus-visible:ring-2",
                        "h-7 px-3",
                      ].join(" ")}
                    >
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-lg border border-transparent bg-surface-weak transition-transform"
                      />
                      <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                        <div className="px-0.5 leading-none transition-transform">OK</div>
                      </div>
                    </Dialog.Close>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyLink();
                  }}
                >
                  <div className="mb-4">
                    <label className="mb-2 block text-[12px] font-medium leading-[17.6px] text-orchid-ink">
                      URL
                    </label>
                    <input
                      ref={linkUrlInputRef}
                      className={[
                        "w-full rounded-lg border border-neutral bg-surface px-3 py-2",
                        "text-sm leading-[21px] text-orchid-ink",
                        "outline-none focus-visible:ring-2 focus-visible:ring-neutral-strong",
                        "transition-colors duration-150 ease-in-out",
                      ].join(" ")}
                      placeholder="orchid.ai or https://example.com"
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Dialog.Close
                      className={[
                        "group/button focus-visible:ring-neutral-strong",
                        "relative inline-flex shrink-0 cursor-pointer whitespace-nowrap",
                        "rounded-lg transition-transform outline-none select-none focus-visible:ring-2",
                        "h-7 px-3",
                      ].join(" ")}
                    >
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-lg border border-transparent bg-surface-weak transition-transform"
                      />
                      <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                        <div className="px-0.5 leading-none transition-transform">Cancel</div>
                      </div>
                    </Dialog.Close>

                    <button
                      type="submit"
                      disabled={linkUrl.trim().length === 0}
                      className={[
                        "group/button focus-visible:ring-neutral-strong",
                        "relative inline-flex shrink-0 whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                        linkUrl.trim().length === 0
                          ? "pointer-events-none cursor-not-allowed opacity-50"
                          : "cursor-pointer",
                        "h-7 px-3 rounded-lg",
                        linkUrl.trim().length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      ].join(" ")}
                    >
                      <div aria-hidden="true" className={sendButtonBgClass()} />
                      <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                        <div className="px-0.5 leading-none transition-transform">Apply</div>
                      </div>
                    </button>
                  </div>
                </form>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export function IssueReplyComposer({
  open,
  issueId,
  replyTo,
  onCloseAction,
}: {
  open: boolean;
  issueId: string;
  replyTo?: { name: string; avatarId?: string } | null;
  onCloseAction?: () => void;
}) {
  const enqueueIssueMessageSync = useMutation(api.githubIssueMessages.enqueueIssueMessageSync);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const editorRef = useRef<LexicalEditor | null>(null);
  const [fileInputEl, setFileInputEl] = useState<HTMLInputElement | null>(null);

  const discardDraft = useCallback(() => {
    if (isUploading) return;

    const editor = editorRef.current;
    if (editor) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });
    }

    setUploadError(null);
    setIsEditorEmpty(true);
    onCloseAction?.();
  }, [isUploading, onCloseAction]);

  const sendReply = useCallback(() => {
    if (isUploading) return;
    const editor = editorRef.current;
    if (!editor) return;

    let markdown = "";
    editor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(COMPOSER_TRANSFORMERS);
    });

    const body = markdown.trim();
    if (body.length === 0) return;

    const now = Date.now();
    const author = getAnonymousIdentity();

    const messages = issueMessages.get();
    const messageId = globalThis.crypto?.randomUUID?.() ?? `${now}`;
    messages.insert({
      id: messageId,
      issueId,
      type: "reply",
      body,
      createdAt: now,
      author: {
        name: author.name ?? "Anonymous",
        color: author.color ?? "#6366f1",
      },
    });
    try {
      void enqueueIssueMessageSync({ issueMessageId: messageId });
    } catch {
      // Keep local-first UX; GitHub sync is best-effort.
    }

    const issueCollection = issues.get();
    issueCollection.update(issueId, (draft: Issue) => {
      draft.updatedAt = now;
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      root.append($createParagraphNode());
    });
    editor.focus();
    setIsEditorEmpty(true);
    onCloseAction?.();
  }, [enqueueIssueMessageSync, isUploading, issueId, onCloseAction]);

  const initialConfig = useMemo(
    () => ({
      namespace: `issue-reply:${issueId}`,
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, MediaNode],
      onError: (e: Error) => {
        throw e;
      },
      theme: {
        paragraph: "",
        heading: {
          h1: "text-[18px] leading-[26px] font-semibold",
          h2: "text-[16px] leading-[24px] font-semibold",
          h3: "text-[14px] leading-[22px] font-semibold",
          h4: "text-[13px] leading-[20px] font-semibold",
          h5: "text-[12px] leading-[18px] font-semibold",
          h6: "text-[12px] leading-[18px] font-semibold",
        },
        list: {
          ul: "list-disc pl-6",
          ol: "list-decimal pl-6",
          listitem: "my-0.5",
        },
        link: "underline",
        quote: "border-l-2 border-neutral pl-3 text-orchid-muted",
        code: "font-mono text-[12px] leading-[18px]",
      },
    }),
    [issueId],
  );

  const replyToInitial = useMemo(() => {
    const name = replyTo?.name ?? "";
    return (name.trim()?.[0] ?? "A").toUpperCase();
  }, [replyTo?.name]);

  if (!open) return null;

  return (
    <div
      className={[
        "relative bg-surface-subtle p-0.5 ease-out-expo w-full overflow-hidden outline-none",
        "rounded-[14px] transition-none",
      ].join(" ")}
      data-issue-id={issueId}
    >
      {/* Draft preview + actions (sits "behind" the editor card) */}
      <div className="relative z-0 pointer-events-none rounded-xl">
        <div className="flex cursor-pointer items-center justify-between gap-2 p-2 pb-5">
          <div className="pointer-events-auto">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded="false"
              className={[hoverActionButtonClass(), "shrink-0"].join(" ")}
            >
              <div aria-hidden="true" className={hoverActionButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="size-4 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="px-0.5 leading-none transition-transform">
                  Reply
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="size-4 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer pointer-events-auto">
            <div className="flex min-w-0 items-center space-x-1">
              <div className="bg-surface-strong hover:bg-surface flex items-center rounded-full p-1 whitespace-nowrap transition-[translate,opacity,background] translate-y-0 opacity-100">
                <div>
                  <p className="px-1 text-sm leading-[21px] text-orchid-ink">
                    <span className="inline-flex items-center gap-2">
                      <span className="bg-surface border-neutral text-orchid-ink flex items-center justify-center overflow-hidden border font-semibold rounded-full size-4 min-w-4 min-h-4 text-[10px] leading-[15px]">
                        {replyTo?.avatarId ? (
                          <AvatarMarble
                            size={16}
                            id={replyTo.avatarId}
                            name={replyTo.name}
                            showInitials={false}
                            className="block size-4"
                          />
                        ) : (
                          <span className="grid place-items-center size-4 min-w-4 min-h-4 text-[10px] leading-[15px]">
                            {replyToInitial}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 truncate">{replyTo?.name ?? "Anonymous"}</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor card */}
      <div className="relative z-10 -mt-3 pointer-events-auto">
        <div className="bg-surface border-neutral flex min-h-0 w-full flex-1 flex-col rounded-xl border shadow-md">
          <div className="relative flex min-h-0 w-full flex-1 flex-col">
            <LexicalComposer initialConfig={initialConfig}>
              <EditorRefPlugin editorRef={editorRef} />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <MarkdownShortcutPlugin transformers={COMPOSER_TRANSFORMERS} />

              <ComposerToolbar
                issueId={issueId}
                uploading={isUploading}
                setUploading={setIsUploading}
                setUploadError={setUploadError}
                onFileInputEl={setFileInputEl}
              />

              <SendOnCtrlEnterPlugin onSend={sendReply} />
              <OnChangePlugin
                onChange={(editorState) => {
                  editorState.read(() => {
                    const markdown = $convertToMarkdownString(COMPOSER_TRANSFORMERS).trim();
                    setIsEditorEmpty(markdown.length === 0);
                  });
                }}
              />

              <div className="relative">
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      className={[
                        "z-10 block flex-1 border-0 p-2 relative",
                        "px-[18px] pt-0 pb-5",
                        "h-fit min-h-40 w-full overflow-auto",
                        "bg-transparent outline-none focus:outline-none",
                        "text-sm leading-[21px] text-orchid-ink",
                        "whitespace-pre-wrap break-words",
                      ].join(" ")}
                      aria-label="Start writing your message..."
                      spellCheck
                    />
                  }
                  placeholder={
                    <div
                      aria-hidden="true"
                      className={[
                        "pointer-events-none absolute left-[18px] top-0",
                        "overflow-hidden text-ellipsis select-none whitespace-nowrap",
                        "text-sm leading-[21px] text-orchid-placeholder",
                      ].join(" ")}
                    >
                      Start writing your message...
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </div>
            </LexicalComposer>
          </div>

          <div className="ease-out-expo grid overflow-hidden transition-transform duration-300 grid-rows-[0fr] p-0" />
        </div>
      </div>

      {/* Draft preview + actions (below editor card) */}
      <div className="relative z-0 rounded-xl">
        <div className="flex w-full shrink-0 items-center justify-between gap-2 p-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Attach files"
              className={hoverActionButtonClass()}
              disabled={isUploading}
              onClick={() => {
                if (isUploading) return;
                fileInputEl?.click();
              }}
            >
              <div aria-hidden="true" className={hoverActionButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                <PaperclipIcon />
                <div className="px-0.5 leading-none transition-transform">
                  {isUploading ? "Uploading…" : "Attach files"}
                </div>
              </div>
            </button>
            {uploadError ? (
              <div className="text-[12px] leading-[17.6px] text-red-600 dark:text-red-400">
                {uploadError}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Discard"
              className={[
                hoverActionButtonClass(),
                isUploading ? "pointer-events-none cursor-not-allowed opacity-50" : "",
              ].join(" ")}
              disabled={isUploading}
              onClick={discardDraft}
            >
              <div aria-hidden="true" className={hoverActionButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
                <div className="px-0.5 leading-none transition-transform">
                  Discard
                </div>
                <TrashIcon />
              </div>
            </button>

            <button
              type="button"
              aria-label="Send"
              className={[
                "group/button focus-visible:ring-neutral-strong",
                "relative inline-flex shrink-0 cursor-pointer",
                "rounded-lg whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-2",
                "h-7 px-1.5",
                isEditorEmpty || isUploading ? "opacity-50 pointer-events-none cursor-not-allowed" : "",
              ].join(" ")}
              onClick={() => sendReply()}
            >
              <div aria-hidden="true" className={sendButtonBgClass()} />
              <div className="relative z-10 flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
                <div className="px-0.5 leading-none transition-transform">
                  Send
                </div>
                <Keycap>Ctrl+↵</Keycap>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

