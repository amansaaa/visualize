"use client";
// One feed card: the thumbnail chart bleeding edge to edge on the card's own
// theme background, with the agent's title below it on the same background.
import type { ChartSpec } from "@visualize/shared";

import { Chart } from "@/components/charts/Chart";
import { THUMBNAIL_ROW_CAP } from "@/components/charts/shared";
import type { PublishedVisualization } from "@/lib/feed";
import { themes } from "@/lib/themes";

/**
 * Charts need a pixel height, and the mockups stagger card heights by chart
 * form: ranking charts grow with their rows, a donut is close to square, a map
 * is wide and short. Derived from the spec so the same row always gets the same
 * height (no layout shift, and the masonry columns stagger like the mockup).
 */
export function thumbnailChartHeight(spec: ChartSpec, width: number): number {
  const rowHeight = (count: number, base: number, per: number) =>
    base + Math.min(count, THUMBNAIL_ROW_CAP) * per;

  let height: number;
  switch (spec.type) {
    case "bar":
      height = rowHeight(spec.rows.length, 52, 27);
      break;
    case "lollipop":
      height = rowHeight(spec.rows.length, spec.referenceLine ? 72 : 56, 30);
      break;
    case "dotCompare":
      height = rowHeight(spec.rows.length, 64, 30);
      break;
    case "column":
      height = width * 0.7;
      break;
    case "line":
      height = width * (spec.series.length > 1 ? 0.78 : 0.72);
      break;
    case "donut":
      height = width * 1.02;
      break;
    case "usMap":
      height = width * 0.68;
      break;
    case "treemap":
      height = width * 0.86;
      break;
  }

  // Keep every card within a sane aspect range whatever the column width is.
  return Math.round(Math.min(Math.max(height, width * 0.6), width * 1.35));
}

interface FeedCardProps {
  row: PublishedVisualization;
  /** Column width in pixels — the charts render at a fixed pixel size. */
  width: number;
  /** Wave 3 opens the read-only detail modal from here. */
  onOpen?: (row: PublishedVisualization) => void;
}

export function FeedCard({ row, width, onOpen }: FeedCardProps) {
  const theme = themes[row.spec.theme];
  const height = thumbnailChartHeight(row.spec, width);

  return (
    <button
      type="button"
      onClick={onOpen ? () => onOpen(row) : undefined}
      style={{ backgroundColor: theme.background }}
      className="block w-full cursor-pointer overflow-hidden rounded-[7px] text-left"
    >
      <Chart spec={row.spec} mode="thumbnail" width={width} height={height} />
      <h2
        style={{ color: theme.ink }}
        className="px-5 pt-[15px] pb-[19px] text-[15px] leading-[1.35]"
      >
        {row.title}
      </h2>
    </button>
  );
}
