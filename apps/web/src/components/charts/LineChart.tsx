"use client";
// Line / area time series. Endpoint values are labeled directly, annotations
// get a dashed vertical guide, and full mode adds a hover crosshair.
import type { LineChartSpec } from "@visualize/shared";
import { Group } from "@visx/group";
import { scaleLinear, scalePoint } from "@visx/scale";
import { area as d3Area, curveMonotoneX, line as d3Line } from "d3-shape";

import { formatValue } from "@/lib/format";
import { themes } from "@/lib/themes";

import { CHART_FONT_FAMILY, type ChartProps, LABEL_FONT_SIZE, MicroLabel, estimateTextWidth } from "./shared";
import { ChartTooltip, svgPoint, useChartTooltip } from "./Tooltip";

const PAD = 24;
const TOP_PAD = 48;
const TICK_HEIGHT = 24;

type Point = { x: string; y: number };

export function LineChart({ spec, mode = "thumbnail", width = 420, height = 320 }: ChartProps<LineChartSpec>) {
  const theme = themes[spec.theme];
  const tooltip = useChartTooltip(mode === "full");

  const xDomain = Array.from(new Set(spec.series.flatMap((s) => s.points.map((p) => p.x))));
  const allY = spec.series.flatMap((s) => s.points.map((p) => p.y));
  const primaryName = spec.highlight ?? (spec.series.length === 1 ? spec.series[0].name : undefined);
  const primary = spec.series.find((s) => s.name === primaryName) ?? spec.series[0];

  const endLabelFor = (s: LineChartSpec["series"][number]) => {
    const last = s.points[s.points.length - 1];
    const value = formatValue(last.y, spec.valueFormat);
    return spec.series.length > 1 ? `${s.name} ${value}` : value;
  };
  const endLabelWidth = Math.max(...spec.series.map((s) => estimateTextWidth(endLabelFor(s)))) + 14;
  const firstLabel = formatValue(primary.points[0].y, spec.valueFormat);
  const firstLabelWidth = estimateTextWidth(firstLabel, LABEL_FONT_SIZE - 2) + 8;

  const plotLeft = PAD + firstLabelWidth;
  const plotWidth = width - plotLeft - endLabelWidth;
  const plotTop = TOP_PAD;
  const plotHeight = height - TOP_PAD - TICK_HEIGHT - PAD / 2;

  const xScale = scalePoint<string>({ domain: xDomain, range: [0, plotWidth] });
  const yScale = scaleLinear<number>({
    domain: [Math.min(0, ...allY), Math.max(...allY)],
    range: [plotHeight, 0],
    nice: true,
  });

  const lineGen = d3Line<Point>()
    .x((p) => xScale(p.x) ?? 0)
    .y((p) => yScale(p.y))
    .curve(curveMonotoneX);
  const areaGen = d3Area<Point>()
    .x((p) => xScale(p.x) ?? 0)
    .y0(plotHeight)
    .y1((p) => yScale(p.y))
    .curve(curveMonotoneX);

  const tickEvery = Math.max(1, Math.ceil(xDomain.length / (mode === "full" ? 6 : 4)));
  const gradientId = `line-area-${spec.theme}`;

  const colorFor = (name: string, index: number) =>
    name === primaryName ? theme.accent : theme.seriesRamp[index % theme.seriesRamp.length];

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const { x, y } = svgPoint(e);
    const localX = x - plotLeft;
    const step = xScale.step();
    const index = Math.max(0, Math.min(xDomain.length - 1, Math.round(localX / step)));
    const xKey = xDomain[index];
    const point = primary.points.find((p) => p.x === xKey);
    if (!point) return;
    tooltip.show({
      title: xKey,
      label: primary.name,
      value: formatValue(point.y, spec.valueFormat),
      x: (xScale(xKey) ?? 0) + plotLeft,
      y,
    });
  };

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={spec.series.map((s) => s.name).join(", ")}
        fontFamily={CHART_FONT_FAMILY}
        onMouseLeave={tooltip.hide}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.55} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill={theme.background} />
        <Group left={plotLeft} top={plotTop}>
          {spec.series.map((s, i) => {
            const isPrimary = s.name === primaryName;
            const color = colorFor(s.name, i);
            const first = s.points[0];
            const last = s.points[s.points.length - 1];
            return (
              <Group key={s.name}>
                {spec.area !== false && isPrimary ? (
                  <path d={areaGen(s.points) ?? undefined} fill={`url(#${gradientId})`} />
                ) : null}
                <path
                  d={lineGen(s.points) ?? undefined}
                  fill="none"
                  stroke={color}
                  strokeWidth={isPrimary ? 2 : 1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {mode === "full" && s.points.length <= 24
                  ? s.points.map((p) => (
                      <circle key={p.x} cx={xScale(p.x)} cy={yScale(p.y)} r={2.5} fill={color} />
                    ))
                  : null}
                <text
                  x={xScale(last.x)! + 8}
                  y={yScale(last.y)}
                  dy="0.35em"
                  fontSize={LABEL_FONT_SIZE}
                  fontWeight={600}
                  fill={isPrimary ? theme.ink : color}
                >
                  {endLabelFor(s)}
                </text>
                {isPrimary ? (
                  <text
                    x={(xScale(first.x) ?? 0) - 6}
                    y={yScale(first.y)}
                    dy="0.35em"
                    textAnchor="end"
                    fontSize={LABEL_FONT_SIZE - 2}
                    fontWeight={500}
                    fill={theme.ink}
                    fillOpacity={0.8}
                  >
                    {firstLabel}
                  </text>
                ) : null}
              </Group>
            );
          })}
          {(spec.annotations ?? []).map((a) => {
            const x = xScale(a.x) ?? 0;
            const point = primary.points.find((p) => p.x === a.x);
            const y = point ? yScale(point.y) : 0;
            return (
              <Group key={a.x} left={x}>
                <line y1={y - 30} y2={plotHeight} stroke={theme.mutedInk} strokeDasharray="2 4" />
                {point ? <circle cy={y} r={3} fill={theme.ink} /> : null}
                {point ? (
                  <text y={y - 32} textAnchor="middle" fontSize={LABEL_FONT_SIZE} fontWeight={600} fill={theme.accent}>
                    {formatValue(point.y, spec.valueFormat)}
                  </text>
                ) : null}
                <MicroLabel y={y - 18} textAnchor="middle" fill={theme.mutedInk}>
                  {a.text}
                </MicroLabel>
              </Group>
            );
          })}
          {xDomain.map((x, i) =>
            i % tickEvery === 0 ? (
              <MicroLabel key={x} x={xScale(x)} y={plotHeight + 18} textAnchor="middle" fill={theme.mutedInk}>
                {x}
              </MicroLabel>
            ) : null,
          )}
          {tooltip.datum ? (
            <line
              x1={tooltip.datum.x - plotLeft}
              x2={tooltip.datum.x - plotLeft}
              y1={0}
              y2={plotHeight}
              stroke={theme.ink}
              strokeOpacity={0.4}
            />
          ) : null}
          {mode === "full" ? (
            <rect width={plotWidth} height={plotHeight} fill="transparent" onMouseMove={handleMove} />
          ) : null}
        </Group>
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
