/**
 * apps/api sends events down an open connection; this file reads them 
 * and turns them back into typed StreamEvent objects and hands them to the UI at a time
 * (i.e apps/api/src/lib/sse.ts writes events into the response whereas this file reads events out of the response)
 */

// Client helper: POST /generate and read streamed events.
import { streamEventSchema, type GenerateRequest, type StreamEvent } from "@visualize/shared";

// Thrown for anything that stops a run before the backend can report it (HTTP errors, dropped connection).
// The message is written for the user to read.
export class GenerateError extends Error {}

function messageForStatus(status: number): string {
  if (status === 429) return "You've reached the limit of 10 generations per hour. Try again later.";
  if (status === 400) return "That request wasn't valid. Try rephrasing your question.";
  return "Something went wrong reaching the server. Try again.";
}

// Yields each typed event as the backend streams it. Cancel a run by aborting `signal`.
// * makes it an async generator (i.e function that can hand back values one at time using yield)
export async function* streamGeneration(
  request: GenerateRequest,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  // Must be written literally as process.env.NEXT_PUBLIC_API_URL so Next can inline it at build time
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new GenerateError("NEXT_PUBLIC_API_URL is not set");

  // fetch (not EventSource), because EventSource can only send GET requests
  const response = await fetch(`${apiUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok || !response.body) throw new GenerateError(messageForStatus(response.status));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawFinalEvent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // A network chunk can end mid-event, so text piles up in `buffer` until a full event arrives
      buffer += decoder.decode(value, { stream: true });

      // A blank line ends each SSE event; the last piece may be incomplete, so keep it in the buffer
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
        if (!dataLine) continue;

        // Validate against the shared schema so a malformed event fails loudly here, not somewhere in the UI
        const event = streamEventSchema.parse(JSON.parse(dataLine.slice("data: ".length)));
        if (event.type === "result" || event.type === "error") sawFinalEvent = true;
        yield event;
      }
    }

    if (!sawFinalEvent) throw new GenerateError("The connection closed before the run finished.");
  } finally {
    // Also runs if the caller stops reading early; cancelling closes the connection, which cancels the run on the server
    reader.cancel().catch(() => {});
  }
}
