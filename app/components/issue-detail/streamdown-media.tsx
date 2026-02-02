"use client";

import React from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { StreamdownPre } from "@/app/components/code-block";

function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

const streamdownVideoSchema = {
  ...defaultSchema,
  tagNames: uniq([...(defaultSchema.tagNames ?? []), "video", "source"]),
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    video: uniq([
      ...((((defaultSchema.attributes ?? {}) as Record<string, unknown>).video as string[]) ?? []),
      "src",
      "controls",
      "preload",
      "poster",
      "loop",
      "muted",
      "playsinline",
    ]),
    source: uniq([
      ...((((defaultSchema.attributes ?? {}) as Record<string, unknown>).source as string[]) ?? []),
      "src",
      "type",
    ]),
  },
};

export const streamdownRehypePlugins = [
  defaultRehypePlugins.raw,
  [rehypeSanitize, streamdownVideoSchema],
  defaultRehypePlugins.harden,
] as unknown as React.ComponentProps<typeof Streamdown>["rehypePlugins"];

function cn(...values: Array<string | null | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

function looksLikeVideoHref(href: string): boolean {
  try {
    const url = new URL(href, "http://localhost");
    const path = url.pathname.toLowerCase();
    return (
      path.endsWith(".mp4") ||
      path.endsWith(".webm") ||
      path.endsWith(".mov") ||
      path.endsWith(".m4v") ||
      path.endsWith(".ogg")
    );
  } catch {
    const h = href.toLowerCase();
    return (
      h.endsWith(".mp4") ||
      h.endsWith(".webm") ||
      h.endsWith(".mov") ||
      h.endsWith(".m4v") ||
      h.endsWith(".ogg")
    );
  }
}

// Avoid Streamdown's default image wrapper that can place <div> inside <p>,
// which triggers hydration warnings in Next.js.
export function StreamdownImage(props: React.ComponentPropsWithoutRef<"img"> & { node?: unknown }) {
  // Streamdown passes a `node` prop (not valid on <img>). We destructure it away.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { node: _node, className, ...rest } = props;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      alt={rest.alt ?? ""}
      className={cn("max-w-full rounded-lg", className)}
      loading={rest.loading ?? "lazy"}
      decoding={rest.decoding ?? "async"}
    />
  );
}

export function StreamdownLink(props: React.ComponentPropsWithoutRef<"a"> & { node?: unknown }) {
  // Streamdown passes a `node` prop (not valid on <a>). We destructure it away.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { node: _node, className, children, href, rel, target, ...rest } = props;

  // Special-case `[![thumb](thumbUrl)](videoUrl)` so Orchid shows a real inline video player.
  // GitHub will still render the markdown as a linked thumbnail.
  if (typeof href === "string" && looksLikeVideoHref(href)) {
    const childArray = React.Children.toArray(children);
    const thumbChild = childArray.find((c) => {
      if (!React.isValidElement(c)) return false;
      const p = c.props as { src?: unknown };
      return typeof p?.src === "string" && p.src.length > 0;
    });

    if (thumbChild && React.isValidElement(thumbChild)) {
      const thumbSrc = (thumbChild.props as { src: string }).src;
      return (
        <video
          controls
          preload="metadata"
          playsInline
          src={href}
          poster={thumbSrc}
          className="my-2 max-w-full rounded-lg"
        />
      );
    }
  }

  const safeRel =
    target === "_blank" && (!rel || rel.length === 0) ? "noreferrer noopener" : rel;

  return (
    <a
      {...rest}
      href={href}
      target={target}
      rel={safeRel}
      className={cn("underline underline-offset-4", className)}
    >
      {children}
    </a>
  );
}

export const streamdownComponents = {
  img: StreamdownImage,
  a: StreamdownLink,
  pre: StreamdownPre,
} as unknown as React.ComponentProps<typeof Streamdown>["components"];

