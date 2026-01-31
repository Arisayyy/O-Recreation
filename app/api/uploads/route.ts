import { r2File, r2PublicUrl } from "@/app/lib/r2";

export const runtime = "nodejs";

function sanitizeFilename(name: string): string {
  // Drop any path-like segments and keep a conservative charset.
  const base = name.split(/[/\\]/).pop() ?? "upload";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+/, "");
  return cleaned.length ? cleaned : "upload";
}

function sanitizePrefix(prefix: string): string {
  const p = prefix.replace(/\\/g, "/").trim();
  const noLeading = p.replace(/^\/+/, "");
  const noTraversal = noLeading
    .split("/")
    .filter((seg) => seg.length > 0 && seg !== "." && seg !== "..")
    .join("/");
  if (!noTraversal) return "uploads/";
  return noTraversal.endsWith("/") ? noTraversal : `${noTraversal}/`;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return Response.json(
        { error: "Expected multipart/form-data" },
        { status: 415 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return Response.json(
        { error: 'Missing "file" in multipart form data' },
        { status: 400 },
      );
    }

    const prefixRaw = form.get("prefix");
    const prefix = sanitizePrefix(
      typeof prefixRaw === "string" ? prefixRaw : "uploads/",
    );

    const originalFilename =
      typeof (file as File).name === "string" ? (file as File).name : "upload";
    const filename = sanitizeFilename(originalFilename);

    const key = `${prefix}${crypto.randomUUID()}-${filename}`;

    const object = r2File(key);
    const bytesWritten = await object.write(file, {
      type: file.type || undefined,
    });

    const presignedUrl = object.presign({ expiresIn: 60 * 60 });
    const publicUrl = r2PublicUrl(key);

    return Response.json(
      {
        key,
        bytesWritten,
        contentType: file.type || null,
        originalFilename,
        publicUrl,
        presignedUrl,
        presignedUrlExpiresInSeconds: 60 * 60,
      },
      { status: 200 },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}

