// Number formatting ($3.8M, 12.4%, 2h 36m).
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
