// Picks the chart component for spec.type; handles thumbnail vs full mode.
import type { ChartSpec } from "@visualize/shared";

import { BarChart } from "./BarChart";
import { ColumnChart } from "./ColumnChart";
import { DonutChart } from "./DonutChart";
import { DotCompareChart } from "./DotCompareChart";
import { LineChart } from "./LineChart";
import { LollipopChart } from "./LollipopChart";
import type { ChartProps } from "./shared";
import { TreemapChart } from "./TreemapChart";
import { UsMapChart } from "./UsMapChart";

export function Chart({ spec, ...rest }: ChartProps<ChartSpec>) {
  switch (spec.type) {
    case "bar":
      return <BarChart spec={spec} {...rest} />;
    case "lollipop":
      return <LollipopChart spec={spec} {...rest} />;
    case "column":
      return <ColumnChart spec={spec} {...rest} />;
    case "line":
      return <LineChart spec={spec} {...rest} />;
    case "donut":
      return <DonutChart spec={spec} {...rest} />;
    case "usMap":
      return <UsMapChart spec={spec} {...rest} />;
    case "treemap":
      return <TreemapChart spec={spec} {...rest} />;
    case "dotCompare":
      return <DotCompareChart spec={spec} {...rest} />;
  }
}
