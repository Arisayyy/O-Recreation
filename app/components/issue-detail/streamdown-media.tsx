"use client";

import React from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

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

// Avoid Streamdown's default image wrapper that can place <div> inside <p>,
// which triggers hydration warnings in Next.js.
export function StreamdownImage(props: React.ComponentPropsWithoutRef<"img"> & { node?: unknown }) {
  const { node: _node, className, ...rest } = props;
  return (
    <img
      {...rest}
      className={cn("max-w-full rounded-lg", className)}
      loading={rest.loading ?? "lazy"}
      decoding={rest.decoding ?? "async"}
    />
  );
}

export const streamdownComponents = {
  img: StreamdownImage,
} as unknown as React.ComponentProps<typeof Streamdown>["components"];

