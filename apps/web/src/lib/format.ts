// Number formatting ($3.8M, 12.4%, 2h 36m).
// Avoid precision to have UI clean to the user.
import type { ValueFormat } from "@visualize/shared";

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: value < 100 ? 2 : 1,
      }).format(value);
    case "percent":
      return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
    case "duration": {
      const minutes = Math.round(value);
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      if (hours === 0) return `${rest}m`;
      return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
    }
    case "compact":
      // Mockups print 107,941 rather than 107.94K; abbreviate from millions up.
      if (Math.abs(value) < 1e6) {
        return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
      }
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);
  }
}

export function formatPercentShare(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Converts publishedAt timestamp to a general time without precision
 * (i.e just now, 45 minutes ago, 3 hours ago, 7 days ago, etc...)
 *
 * `publishedAt` is nullable on the row — an unpublished draft has no date — and
 * a clock skew between server and client can put it slightly in the future, so
 * both degrade to "just now" rather than printing nonsense.
 */
export function formatRelativeTime(date: Date | null, now: Date = new Date()): string {
  if (!date || Number.isNaN(date.getTime())) return "just now";

  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE) return "just now";

  const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"} ago`;

  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), "hour");
  if (elapsed < MONTH) return plural(Math.floor(elapsed / DAY), "day");
  if (elapsed < YEAR) return plural(Math.floor(elapsed / MONTH), "month");
  return plural(Math.floor(elapsed / YEAR), "year");
}
