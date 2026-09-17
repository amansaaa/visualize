"use client";
// Donut with a bold center total and micro label. Slices use the theme's
// series ramp; the highlighted part takes the accent. Share labels sit
// inside slices that are wide enough, otherwise just outside.
import type { DonutChartSpec } from "@visualize/shared";
import { Group } from "@visx/group";
import { arc as d3Arc, pie as d3Pie } from "d3-shape";

import { formatPercentShare, formatValue } from "@/lib/format";
import { themes } from "@/lib/themes";

import { CHART_FONT_FAMILY, type ChartProps, LABEL_FONT_SIZE, MicroLabel } from "./shared";
import { ChartTooltip, svgPoint, useChartTooltip } from "./Tooltip";

const PAD = 24;
const CAPTION_HEIGHT = 36;
const MIN_ANGLE_FOR_INNER_LABEL = 0.35;

export function DonutChart({
  spec,
  mode = "thumbnail",
  width = 420,
  height = 320,
}: ChartProps<DonutChartSpec>) {
  const theme = themes[spec.theme];
  const tooltip = useChartTooltip(mode === "full");

  const total = spec.parts.reduce((acc, p) => acc + p.value, 0);
  const centerValue = spec.centerValue ?? total;
  const highlighted = spec.parts.find((p) => p.label === spec.highlight);

  const captionHeight = mode === "full" && highlighted ? CAPTION_HEIGHT : 0;
  const radius = Math.min(width - PAD * 2, height - PAD * 2 - captionHeight) / 2;
  const innerRadius = radius * 0.58;
  const cx = width / 2;
  const cy = (height - captionHeight) / 2;

  const arcs = d3Pie<(typeof spec.parts)[number]>()
    .value((p) => p.value)
    .sort(null)
    .padAngle(0.012)(spec.parts);
  const arcPath = d3Arc<(typeof arcs)[number]>().innerRadius(innerRadius).outerRadius(radius).cornerRadius(1);
  const labelArc = d3Arc<(typeof arcs)[number]>()
    .innerRadius((innerRadius + radius) / 2)
    .outerRadius((innerRadius + radius) / 2);
  const outerArc = d3Arc<(typeof arcs)[number]>().innerRadius(radius + 14).outerRadius(radius + 14);

  const colorFor = (index: number, label: string) =>
    label === spec.highlight ? theme.accent : theme.seriesRamp[index % theme.seriesRamp.length];

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={spec.parts.map((p) => p.label).join(", ")}
        fontFamily={CHART_FONT_FAMILY}
        onMouseLeave={tooltip.hide}
      >
        <rect width={width} height={height} fill={theme.background} />
        <Group left={cx} top={cy}>
          {arcs.map((a, i) => {
            const fill = colorFor(i, a.data.label);
            const angle = a.endAngle - a.startAngle;
            const inside = angle > MIN_ANGLE_FOR_INNER_LABEL;
            // Rounded so SSR and client markup agree bit-for-bit.
            const [lx, ly] = (inside ? labelArc.centroid(a) : outerArc.centroid(a)).map((v) => Math.round(v * 100) / 100);
            const share = formatPercentShare(a.data.value, total);
            const showLabel = mode === "full" || angle > 0.2;
            return (
              <Group
                key={a.data.label}
                onMouseMove={(e) =>
                  tooltip.show({
                    title: a.data.label,
                    label: share,
                    value: formatValue(a.data.value, spec.valueFormat),
                    ...svgPoint(e),
                  })
                }
              >
                <path d={arcPath(a) ?? undefined} fill={fill} />
                {showLabel ? (
                  <text
                    x={lx}
                    y={ly}
                    dy="0.35em"
                    textAnchor={inside ? "middle" : lx > 0 ? "start" : "end"}
                    fontSize={LABEL_FONT_SIZE - 1}
                    fontWeight={600}
                    fill={inside ? theme.background : theme.ink}
                  >
                    {share}
                  </text>
                ) : null}
              </Group>
            );
          })}
          <text
            textAnchor="middle"
            dy={mode === "full" ? "-0.1em" : "0.1em"}
            fontSize={mode === "full" ? 24 : 13}
            fontWeight={600}
            fill={highlighted ? theme.accent : theme.ink}
          >
            {formatValue(centerValue, spec.valueFormat)}
          </text>
          <MicroLabel
            y={mode === "full" ? 24 : 16}
            textAnchor="middle"
            fill={theme.mutedInk}
            fontSize={mode === "full" ? 11 : 8}
          >
            {spec.centerLabel}
          </MicroLabel>
        </Group>
        {captionHeight && highlighted ? (
          <text
            x={cx}
            y={height - PAD}
            textAnchor="middle"
            fontSize={LABEL_FONT_SIZE + 2}
            fontWeight={500}
            fill={theme.accent}
          >
            {highlighted.label} · {formatValue(highlighted.value, spec.valueFormat)} ·{" "}
            {formatPercentShare(highlighted.value, total)} of {spec.centerLabel.toLowerCase()}
          </text>
        ) : null}
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
