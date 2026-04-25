export function formatRetryAfterMs(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}${minutes > 0 ? ` ${minutes} min` : ""}`;
  }
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${sec} second${sec === 1 ? "" : "s"}`;
}

export function formatCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return "—";
  try {
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}
