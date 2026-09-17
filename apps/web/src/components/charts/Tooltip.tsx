"use client";
// Hover tooltip for full-mode charts: title line, then a micro label and a
// bold value. Positioned inside a `relative` wrapper by pixel offsets.
import { useState } from "react";

export interface TooltipDatum {
  title: string;
  label: string;
  value: string;
  x: number;
  y: number;
}

export function useChartTooltip(enabled: boolean) {
  const [datum, setDatum] = useState<TooltipDatum | null>(null);
  return {
    datum: enabled ? datum : null,
    show: enabled ? setDatum : () => {},
    hide: () => setDatum(null),
  };
}

/** Mouse position relative to the root <svg>, for placing the tooltip. */
export function svgPoint(e: React.MouseEvent<SVGElement>): { x: number; y: number } {
  const svg = e.currentTarget instanceof SVGSVGElement ? e.currentTarget : e.currentTarget.ownerSVGElement;
  const rect = svg?.getBoundingClientRect();
  return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
}

interface ChartTooltipProps {
  datum: TooltipDatum | null;
  containerWidth: number;
}

const TOOLTIP_WIDTH = 190;

export function ChartTooltip({ datum, containerWidth }: ChartTooltipProps) {
  if (!datum) return null;
  const flip = datum.x + TOOLTIP_WIDTH + 16 > containerWidth;
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-md bg-[#141414] px-3.5 py-2.5 text-[#ece6d8] shadow-lg"
      style={{
        left: flip ? datum.x - TOOLTIP_WIDTH - 12 : datum.x + 12,
        top: datum.y - 8,
        width: TOOLTIP_WIDTH,
      }}
    >
      <div className="text-[13px] font-semibold">{datum.title}</div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[9px] tracking-[0.12em] text-[#8a8580] uppercase">{datum.label}</span>
        <span className="text-[13px] font-semibold">{datum.value}</span>
      </div>
    </div>
  );
}
