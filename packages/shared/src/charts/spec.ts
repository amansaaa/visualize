// Zod discriminated union of chart specs (one schema per v1 chart type).
// Only "bar" (horizontal bar ranking) exists so far; the rest of the v1
// catalog gets added as its own object + one line in the union below.
import { z } from "zod";
import { THEME_NAMES } from "./themes.js";

// Enforce non-empty string and strict number for value
const barRowSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
});

// Blueprint for Bar Chart
const barChartSpecSchema = z.object({
  type: z.literal("bar"),
  theme: z.enum(THEME_NAMES),
  /** Requires atleast one barRowSchema object so bar chart isn't empty */
  rows: z.array(barRowSchema).min(1),
  /** Row label to render in the accent color; omit for no highlight. */
  highlight: z.string().optional(),
  valueFormat: z.enum(["compact", "currency", "percent"]).default("compact"),
});

// Main schema app will use to validate incoming data
export const chartSpecSchema = z
  /** Discriminator is "type": i.e bar, pie, line to apply strictly the rules of "type" */
  .discriminatedUnion("type", [barChartSpecSchema])
  /** Zod rejects if agent tries to highlight a specific row that doesn't exist */
  .refine(
    (spec) => spec.highlight === undefined || spec.rows.some((row) => row.label === spec.highlight),
    { message: "highlight must match a row label", path: ["highlight"] },
  );

// Translates Zod validations to TypeScript types automatically
export type ChartSpec = z.infer<typeof chartSpecSchema>;
export type BarChartSpec = z.infer<typeof barChartSpecSchema>;
