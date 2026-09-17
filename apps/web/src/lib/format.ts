// Number formatting ($3.8M, 12.4%, 2h 36m).
import type { BarChartSpec } from "@visualize/shared";

type ValueFormat = BarChartSpec["valueFormat"];

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    case "percent":
      return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
    case "compact":
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);
  }
}
