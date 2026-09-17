"use client";
// US state choropleth. Uses the pre-projected Albers topology from us-atlas
// so no projection math is needed; states are joined by FIPS id. Fill is a
// 5-step sequential ramp from a tint of the background to the theme ink.
import { type UsMapChartSpec, usStateByCode, usStateByFips } from "@visualize/shared";
import { Group } from "@visx/group";
import { geoIdentity, geoPath } from "d3-geo";
import { scaleQuantize } from "d3-scale";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import statesTopology from "us-atlas/states-albers-10m.json";

import { formatValue } from "@/lib/format";
import { themes } from "@/lib/themes";

import { CHART_FONT_FAMILY, type ChartProps, MICRO_FONT_SIZE, MicroLabel, estimateTextWidth, mixHex } from "./shared";
import { ChartTooltip, svgPoint, useChartTooltip } from "./Tooltip";

const PAD = 20;
const LEGEND_HEIGHT = 28;
const STEPS = 5;

const topology = statesTopology as unknown as Topology;
const states = feature(topology, topology.objects.states) as unknown as FeatureCollection<Geometry, { name: string }>;

export function UsMapChart({ spec, mode = "thumbnail", width = 420, height = 320 }: ChartProps<UsMapChartSpec>) {
  const theme = themes[spec.theme];
  const tooltip = useChartTooltip(mode === "full");

  const valueByFips = new Map(spec.rows.map((r) => [usStateByCode.get(r.state)!.fips, r.value]));
  const values = spec.rows.map((r) => r.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Light tint of the ink → muted ink → accent, so the darkest states carry the theme color.
  const light = mixHex(theme.background, theme.ink, 0.22);
  const ramp = Array.from({ length: STEPS }, (_, i) => {
    const t = i / (STEPS - 1);
    return t < 0.5 ? mixHex(light, theme.mutedInk, t * 2) : mixHex(theme.mutedInk, theme.accent, (t - 0.5) * 2);
  });
  const color = scaleQuantize<string>().domain([min, max]).range(ramp);
  const minLabel = formatValue(min, spec.valueFormat);
  const maxLabel = formatValue(max, spec.valueFormat);

  const mapWidth = width - PAD * 2;
  const mapHeight = height - PAD * 2 - LEGEND_HEIGHT;
  const projection = geoIdentity().fitSize([mapWidth, mapHeight], states);
  const path = geoPath(projection);

  const legendWidth = Math.min(160, mapWidth * 0.4);
  const legendX = width - PAD - legendWidth - estimateTextWidth(maxLabel, MICRO_FONT_SIZE) * 1.3 - 8;
  const legendY = height - PAD - 6;

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} role="img" aria-label="US states" fontFamily={CHART_FONT_FAMILY} onMouseLeave={tooltip.hide}>
        <rect width={width} height={height} fill={theme.background} />
        <Group left={PAD} top={PAD}>
          {states.features.map((f) => {
            const fips = String(f.id);
            const value = valueByFips.get(fips);
            const state = usStateByFips.get(fips);
            const isHighlighted = state?.code === spec.highlight;
            const fill = isHighlighted ? theme.accent : value === undefined ? "transparent" : color(value);
            return (
              <path
                key={fips}
                d={path(f) ?? undefined}
                fill={fill}
                stroke={theme.background}
                strokeWidth={0.75}
                strokeOpacity={value === undefined ? 0.4 : 1}
                onMouseMove={
                  value === undefined || !state
                    ? undefined
                    : (e) =>
                        tooltip.show({
                          title: state.name,
                          label: "value",
                          value: formatValue(value, spec.valueFormat),
                          ...svgPoint(e),
                        })
                }
              />
            );
          })}
        </Group>
        <Group left={legendX} top={legendY}>
          {ramp.map((c, i) => (
            <rect key={c} x={(legendWidth / STEPS) * i} y={-4} width={legendWidth / STEPS} height={4} fill={c} />
          ))}
          <MicroLabel x={-8} y={0} textAnchor="end" fill={theme.mutedInk}>
            {minLabel}
          </MicroLabel>
          <MicroLabel x={legendWidth + 8} y={0} fill={theme.mutedInk}>
            {maxLabel}
          </MicroLabel>
        </Group>
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
