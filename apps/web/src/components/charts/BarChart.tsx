"use client";
// Horizontal bar ranking. Direct-labeled: row label to the left, value at
// the bar's end, no axis/gridlines/legend. One row can be highlighted in
// the theme's accent color. `showRank` renders the "01 / 02" numbered
// variant with the label inside the bar.
import type { BarChartSpec } from "@visualize/shared";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

import { formatValue } from "@/lib/format";
import { themes } from "@/lib/themes";

import {
  CHART_FONT_FAMILY,
  type ChartProps,
  LABEL_FONT_SIZE,
  MicroLabel,
  THUMBNAIL_ROW_CAP,
  ThumbnailFade,
  estimateTextWidth,
} from "./shared";
import { ChartTooltip, svgPoint, useChartTooltip } from "./Tooltip";

const VALUE_COLUMN_WIDTH = 56;
const ROW_PADDING = 0.35;
const RANK_COLUMN_WIDTH = 32;
const PAD = 24;

export function BarChart({ spec, mode = "thumbnail", width = 420, height = 320 }: ChartProps<BarChartSpec>) {
  const theme = themes[spec.theme];
  const rows = mode === "thumbnail" ? spec.rows.slice(0, THUMBNAIL_ROW_CAP) : spec.rows;
  const isTruncated = rows.length < spec.rows.length;
  const tooltip = useChartTooltip(mode === "full");

  const longestLabel = Math.max(...rows.map((row) => estimateTextWidth(row.label)), 40);
  const labelColumnWidth = spec.showRank
    ? RANK_COLUMN_WIDTH
    : Math.min(longestLabel + 16, width * 0.42);

  const plotLeft = PAD + labelColumnWidth;
  const plotWidth = Math.max(width - plotLeft - VALUE_COLUMN_WIDTH - PAD, 0);
  const plotTop = PAD;
  const plotHeight = height - PAD * 2;

  const yScale = scaleBand<string>({
    domain: rows.map((row) => row.label),
    range: [0, plotHeight],
    padding: ROW_PADDING,
  });

  const xScale = scaleLinear<number>({
    domain: [0, Math.max(...rows.map((row) => row.value), 0)],
    range: [0, plotWidth],
    nice: true,
  });

  const barHeight = yScale.bandwidth();

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={spec.rows.map((r) => r.label).join(", ")}
        fontFamily={CHART_FONT_FAMILY}
        onMouseLeave={tooltip.hide}
      >
        <rect x={0} y={0} width={width} height={height} fill={theme.background} />
        <Group left={plotLeft} top={plotTop}>
          {rows.map((row, i) => {
            const barWidth = Math.max(xScale(row.value), 1);
            const barY = yScale(row.label) ?? 0;
            const isHighlighted = row.label === spec.highlight;
            const fill = isHighlighted ? theme.accent : theme.mutedInk;
            const showValue = mode === "full" || isHighlighted || i < 2;

            return (
              <Group
                key={row.label}
                top={barY}
                onMouseMove={(e) =>
                  tooltip.show({
                    title: row.label,
                    label: "value",
                    value: formatValue(row.value, spec.valueFormat),
                    ...svgPoint(e),
                  })
                }
              >
                <Bar x={0} y={0} width={barWidth} height={barHeight} fill={fill} />
                {spec.showRank ? (
                  <>
                    <MicroLabel x={-12} y={barHeight / 2} dy="0.35em" textAnchor="end" fill={theme.mutedInk}>
                      {String(i + 1).padStart(2, "0")}
                    </MicroLabel>
                    <text
                      x={8}
                      y={barHeight / 2}
                      dy="0.35em"
                      fontSize={LABEL_FONT_SIZE}
                      fontWeight={isHighlighted ? 600 : 500}
                      fill={theme.background}
                    >
                      {row.label}
                    </text>
                  </>
                ) : (
                  <text
                    x={-12}
                    y={barHeight / 2}
                    dy="0.35em"
                    textAnchor="end"
                    fontSize={LABEL_FONT_SIZE}
                    fontWeight={isHighlighted ? 600 : 500}
                    fill={theme.ink}
                  >
                    {row.label}
                  </text>
                )}
                {showValue ? (
                  <text
                    x={barWidth + 10}
                    y={barHeight / 2}
                    dy="0.35em"
                    fontSize={LABEL_FONT_SIZE}
                    fontWeight={600}
                    fill={isHighlighted ? theme.accent : theme.ink}
                  >
                    {formatValue(row.value, spec.valueFormat)}
                  </text>
                ) : null}
              </Group>
            );
          })}
        </Group>
        {mode === "thumbnail" && isTruncated ? (
          <ThumbnailFade id={`bar-fade-${spec.theme}`} width={width} height={height} theme={theme} />
        ) : null}
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
