"use client";
// Multi-dot comparison: one row per label, one dot per series joined by a
// thin stem (a dumbbell when there are two series). The series key at the
// top is the one legend-like element allowed in the style system.
import type { DotCompareChartSpec } from "@visualize/shared";
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

const PAD = 24;
const KEY_HEIGHT = 28;
const VALUE_COLUMN_WIDTH = 52;
const DOT_RADIUS = 4.5;

export function DotCompareChart({
  spec,
  mode = "thumbnail",
  width = 420,
  height = 320,
}: ChartProps<DotCompareChartSpec>) {
  const theme = themes[spec.theme];
  const rows = mode === "thumbnail" ? spec.rows.slice(0, THUMBNAIL_ROW_CAP) : spec.rows;
  const isTruncated = rows.length < spec.rows.length;
  const tooltip = useChartTooltip(mode === "full");

  const labelColumnWidth = Math.min(
    Math.max(...rows.map((row) => estimateTextWidth(row.label)), 40) + 16,
    width * 0.4,
  );
  const plotLeft = PAD + labelColumnWidth;
  const plotTop = PAD + KEY_HEIGHT;
  const plotWidth = Math.max(width - plotLeft - VALUE_COLUMN_WIDTH - PAD, 0);
  const plotHeight = height - plotTop - PAD;

  const yScale = scaleBand<string>({
    domain: rows.map((row) => row.label),
    range: [0, plotHeight],
    padding: 0.45,
  });
  // Don't anchor at zero: comparisons live in the spread between series, so
  // pad the data extent instead (PISA scores of 500–575 would otherwise bunch).
  const allValues = rows.flatMap((r) => r.values);
  const lo = Math.min(...allValues);
  const hi = Math.max(...allValues);
  const padding = (hi - lo || Math.abs(hi) || 1) * 0.12;
  const xScale = scaleLinear<number>({
    domain: [lo - padding, hi + padding],
    range: [0, plotWidth],
  });

  const colorFor = (seriesIndex: number) => theme.seriesRamp[seriesIndex % theme.seriesRamp.length];

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={spec.series.join(" vs ")}
        fontFamily={CHART_FONT_FAMILY}
        onMouseLeave={tooltip.hide}
      >
        <rect width={width} height={height} fill={theme.background} />
        <Group left={plotLeft} top={PAD + 6}>
          {spec.series.map((name, i) => {
            const offset = spec.series.slice(0, i).reduce((acc, s) => acc + estimateTextWidth(s, 10) + 28, 0);
            return (
              <Group key={name} left={offset}>
                <circle cx={0} cy={0} r={3} fill={colorFor(i)} />
                <MicroLabel x={9} y={0} dy="0.35em" fill={theme.mutedInk}>
                  {name}
                </MicroLabel>
              </Group>
            );
          })}
        </Group>
        <Group left={plotLeft} top={plotTop}>
          {rows.map((row, rowIndex) => {
            const cy = (yScale(row.label) ?? 0) + yScale.bandwidth() / 2;
            const isHighlighted = row.label === spec.highlight;
            const xs = row.values.map((v) => xScale(v));
            const maxIndex = row.values.reduce((b, v, i) => (v > row.values[b] ? i : b), 0);
            const showValue = mode === "full" || isHighlighted || rowIndex < 2;
            return (
              <Group
                key={row.label}
                onMouseMove={(e) =>
                  tooltip.show({
                    title: row.label,
                    label: spec.series[maxIndex],
                    value: formatValue(row.values[maxIndex], spec.valueFormat),
                    ...svgPoint(e),
                  })
                }
              >
                <line
                  x1={Math.min(...xs)}
                  x2={Math.max(...xs)}
                  y1={cy}
                  y2={cy}
                  stroke={theme.mutedInk}
                  strokeOpacity={0.6}
                />
                {xs.map((cx, i) => (
                  <circle
                    key={spec.series[i]}
                    cx={cx}
                    cy={cy}
                    r={DOT_RADIUS}
                    fill={isHighlighted && i === maxIndex ? theme.accent : colorFor(i)}
                  />
                ))}
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
                {showValue ? (
                  <text
                    x={Math.max(...xs) + DOT_RADIUS + 8}
                    y={cy}
                    dy="0.35em"
                    fontSize={LABEL_FONT_SIZE}
                    fontWeight={600}
                    fill={isHighlighted ? theme.accent : theme.ink}
                  >
                    {formatValue(row.values[maxIndex], spec.valueFormat)}
                  </text>
                ) : null}
              </Group>
            );
          })}
        </Group>
        {mode === "thumbnail" && isTruncated ? (
          <ThumbnailFade id={`dot-fade-${spec.theme}`} width={width} height={height} theme={theme} />
        ) : null}
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
