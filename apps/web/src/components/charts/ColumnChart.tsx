"use client";
// Column time series. Sparse x ticks (first, last, every nth), value labels
// only where they earn their place (first, peak, last, highlight, annotated).
import type { ColumnChartSpec } from "@visualize/shared";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

import { formatValue } from "@/lib/format";
import { themes } from "@/lib/themes";

import { CHART_FONT_FAMILY, type ChartProps, LABEL_FONT_SIZE, MicroLabel } from "./shared";
import { ChartTooltip, svgPoint, useChartTooltip } from "./Tooltip";

const PAD = 24;
const TOP_PAD = 44;
const TICK_HEIGHT = 24;

export function ColumnChart({
  spec,
  mode = "thumbnail",
  width = 420,
  height = 320,
}: ChartProps<ColumnChartSpec>) {
  const theme = themes[spec.theme];
  const rows = spec.rows;
  const tooltip = useChartTooltip(mode === "full");

  const plotLeft = PAD;
  const plotWidth = width - PAD * 2;
  const plotTop = TOP_PAD;
  const plotHeight = height - TOP_PAD - TICK_HEIGHT - PAD / 2;

  const xScale = scaleBand<string>({
    domain: rows.map((r) => r.label),
    range: [0, plotWidth],
    padding: rows.length > 20 ? 0.25 : 0.4,
  });
  const maxValue = Math.max(...rows.map((r) => r.value), 0);
  const yScale = scaleLinear<number>({ domain: [0, maxValue], range: [plotHeight, 0], nice: true });

  const peakIndex = rows.reduce((best, r, i) => (r.value > rows[best].value ? i : best), 0);
  const annotationByLabel = new Map((spec.annotations ?? []).map((a) => [a.label, a.text]));
  const tickEvery = Math.max(1, Math.ceil(rows.length / (mode === "full" ? 6 : 4)));
  const bandwidth = xScale.bandwidth();

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${rows[0].label} to ${rows[rows.length - 1].label}`}
        fontFamily={CHART_FONT_FAMILY}
        onMouseLeave={tooltip.hide}
      >
        <rect width={width} height={height} fill={theme.background} />
        <Group left={plotLeft} top={plotTop}>
          {rows.map((row, i) => {
            const x = xScale(row.label) ?? 0;
            const y = yScale(row.value);
            const barHeight = plotHeight - y;
            const isHighlighted = row.label === spec.highlight;
            const annotation = annotationByLabel.get(row.label);
            const isEdge = i === 0 || i === rows.length - 1;
            const showValue =
              isHighlighted || annotation !== undefined || i === peakIndex || (mode === "full" && isEdge);
            const showTick = i % tickEvery === 0 || i === rows.length - 1;
            const fill = isHighlighted ? theme.accent : theme.seriesRamp[0];
            const valueColor = isHighlighted ? theme.accent : theme.ink;
            const cx = x + bandwidth / 2;

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
                <Bar x={x} y={y} width={bandwidth} height={Math.max(barHeight, 1)} fill={fill} />
                {showValue ? (
                  <text
                    x={cx}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize={isHighlighted || i === peakIndex ? LABEL_FONT_SIZE + 1 : LABEL_FONT_SIZE - 1}
                    fontWeight={600}
                    fill={valueColor}
                  >
                    {formatValue(row.value, spec.valueFormat)}
                  </text>
                ) : null}
                {annotation ? (
                  <MicroLabel x={cx} y={y - (showValue ? 24 : 10)} textAnchor="middle" fill={valueColor}>
                    {annotation}
                  </MicroLabel>
                ) : null}
                {showTick ? (
                  <MicroLabel x={cx} y={plotHeight + 18} textAnchor="middle" fill={theme.mutedInk}>
                    {row.label}
                  </MicroLabel>
                ) : null}
              </Group>
            );
          })}
        </Group>
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
