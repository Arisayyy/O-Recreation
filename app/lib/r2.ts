import { S3Client } from "bun";

function getEnv(name: string): string | undefined {
  // Prefer Bun.env when running under Bun; fall back to Node env.
  const bunEnv = (globalThis as unknown as { Bun?: { env?: Record<string, string> } })
    .Bun?.env;
  return bunEnv?.[name] ?? process.env[name];
}

function requiredEnv(...names: string[]): string {
  for (const name of names) {
    const v = getEnv(name);
    if (v) return v;
  }
  throw new Error(
    `Missing required environment variable (tried: ${names.join(", ")})`,
  );
}

function parseBoolean(v: string | undefined): boolean | undefined {
  if (!v) return undefined;
  const normalized = v.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

let _r2: S3Client | null = null;
function r2Client(): S3Client {
  if (_r2) return _r2;

  // Orchid only supports Cloudflare R2 env vars.
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  // Prefer the explicit name you already use; keep R2_BUCKET as a legacy alias.
  const bucket = requiredEnv("R2_BUCKET_NAME", "R2_BUCKET");
  const endpoint =
    getEnv("R2_ENDPOINT") ??
    (getEnv("R2_ACCOUNT_ID")
      ? `https://${getEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`
      : undefined);
  if (!endpoint) {
    throw new Error(
      "Missing required environment variable (tried: R2_ENDPOINT, or R2_ACCOUNT_ID for default R2 endpoint)",
    );
  }

  const virtualHostedStyle = parseBoolean(getEnv("R2_VIRTUAL_HOSTED_STYLE"));

  _r2 = new S3Client({
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    ...(typeof virtualHostedStyle === "boolean" ? { virtualHostedStyle } : null),
  });

  return _r2;
}

function encodeObjectKey(key: string): string {
  // Preserve path separators but encode each segment safely.
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function r2File(key: string) {
  return r2Client().file(key);
}

export function r2PublicUrl(key: string): string | null {
  const base =
    getEnv("R2_PUBLIC_BASE_URL") ??
    getEnv("NEXT_PUBLIC_R2_PUBLIC_BASE_URL") ??
    null;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/${encodeObjectKey(key)}`;
}

