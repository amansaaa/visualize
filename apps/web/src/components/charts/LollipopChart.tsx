"use client";
// Lollipop ranking: thin stem from a left baseline to a dot at the value,
// value printed after the dot. Optional dashed reference line.
import type { LollipopChartSpec } from "@visualize/shared";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";

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

const VALUE_COLUMN_WIDTH = 60;
const PAD = 24;
const DOT_RADIUS = 5;

export function LollipopChart({
  spec,
  mode = "thumbnail",
  width = 420,
  height = 320,
}: ChartProps<LollipopChartSpec>) {
  const theme = themes[spec.theme];
  const rows = mode === "thumbnail" ? spec.rows.slice(0, THUMBNAIL_ROW_CAP) : spec.rows;
  const isTruncated = rows.length < spec.rows.length;
  const tooltip = useChartTooltip(mode === "full");

  const labelColumnWidth = Math.min(
    Math.max(...rows.map((row) => estimateTextWidth(row.label)), 40) + 16,
    width * 0.42,
  );
  const plotLeft = PAD + labelColumnWidth;
  const plotTop = PAD + (spec.referenceLine ? 16 : 0);
  const plotWidth = Math.max(width - plotLeft - VALUE_COLUMN_WIDTH - PAD, 0);
  const plotHeight = height - plotTop - PAD;

  const yScale = scaleBand<string>({
    domain: rows.map((row) => row.label),
    range: [0, plotHeight],
    padding: 0.4,
  });
  const maxValue = Math.max(...rows.map((row) => row.value), spec.referenceLine?.value ?? 0, 0);
  const xScale = scaleLinear<number>({ domain: [0, maxValue], range: [0, plotWidth], nice: true });

  const dotColor = theme.seriesRamp[0];

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
        <rect width={width} height={height} fill={theme.background} />
        <Group left={plotLeft} top={plotTop}>
          <line x1={0} x2={0} y1={0} y2={plotHeight} stroke={theme.mutedInk} strokeOpacity={0.5} />
          {spec.referenceLine ? (
            <Group left={xScale(spec.referenceLine.value)}>
              <line y1={-6} y2={plotHeight} stroke={theme.mutedInk} strokeDasharray="3 4" />
              <MicroLabel y={-12} textAnchor="middle" fill={theme.mutedInk}>
                {spec.referenceLine.label}
              </MicroLabel>
            </Group>
          ) : null}
          {rows.map((row, i) => {
            const cy = (yScale(row.label) ?? 0) + yScale.bandwidth() / 2;
            const cx = xScale(row.value);
            const isHighlighted = row.label === spec.highlight;
            const color = isHighlighted ? theme.accent : dotColor;
            const showValue = mode === "full" || isHighlighted || i < 2;
            const showLabel = mode === "full" || i < 4 || isHighlighted;
            return (
              <Group
                key={row.label}
                onMouseMove={(e) =>
                  tooltip.show({
                    title: row.label,
                    label: "value",
                    value: formatValue(row.value, spec.valueFormat),
                    ...svgPoint(e),
                  })
                }
              >
                <line x1={0} x2={cx} y1={cy} y2={cy} stroke={theme.mutedInk} strokeOpacity={0.6} />
                <circle cx={cx} cy={cy} r={DOT_RADIUS} fill={color} />
                {showLabel ? (
                  <text
                    x={-12}
                    y={cy}
                    dy="0.35em"
                    textAnchor="end"
                    fontSize={LABEL_FONT_SIZE}
                    fontWeight={isHighlighted ? 600 : 500}
                    fill={isHighlighted ? theme.ink : theme.mutedInk}
                  >
                    {row.label}
                  </text>
                ) : null}
                {showValue ? (
                  <text
                    x={cx + DOT_RADIUS + 8}
                    y={cy}
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
          <ThumbnailFade id={`lollipop-fade-${spec.theme}`} width={width} height={height} theme={theme} />
        ) : null}
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
