/**
 * CONSOLIDATE step (LLM extracts rows from scraped text, Zod validates, emits summary.)
 * Takes the raw scraped web text from SEARCH and turns it to validated data that COMPOSE will use
 * WILL retry if validation fails in extractRows (same idea as manager/worker login in compose.ts)
 */
import { dataRowSchema, type DataRow, type Source, type StreamEvent } from "@visualize/shared";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "../lib/llm";
import type { TavilySearchResult } from "../lib/tavily";
import type { SearchStepResult } from "./search";

// What orchestrator passes into COMPOSE step
export interface ConsolidateResult {
  rows: DataRow[];
  summary: { rowCount: number; sourceCount: number; dateRange: string | null };
  sources: Source[];
}

const consolidateOutputSchema = z.object({
  rows: z.array(dataRowSchema).min(1),
});

// Builds a prompt containing user's question and instructions on formatting the data from the sources
async function extractRows(
  prompt: string,
  scraped: SearchStepResult["scraped"],
  signal: AbortSignal,
): Promise<DataRow[]> {
  const sourceText = scraped
    /** Truncate each web page to 2000 characters (arbitrary) 
     * Some webpages may have over 10K characters and with X many web pages 
     * may explode the context window of the LLM
     * Hence, an rough approximation of 2000 characters (may need to change though)
    */
    .flatMap((s) => s.results)
    .map((r) => `### ${r.title} (${r.url})\n${r.content.slice(0, 2000)}`)
    .join("\n\n");

  const { object } = await generateObject({
    model: getModel(),
    schema: consolidateOutputSchema,
    abortSignal: signal,
    prompt: [
      `Question: "${prompt}"`,
      "Extract the relevant data as a list of rows from the sources below.",
      'Use short, readable field names (e.g. "year", "streams"), never single letters like "v".',
      "Every value must be the correct type: numbers as numbers, not strings.",
      "",
      sourceText,
    ].join("\n"),
  });

  return object.rows;
}

// To avoid having two sources that are identical (ensures every unique page scraped gets one entry)
function dedupeSources(results: TavilySearchResult[]): Source[] {
  const byUrl = new Map<string, Source>();
  for (const { domain, title, url } of results) {
    if (!byUrl.has(url)) byUrl.set(url, { domain, title, url });
  }
  return [...byUrl.values()];
}

// Fills the "date range" slot in CONSOLIDATE's summary line (rows/sources/date range).
// Scans row values for year-like numbers; returns null when the data isn't time-based.
function computeDateRange(rows: DataRow[]): string | null {
  const years: number[] = [];
  for (const row of rows) {
    for (const value of Object.values(row)) {
      if (typeof value === "number" && value >= 1500 && value <= 2100) {
        years.push(value);
      } else if (typeof value === "string" && /^\d{4}$/.test(value)) {
        years.push(Number(value));
      }
    }
  }
  if (years.length === 0) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

// Entry point for CONSOLIDATE step
export async function runConsolidate(
  prompt: string,
  scraped: SearchStepResult["scraped"],
  emit: (event: StreamEvent) => void,
  signal: AbortSignal,
): Promise<ConsolidateResult> {
  // Output to the terminal the current step that we're on
  emit({ type: "stepStarted", step: "consolidate" });

  /**
   * Retry logic (if validation fails twice then we produce an error)
   * i.e attempt 1 fails if LLM's output fails Zod schema validation or network call failed 
  */ 
  let rows: DataRow[];
  try {
    rows = await extractRows(prompt, scraped, signal);
  } catch {
    rows = await extractRows(prompt, scraped, signal);
  }

  // Convert scraped list of lists to one flat list, then collapse any duplicate URL
  const sources = dedupeSources(scraped.flatMap((s) => s.results));

  // Scans through year-like numbers (4 digit numerics within 1500 - 2100) to provide data range of sources the LLM used
  const dateRange = computeDateRange(rows);

  const summary = { rowCount: rows.length, sourceCount: sources.length, dateRange };

  emit({ type: "consolidateSummary", ...summary, sources });

  return { rows, summary, sources };
}
