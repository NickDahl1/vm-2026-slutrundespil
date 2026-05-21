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

/**
 * Converts a UTC ISO string to a datetime-local string (YYYY-MM-DDTHH:MM)
 * displayed in Europe/Copenhagen time. Use to pre-fill <input type="datetime-local">.
 */
export function toCopenhagenDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso)
    .toLocaleString("sv-SE", { timeZone: TZ })
    .slice(0, 16)
    .replace(" ", "T");
}

/**
 * Converts a datetime-local string (interpreted as Copenhagen time) to a UTC
 * ISO string for database storage. Uses the Intl API to resolve the correct
 * DST offset for the given date without hardcoding UTC+2.
 */
export function copenhagenToUTC(localStr: string): string | null {
  if (!localStr) return null;
  const roughUTC = new Date(localStr + "Z");
  if (isNaN(roughUTC.getTime())) return null;
  const copenhStr = roughUTC.toLocaleString("sv-SE", { timeZone: TZ });
  const utcStr = roughUTC.toLocaleString("sv-SE", { timeZone: "UTC" });
  const offsetMs =
    new Date(copenhStr.replace(" ", "T") + "Z").getTime() -
    new Date(utcStr.replace(" ", "T") + "Z").getTime();
  return new Date(roughUTC.getTime() - offsetMs).toISOString();
}
