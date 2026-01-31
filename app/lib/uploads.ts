export type UploadResponse = {
  key: string;
  bytesWritten: number;
  contentType: string | null;
  originalFilename: string;
  publicUrl: string | null;
  presignedUrl: string;
  presignedUrlExpiresInSeconds: number;
};

export async function uploadToUploadsRoute({
  file,
  prefix,
}: {
  file: File;
  prefix?: string;
}): Promise<UploadResponse> {
  const form = new FormData();
  form.set("file", file);
  if (prefix) form.set("prefix", prefix);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { error?: string };
      detail = data?.error ? ` (${data.error})` : "";
    } catch {
      // ignore
    }
    throw new Error(`Upload failed${detail}`);
  }

  const data = (await res.json()) as UploadResponse;
  return data;
}

