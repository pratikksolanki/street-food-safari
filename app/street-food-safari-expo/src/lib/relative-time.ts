const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

export function formatRelativeTime(isoString: string, now: number = Date.now()): string {
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));

  if (seconds < 45) return "just now";
  if (seconds < MINUTE * 2) return "a minute ago";
  if (seconds < HOUR) return plural(Math.round(seconds / MINUTE), "minute") + " ago";
  if (seconds < HOUR * 2) return "an hour ago";
  if (seconds < DAY) return plural(Math.round(seconds / HOUR), "hour") + " ago";
  if (seconds < DAY * 2) return "yesterday";
  if (seconds < WEEK) return plural(Math.round(seconds / DAY), "day") + " ago";
  if (seconds < MONTH) return plural(Math.round(seconds / WEEK), "week") + " ago";
  if (seconds < YEAR) return plural(Math.round(seconds / MONTH), "month") + " ago";
  return plural(Math.round(seconds / YEAR), "year") + " ago";
}
