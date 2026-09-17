// Zod discriminated union of chart specs (one schema per v1 chart type).
// The agent chooses *what* (type, theme, highlight, annotations); the React
// components in apps/web own *how* it's drawn.
import { z } from "zod";
import { THEME_NAMES } from "./themes";
import { US_STATE_CODES } from "./usStates";

export const valueFormatSchema = z.enum(["compact", "currency", "percent", "duration"]).default("compact");
export type ValueFormat = z.infer<typeof valueFormatSchema>;

const labelValueRow = z.object({
  label: z.string().min(1),
  value: z.number(),
});

const base = {
  theme: z.enum(THEME_NAMES),
  valueFormat: valueFormatSchema,
};

const highlightInLabels = (labels: string[], highlight: string | undefined) =>
  highlight === undefined || labels.includes(highlight);

const HIGHLIGHT_ERROR = { message: "highlight must match an existing label", path: ["highlight"] };

const barChartSpecSchema = z
  .object({
    type: z.literal("bar"),
    ...base,
    rows: z.array(labelValueRow).min(1),
    highlight: z.string().optional(),
    /** Numbered "01 / 02" ranking variant with the label inside the bar. */
    showRank: z.boolean().optional(),
  })
  .refine((s) => highlightInLabels(s.rows.map((r) => r.label), s.highlight), HIGHLIGHT_ERROR);

const lollipopChartSpecSchema = z
  .object({
    type: z.literal("lollipop"),
    ...base,
    rows: z.array(labelValueRow).min(1),
    highlight: z.string().optional(),
    /** Dashed vertical guide, e.g. { value: 3, label: "3× affordable" }. */
    referenceLine: z.object({ value: z.number(), label: z.string().min(1) }).optional(),
  })
  .refine((s) => highlightInLabels(s.rows.map((r) => r.label), s.highlight), HIGHLIGHT_ERROR);

const columnChartSpecSchema = z
  .object({
    type: z.literal("column"),
    ...base,
    /** label is the x category (usually a year or month). */
    rows: z.array(labelValueRow).min(2),
    highlight: z.string().optional(),
    /** Short uppercase notes attached to a column, e.g. { label: "2020", text: "COVID" }. */
    annotations: z.array(z.object({ label: z.string().min(1), text: z.string().min(1) })).max(3).optional(),
  })
  .refine((s) => highlightInLabels(s.rows.map((r) => r.label), s.highlight), HIGHLIGHT_ERROR)
  .refine(
    (s) => (s.annotations ?? []).every((a) => s.rows.some((r) => r.label === a.label)),
    { message: "annotation labels must match a row label", path: ["annotations"] },
  );

const lineSeriesSchema = z.object({
  name: z.string().min(1),
  points: z.array(z.object({ x: z.string().min(1), y: z.number() })).min(2),
});

const lineChartSpecSchema = z
  .object({
    type: z.literal("line"),
    ...base,
    series: z.array(lineSeriesSchema).min(1).max(4),
    /** Fill under the line (single or highlighted series only). */
    area: z.boolean().optional(),
    /** Series name to render in the accent color. */
    highlight: z.string().optional(),
    /** Notes pinned to an x value, e.g. { x: "2020", text: "Pandemic" }. */
    annotations: z.array(z.object({ x: z.string().min(1), text: z.string().min(1) })).max(3).optional(),
  })
  .refine((s) => highlightInLabels(s.series.map((r) => r.name), s.highlight), HIGHLIGHT_ERROR)
  .refine(
    (s) => (s.annotations ?? []).every((a) => s.series.some((ser) => ser.points.some((p) => p.x === a.x))),
    { message: "annotation x must match a point", path: ["annotations"] },
  );

const donutChartSpecSchema = z
  .object({
    type: z.literal("donut"),
    ...base,
    parts: z.array(labelValueRow).min(2).max(6),
    /** Micro label under the center total, e.g. "2024 GLOBAL TOTAL". */
    centerLabel: z.string().min(1),
    /** Defaults to the sum of parts. */
    centerValue: z.number().optional(),
    highlight: z.string().optional(),
  })
  .refine((s) => highlightInLabels(s.parts.map((r) => r.label), s.highlight), HIGHLIGHT_ERROR);

const usMapChartSpecSchema = z
  .object({
    type: z.literal("usMap"),
    ...base,
    rows: z.array(z.object({ state: z.enum(US_STATE_CODES), value: z.number() })).min(1),
    highlight: z.string().optional(),
  })
  .refine((s) => new Set(s.rows.map((r) => r.state)).size === s.rows.length, {
    message: "duplicate state",
    path: ["rows"],
  })
  .refine((s) => highlightInLabels(s.rows.map((r) => r.state), s.highlight), HIGHLIGHT_ERROR);

const treemapChartSpecSchema = z
  .object({
    type: z.literal("treemap"),
    ...base,
    cells: z
      .array(z.object({ label: z.string().min(1), value: z.number().positive(), group: z.string().optional() }))
      .min(3),
    highlight: z.string().optional(),
  })
  .refine((s) => highlightInLabels(s.cells.map((r) => r.label), s.highlight), HIGHLIGHT_ERROR);

const dotCompareChartSpecSchema = z
  .object({
    type: z.literal("dotCompare"),
    ...base,
    series: z.array(z.string().min(1)).min(2).max(4),
    rows: z.array(z.object({ label: z.string().min(1), values: z.array(z.number()) })).min(1),
    highlight: z.string().optional(),
  })
  .refine((s) => s.rows.every((r) => r.values.length === s.series.length), {
    message: "each row needs one value per series",
    path: ["rows"],
  })
  .refine((s) => highlightInLabels(s.rows.map((r) => r.label), s.highlight), HIGHLIGHT_ERROR);

export const chartSpecSchema = z.discriminatedUnion("type", [
  barChartSpecSchema,
  lollipopChartSpecSchema,
  columnChartSpecSchema,
  lineChartSpecSchema,
  donutChartSpecSchema,
  usMapChartSpecSchema,
  treemapChartSpecSchema,
  dotCompareChartSpecSchema,
]);

export const CHART_TYPES = [
  "bar",
  "lollipop",
  "column",
  "line",
  "donut",
  "usMap",
  "treemap",
  "dotCompare",
] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export type ChartSpec = z.infer<typeof chartSpecSchema>;
export type BarChartSpec = z.infer<typeof barChartSpecSchema>;
export type LollipopChartSpec = z.infer<typeof lollipopChartSpecSchema>;
export type ColumnChartSpec = z.infer<typeof columnChartSpecSchema>;
export type LineChartSpec = z.infer<typeof lineChartSpecSchema>;
export type DonutChartSpec = z.infer<typeof donutChartSpecSchema>;
export type UsMapChartSpec = z.infer<typeof usMapChartSpecSchema>;
export type TreemapChartSpec = z.infer<typeof treemapChartSpecSchema>;
export type DotCompareChartSpec = z.infer<typeof dotCompareChartSpecSchema>;
