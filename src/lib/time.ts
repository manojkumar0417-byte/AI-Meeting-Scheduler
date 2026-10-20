import "server-only";

export function getTimeZone() {
  return process.env.MEETING_TIMEZONE || "Asia/Kolkata";
}

export function localDateTimeToIso(date: string, time: string, timeZone: string) {
  // Convert a local wall-clock time in a known timezone to an ISO instant.
  // This implementation is designed for the configured timezone and avoids external date libraries.
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const targetUtcGuess = Date.UTC(year, month - 1, day, hour, minute);
  let instant = targetUtcGuess;

  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(instant));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const representedUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    instant += targetUtcGuess - representedUtc;
  }
  return new Date(instant).toISOString();
}

export function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidTimeString(value: unknown): value is string {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
  return true;
}
