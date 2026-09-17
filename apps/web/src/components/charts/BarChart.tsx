// Horizontal bar ranking. Direct-labeled: row label to the left, value at
// the bar's end, no axis/gridlines/legend. One row can be highlighted in
// the theme's accent color.
import type { BarChartSpec } from "@visualize/shared";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

import { formatValue } from "@/lib/format";
import { themes } from "@/lib/themes";

interface BarChartProps {
  spec: BarChartSpec;
  mode?: "thumbnail" | "full";
  width?: number;
  height?: number;
}

const THUMBNAIL_ROW_CAP = 8;
const LABEL_FONT_SIZE = 12;
// Rough average glyph width for a 12px sans-serif; avoids clipping long
// labels (e.g. "German Shepherd") without measuring text in the DOM.
const CHAR_WIDTH_ESTIMATE = 7;
const VALUE_COLUMN_WIDTH = 56;
const ROW_PADDING = 0.35;

export function BarChart({ spec, mode = "thumbnail", width = 420, height = 320 }: BarChartProps) {
  const theme = themes[spec.theme];
  const rows = mode === "thumbnail" ? spec.rows.slice(0, THUMBNAIL_ROW_CAP) : spec.rows;
  const isTruncated = rows.length < spec.rows.length;

  const longestLabelLength = Math.max(...rows.map((row) => row.label.length), 1);
  const labelColumnWidth = Math.min(
    Math.max(longestLabelLength * CHAR_WIDTH_ESTIMATE + 16, 48),
    width * 0.42,
  );

  const plotLeft = labelColumnWidth;
  const plotWidth = Math.max(width - labelColumnWidth - VALUE_COLUMN_WIDTH, 0);

  const yScale = scaleBand<string>({
    domain: rows.map((row) => row.label),
    range: [0, height],
    padding: ROW_PADDING,
  });

  const xScale = scaleLinear<number>({
    domain: [0, Math.max(...rows.map((row) => row.value), 0)],
    range: [0, plotWidth],
    nice: true,
  });

  const fadeId = `bar-chart-fade-${spec.theme}`;

  return (
    <svg width={width} height={height} role="img" aria-label={spec.rows.map((r) => r.label).join(", ")}>
      <rect x={0} y={0} width={width} height={height} fill={theme.background} />
      <Group left={plotLeft}>
        {rows.map((row) => {
          const barHeight = yScale.bandwidth();
          const barWidth = Math.max(xScale(row.value), 1);
          const barY = yScale(row.label) ?? 0;
          const isHighlighted = row.label === spec.highlight;

          return (
            <Group key={row.label} top={barY}>
              <Bar
                x={0}
                y={0}
                width={barWidth}
                height={barHeight}
                fill={isHighlighted ? theme.accent : theme.mutedInk}
              />
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
              <text
                x={barWidth + 10}
                y={barHeight / 2}
                dy="0.35em"
                fontSize={LABEL_FONT_SIZE}
                fontWeight={600}
                fill={theme.ink}
              >
                {formatValue(row.value, spec.valueFormat)}
              </text>
            </Group>
          );
        })}
      </Group>
      {mode === "thumbnail" && isTruncated ? (
        <>
          <defs>
            <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.background} stopOpacity={0} />
              <stop offset="100%" stopColor={theme.background} stopOpacity={1} />
            </linearGradient>
          </defs>
          <rect x={0} y={height - 48} width={width} height={48} fill={`url(#${fadeId})`} />
        </>
      ) : null}
    </svg>
  );
}
