// SEARCH step: runs queries through Tavily, emits result links.
import type { StreamEvent } from "@visualize/shared";
import { searchTavily, type TavilySearchResult } from "../lib/tavily";

// Internal return value the orchestrator passes on to CONSOLIDATE
export interface SearchStepResult {
  scraped: { query: string; results: TavilySearchResult[] }[];
}

// Called once per request (entry point of each request)
export async function runSearch(
  queries: string[],
  // emit so we can show SEARCH immediately before first query finishes
  emit: (event: StreamEvent) => void,
  signal: AbortSignal,
): Promise<SearchStepResult> {
  emit({ type: "stepStarted", step: "search" });

  const scraped: SearchStepResult["scraped"] = [];
  
  // Break if ever user disconnects midway through each query that we're iterating
  for (const query of queries) {
    if (signal.aborted) break;

    const results = await searchTavily(query, signal);
    scraped.push({ query, results });

    emit({
      type: "searchResults",
      query,
      results: results.map(({ domain, title, url }) => ({ domain, title, url })),
    });
  }

  return { scraped };
}
