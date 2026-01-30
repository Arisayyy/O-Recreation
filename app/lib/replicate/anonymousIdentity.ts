import { identity, type UserIdentity } from "@trestleinc/replicate/client";

const STORAGE_KEY = "orchid:deviceId";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getOrCreateDeviceId(): string {
  if (!canUseBrowserStorage()) return "server";

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const next = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function getAnonymousIdentity(): UserIdentity {
  const deviceId = getOrCreateDeviceId();
  return identity.from({
    name: identity.name.anonymous(deviceId),
    color: identity.color.generate(deviceId),
  });
}

