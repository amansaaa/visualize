// Picks the chart component for spec.type; handles thumbnail vs full mode.
import type { ChartSpec } from "@visualize/shared";

import { BarChart } from "@/components/charts/BarChart";

interface ChartProps {
  spec: ChartSpec;
  mode?: "thumbnail" | "full";
  width?: number;
  height?: number;
}

export function Chart({ spec, ...rest }: ChartProps) {
  switch (spec.type) {
    case "bar":
      return <BarChart spec={spec} {...rest} />;
  }
}
