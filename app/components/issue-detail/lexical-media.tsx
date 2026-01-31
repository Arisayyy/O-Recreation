"use client";

import React from "react";
import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  $applyNodeReplacement,
} from "lexical";
import type { TextMatchTransformer } from "@lexical/markdown";

export type MediaKind = "image" | "video";

export type SerializedMediaNode = SerializedLexicalNode & {
  type: "media";
  version: 1;
  src: string;
  alt: string;
  kind: MediaKind;
};

export class MediaNode extends DecoratorNode<React.ReactNode> {
  __src: string;
  __alt: string;
  __kind: MediaKind;

  static getType(): string {
    return "media";
  }

  static clone(node: MediaNode): MediaNode {
    return new MediaNode(node.__src, node.__alt, node.__kind, node.__key);
  }

  constructor(src: string, alt: string, kind: MediaKind, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__kind = kind;
  }

  createDOM(): HTMLElement {
    const dom = document.createElement("span");
    dom.setAttribute("data-lexical-media", this.__kind);
    dom.style.display = "inline-block";
    dom.style.maxWidth = "100%";
    return dom;
  }

  updateDOM(): false {
    return false;
  }

  exportJSON(): SerializedMediaNode {
    return {
      type: "media",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      kind: this.__kind,
    };
  }

  static importJSON(serializedNode: SerializedMediaNode): MediaNode {
    return $createMediaNode(serializedNode.src, serializedNode.alt, serializedNode.kind);
  }

  decorate(): React.ReactNode {
    if (this.__kind === "video") {
      return (
        <video
          controls
          preload="metadata"
          playsInline
          src={this.__src}
          className="my-2 max-w-full rounded-lg"
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={this.__src}
        alt={this.__alt}
        className="my-2 max-w-full rounded-lg"
        loading="lazy"
        decoding="async"
      />
    );
  }

  getSrc(): string {
    return this.__src;
  }
  getAlt(): string {
    return this.__alt;
  }
  getKind(): MediaKind {
    return this.__kind;
  }
}

export function $createMediaNode(src: string, alt: string, kind: MediaKind): MediaNode {
  return $applyNodeReplacement(new MediaNode(src, alt, kind));
}

export function $isMediaNode(node: LexicalNode | null | undefined): node is MediaNode {
  return node instanceof MediaNode;
}

function escapeMarkdownText(value: string): string {
  // Avoid breaking the alt text in markdown.
  return value.replace(/[\[\]]/g, "");
}

export const MEDIA_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  type: "text-match",
  // Match markdown images like ![alt](url)
  regExp: /!\[([^\]]*)\]\(([^)\s]+)\)/,
  // Use same regex for import (pasting markdown).
  importRegExp: /!\[([^\]]*)\]\(([^)\s]+)\)/,
  dependencies: [MediaNode],
  export: (node) => {
    if (!$isMediaNode(node)) return null;
    const src = node.getSrc();
    const alt = escapeMarkdownText(node.getAlt() || "");
    if (node.getKind() === "video") {
      return `\n\n<video controls preload="metadata" playsinline src="${src}"></video>\n\n`;
    }
    return `![${alt}](${src})`;
  },
  replace: (textNode, match) => {
    const alt = match[1] ?? "";
    const src = match[2] ?? "";
    const mediaNode = $createMediaNode(src, alt, "image");
    textNode.replace(mediaNode);
  },
} satisfies TextMatchTransformer;

