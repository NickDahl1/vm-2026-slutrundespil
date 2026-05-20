const TZ = "Europe/Copenhagen";

export function formatDanishDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function formatDanishTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("da-DK", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDanishDateTime(iso: string): string {
  return new Date(iso).toLocaleString("da-DK", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Returns YYYY-MM-DD in Copenhagen timezone — use as grouping key. */
export function getDanishDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
}
