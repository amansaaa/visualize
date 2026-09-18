// COMPOSE step: LLM picks chart type/theme and writes title, description, spec; code validates the choice.
// runCompose (manager) and attemptCompose (worker) logic (similar to consolidate.ts logic for extractRows()
import {
  chartSpecSchema,
  US_STATE_CODES,
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

// Catches chart-type/data mismatches Zod's schema can't express on its own.
// Returns a short reason string when unsuitable, or null when the choice is fine.
function checkChartTypeFits(type: ChartType, rows: DataRow[]): string | null {
  if (type === "donut" && rows.length > 6) {
    return "donut charts only fit six or fewer categories";
  }
  if (type === "usMap") {
    const stateCodes = new Set<string>(US_STATE_CODES);
    const looksLikeStates = rows.every((row) =>
      Object.values(row).some((value) => typeof value === "string" && stateCodes.has(value)),
    );
    if (!looksLikeStates) return "usMap requires every row to key by a US state code";
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
