import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";

const ogPng = readFileSync(join(process.cwd(), "public", "og.png"));

export const alt = "Orchid";
export const contentType = "image/png";
export const size = {
  // PNG IHDR stores width/height as big-endian uint32 at bytes 16..24.
  width: ogPng.readUInt32BE(16),
  height: ogPng.readUInt32BE(20),
};

export default function Image() {
  return new Response(ogPng, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

