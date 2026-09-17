// Bits every chart component shares: prop shape, micro label, thumbnail fade.
import type { ChartTheme } from "@/lib/themes";

export type ChartMode = "thumbnail" | "full";

export interface ChartProps<S> {
  spec: S;
  mode?: ChartMode;
  width?: number;
  height?: number;
}

export const THUMBNAIL_ROW_CAP = 8;
export const LABEL_FONT_SIZE = 12;
export const MICRO_FONT_SIZE = 10;
// Rough average glyph width for a 12px sans-serif; avoids clipping long
// labels without measuring text in the DOM.
export const CHAR_WIDTH_ESTIMATE = 7;

export function estimateTextWidth(text: string, fontSize = LABEL_FONT_SIZE): number {
  return text.length * CHAR_WIDTH_ESTIMATE * (fontSize / LABEL_FONT_SIZE);
}

interface MicroLabelProps extends React.SVGProps<SVGTextElement> {
  children: React.ReactNode;
}

/** Uppercase, letter-spaced label for ticks, annotations, and captions. */
export function MicroLabel({ children, ...rest }: MicroLabelProps) {
  return (
    <text fontSize={MICRO_FONT_SIZE} letterSpacing="0.12em" fontWeight={500} {...rest}>
      {typeof children === "string" ? children.toUpperCase() : children}
    </text>
  );
}

interface ThumbnailFadeProps {
  id: string;
  width: number;
  height: number;
  theme: ChartTheme;
  fadeHeight?: number;
}

/** Bottom gradient that hides truncated rows in thumbnail mode. */
export function ThumbnailFade({ id, width, height, theme, fadeHeight = 48 }: ThumbnailFadeProps) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.background} stopOpacity={0} />
          <stop offset="100%" stopColor={theme.background} stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect x={0} y={height - fadeHeight} width={width} height={fadeHeight} fill={`url(#${id})`} />
    </>
  );
}

export function mixHex(hexA: string, hexB: string, t: number): string {
  const a = hexA.replace("#", "");
  const b = hexB.replace("#", "");
  const channel = (i: number) => {
    const ca = parseInt(a.slice(i, i + 2), 16);
    const cb = parseInt(b.slice(i, i + 2), 16);
    return Math.round(ca + (cb - ca) * t)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Whichever of ink / background reads better on top of `fill`. */
export function readableInk(fill: string, theme: ChartTheme): string {
  const l = luminance(fill);
  return Math.abs(l - luminance(theme.ink)) > Math.abs(l - luminance(theme.background))
    ? theme.ink
    : theme.background;
}

/** Font stack matching the mockups' sans-serif. Applied on the root <svg>. */
export const CHART_FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
