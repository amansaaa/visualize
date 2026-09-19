// Helper that turns a normal Express response into an event stream and aborts on client disconnect.
// Client reads a SSE stream over a POST (file formats and sends those bytes, and detects when client disconnects)
import type { StreamEvent } from "@visualize/shared";
import type { Response } from "express";

/**
 * send: push one event (type: StreamEvent that we defined before)
 * close: end the response
 * signal: cancellation
 */
export interface EventStream {
  send(event: StreamEvent): void;
  close(): void;
  signal: AbortSignal;
}

// Called once per /generate request
export function openEventStream(res: Response): EventStream {
  /** Sets the three headers SSE requires 
   * text/event-stream: tells browser its a stream and not a normal response
   * no-cache: browsers/proxies shouldn't cache a live stream
   * keep-alive: ensures we don't close the TCP connection after just one stream
  */
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  // Immediately show the headers rather than the default buffering 
  res.flushHeaders();

  const controller = new AbortController();
  // Listen on res, not req: in modern Node, req 'close' fires as soon as the request body is read
  // (before this listener is attached), so it never signals a disconnect. res 'close' with
  // writableFinished=false means the client left before we finished writing.
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();
  });

  function send(event: StreamEvent): void {
    if (controller.signal.aborted || res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  function close(): void {
    if (!res.writableEnded) res.end();
  }

  return { send, close, signal: controller.signal };
}
