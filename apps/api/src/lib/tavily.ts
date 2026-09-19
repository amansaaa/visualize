// Tavily search client.
import { tavily } from "@tavily/core";
import type { SearchResultLink } from "@visualize/shared";
import { env } from "../env";

const client = tavily({ apiKey: env.TAVILY_API_KEY });

/** 
 * Adds one more field: content, to SearchResultLink it extended from 
 * SSE events only need domain/title/url for the clickable link the terminal shows
 * CONSOLIDATE needs the page text to extract rows from 
*/ 
export interface TavilySearchResult extends SearchResultLink {
  content: string;
}

/**
 * Promise that never resolves and only rejects when the signal listens "abort"
 * Purpose is to be raced against something else
 */
function abortPromise(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
      once: true,
    });
  });
}


export async function searchTavily(query: string, signal: AbortSignal): Promise<TavilySearchResult[]> {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");

  // Promise.race resolves/rejects with whichever promise finishes first
  // (i.e user disconnects -> cancel OR we hit the maximum results)
  // includeRawContent asks Tavily for the full page text; the default `content` is only a
  // ~500-1300 character snippet, too short to hold a table of 8 countries or 51 states
  const response = await Promise.race([
    client.search(query, { maxResults: 5, includeRawContent: "text" }),
    abortPromise(signal),
  ]);

  // Reshapes Tavily's response into the schema we expect every time
  return response.results.map((result) => ({
    domain: new URL(result.url).hostname,
    title: result.title,
    url: result.url,
    // Some pages can't be scraped, so fall back to the snippet when there's no raw text
    content: result.rawContent || result.content,
  }));
}
