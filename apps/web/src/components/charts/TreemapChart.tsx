"use client";
// Squarified treemap. Cells are colored by rank through the series ramp (or
// by group when groups are given); the highlight takes the accent. Labels
// only appear in cells with room for them.
import type { TreemapChartSpec } from "@visualize/shared";
import { Group } from "@visx/group";
import { hierarchy, treemap as d3Treemap, treemapSquarify } from "d3-hierarchy";

import { formatPercentShare, formatValue } from "@/lib/format";
import { themes } from "@/lib/themes";

import { CHART_FONT_FAMILY, type ChartProps, LABEL_FONT_SIZE, MicroLabel, readableInk } from "./shared";
import { ChartTooltip, svgPoint, useChartTooltip } from "./Tooltip";

const PAD = 24;
const GAP = 2;
const MIN_LABEL_WIDTH = 64;
const MIN_LABEL_HEIGHT = 40;

type Cell = TreemapChartSpec["cells"][number];
type TreeNode = { name: string; children?: Cell[] };

export function TreemapChart({
  spec,
  mode = "thumbnail",
  width = 420,
  height = 320,
}: ChartProps<TreemapChartSpec>) {
  const theme = themes[spec.theme];
  const tooltip = useChartTooltip(mode === "full");

  const total = spec.cells.reduce((acc, c) => acc + c.value, 0);
  const root = hierarchy<TreeNode | Cell>({ name: "root", children: spec.cells })
    .sum((d) => ("value" in d ? d.value : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const laidOut = d3Treemap<TreeNode | Cell>()
    .tile(treemapSquarify)
    .size([width - PAD * 2, height - PAD * 2])
    .paddingInner(GAP)(root);

  const groups = Array.from(new Set(spec.cells.map((c) => c.group).filter(Boolean)));
  const leaves = laidOut.leaves();

  const colorFor = (cell: Cell, rank: number) => {
    if (cell.label === spec.highlight) return theme.accent;
    if (cell.group) return theme.seriesRamp[groups.indexOf(cell.group) % theme.seriesRamp.length];
    return theme.seriesRamp[Math.min(rank, theme.seriesRamp.length - 1)];
  };

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={spec.cells.map((c) => c.label).join(", ")}
        fontFamily={CHART_FONT_FAMILY}
        onMouseLeave={tooltip.hide}
      >
        <rect width={width} height={height} fill={theme.background} />
        <Group left={PAD} top={PAD}>
          {leaves.map((leaf, rank) => {
            const cell = leaf.data as Cell;
            const w = leaf.x1 - leaf.x0;
            const h = leaf.y1 - leaf.y0;
            const fill = colorFor(cell, rank);
            const isHighlighted = cell.label === spec.highlight;
            const showLabel = w >= MIN_LABEL_WIDTH && h >= MIN_LABEL_HEIGHT;
            const showValue = showLabel && h >= MIN_LABEL_HEIGHT + 14;
            const textColor = readableInk(fill, theme);
            const clipId = `treemap-clip-${spec.theme}-${rank}`;
            return (
              <Group
                key={cell.label}
                left={leaf.x0}
                top={leaf.y0}
                onMouseMove={(e) =>
                  tooltip.show({
                    title: cell.label,
                    label: formatPercentShare(cell.value, total),
                    value: formatValue(cell.value, spec.valueFormat),
                    ...svgPoint(e),
                  })
                }
              >
                <clipPath id={clipId}>
                  <rect width={Math.max(w - 8, 0)} height={h} />
                </clipPath>
                <rect width={w} height={h} fill={fill} rx={1.5} />
                <g clipPath={`url(#${clipId})`}>
                  {showLabel ? (
                    <MicroLabel x={10} y={18} fill={textColor} fontWeight={600} fontSize={LABEL_FONT_SIZE - 2}>
                      {cell.label}
                    </MicroLabel>
                  ) : null}
                  {showValue ? (
                    <text x={10} y={34} fontSize={LABEL_FONT_SIZE - 1} fill={textColor} fillOpacity={0.85}>
                      {formatValue(cell.value, spec.valueFormat)}
                      {mode === "full" ? ` · ${formatPercentShare(cell.value, total)}` : ""}
                    </text>
                  ) : null}
                </g>
              </Group>
            );
          })}
        </Group>
      </svg>
      <ChartTooltip datum={tooltip.datum} containerWidth={width} />
    </div>
  );
}
