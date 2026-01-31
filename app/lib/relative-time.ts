type RelativeUnit = "s" | "m" | "h" | "d" | "w" | "mo" | "y";

export function formatRelativeTime(
  timestampMs: number,
  nowMs: number = Date.now(),
): string {
  const diffMs = nowMs - timestampMs;

  // Clamp future to "Just now" for now (we don't expect future timestamps).
  if (!Number.isFinite(diffMs) || diffMs <= 0) return "Just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return "Just now";

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const pick = (): { value: number; unit: RelativeUnit } => {
    if (years >= 1) return { value: years, unit: "y" };
    if (months >= 1) return { value: months, unit: "mo" };
    if (weeks >= 1) return { value: weeks, unit: "w" };
    if (days >= 1) return { value: days, unit: "d" };
    if (hours >= 1) return { value: hours, unit: "h" };
    if (minutes >= 1) return { value: minutes, unit: "m" };
    return { value: seconds, unit: "s" };
  };

  const { value, unit } = pick();
  return `${value}${unit} ago`;
}

