// COMPOSE step: LLM picks chart type/theme and writes title, description, spec; code validates the choice.
// runCompose (manager) and attemptCompose (worker) logic (similar to consolidate.ts logic for extractRows()
import {
  chartSpecSchema,
  US_STATES,
  type ChartSpec,
  type ChartType,
  type DataRow,
  type Source,
  type StreamEvent,
} from "@visualize/shared";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "../lib/llm";

// Saved to DB and shown in the workspace
export interface ComposeResult {
  title: string;
  description: string;
  spec: ChartSpec;
}
// Passing in spec handles the most of the validation for composeOutputSchema
const composeOutputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  spec: chartSpecSchema,
});

// What the LLM is told about each chart type and number format. Keep in sync with
// packages/shared/src/charts/spec.ts and apps/web/src/lib/format.ts.
const CHART_GUIDE = `
Pick the chart type that fits the shape of the data. Bar suits plain rankings, but not time series, parts of a whole, or per-state data.
- bar: categories ranked by one value. Set showRank for "top N" lists.
- lollipop: a ranking of ratios or scores rather than totals. Optional referenceLine for a benchmark.
- column: one value across time (years or months), at least 2 periods. Each label is a period.
- line: trends over time; use it for many periods or several series (up to 4).
- donut: parts of a whole, ONLY when the data has 6 or fewer categories.
- treemap: parts of a whole with many categories (7 or more). Values must be positive.
- usMap: one value per US state. Use 2-letter USPS codes (convert names, e.g. California to CA) and drop non-state rows.
- dotCompare: 2 to 4 measurements per item (e.g. men vs women per country). Each row gets one value per series name.

valueFormat controls how numbers print. Use the raw numbers from the data and never rescale them.
- compact: counts, quantities and ratios (1.4B, 107,941, 14.1).
- currency: US dollar amounts.
- percent: the number is already a percentage (21.2 prints as 21.2%).
- duration: ONLY lengths of time measured in minutes (148 prints as 2h 28m). Never for years, ages or life expectancy.

Highlight the single most notable item (the top or the peak), or omit highlight. Pick a theme that suits the topic.
Title: a short editorial headline. Description: one or two sentences on what the chart shows, with units and time period.
`.trim();

const STATE_NAMES_AND_CODES = new Set<string>(US_STATES.flatMap((s) => [s.code, s.name]));

// Catches chart-type/data mismatches Zod's schema can't express on its own.
// Returns a short reason string when unsuitable, or null when the choice is fine.
function checkChartTypeFits(type: ChartType, rows: DataRow[]): string | null {
  if (type === "donut" && rows.length > 6) {
    return "donut charts only fit six or fewer categories";
  }
  if (type === "usMap") {
    // Rows may hold a state name or a code, and a stray non-state row (e.g. "Federal") is tolerated
    const stateRows = rows.filter((row) =>
      Object.values(row).some((value) => typeof value === "string" && STATE_NAMES_AND_CODES.has(value)),
    );
    if (stateRows.length < rows.length * 0.8) return "usMap needs data where each row is a US state";
  }
  return null;
}

// One ask to the LLM for a chart type/theme/title/description. Called twice by runCompose:
// once plain, and again with `hint` set to feed back why the first choice didn't fit.
async function attemptCompose(
  prompt: string,
  rows: DataRow[],
  priorSpec: ChartSpec | null,
  hint: string | undefined,
  signal: AbortSignal,
): Promise<ComposeResult> {
  const { object } = await generateObject({
    model: getModel(),
    schema: composeOutputSchema,
    abortSignal: signal,
    prompt: [
      `Question: "${prompt}"`,
      priorSpec ? `Current chart type: ${priorSpec.type}` : null,
      CHART_GUIDE,
      "Data rows:",
      JSON.stringify(rows),
      "Pick the chart type and theme that best fit this data, and write a title and description.",
      hint ? `Your last choice didn't work: ${hint}. Pick a different chart type this time.` : null,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });

  return object;
}

// Builds a plain bar spec directly in code, no LLM call, so the run always finishes with something to show.
// Default to bar for fallback as the safe choice as its schema has the least constraints (packages/shared/src/charts/spec.ts for barChartSpecSchema)
function fallbackToBar(rows: DataRow[], title: string, description: string): ComposeResult {
  const [firstRow] = rows;
  const numericField = firstRow && Object.entries(firstRow).find(([, v]) => typeof v === "number")?.[0];
  const labelField = firstRow && Object.keys(firstRow).find((key) => key !== numericField);

  const barRows =
    numericField && labelField
      ? rows.map((row) => ({ label: String(row[labelField]), value: Number(row[numericField]) }))
      : rows.map((_, i) => ({ label: `Row ${i + 1}`, value: 0 }));

  return {
    title,
    description,
    spec: {
      type: "bar",
      theme: "near-black",
      valueFormat: "compact",
      rows: barRows,
    },
  };
}

/** 
 * attemptCompose makes one LLM call and blindly returns it outputs whereas
 * runCompose judges the result and decides whether to try again or to display the output  */
export async function runCompose(
  prompt: string,
  rows: DataRow[],
  sources: Source[],
  priorSpec: ChartSpec | null,
  emit: (event: StreamEvent) => void,
  signal: AbortSignal,
): Promise<ComposeResult> {
  emit({ type: "stepStarted", step: "compose" });

  let attempt = await attemptCompose(prompt, rows, priorSpec, undefined, signal);
  let reason = checkChartTypeFits(attempt.spec.type, rows);

  if (reason) {
    attempt = await attemptCompose(prompt, rows, priorSpec, reason, signal);
    reason = checkChartTypeFits(attempt.spec.type, rows);
  }

  const result = reason ? fallbackToBar(rows, attempt.title, attempt.description) : attempt;

  emit({
    type: "compose",
    title: result.title,
    description: result.description,
    spec: result.spec,
    data: rows,
    sources,
  });

  return result;
}
