// Orchestrator: plan → SEARCH → CONSOLIDATE → COMPOSE → save → result.
import type { DataRow, GenerateRequest, Source, StreamEvent } from "@visualize/shared";
import { runCompose } from "./compose";
import { runConsolidate } from "./consolidate";
import { plan } from "./plan";
import { runSearch } from "./search";
import { saveDraft } from "./save";

// Failure caused by cancellation (i.e Error object and DOMException("Aborted, "AbortError"))
function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

// Any other error if err wasn't an Error object
function shortReason(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 200);
  return "Something went wrong";
}


export async function runPipeline(
  input: GenerateRequest,
  emit: (event: StreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  // mutable variable that tracks which step we're currently on
  let step: "search" | "consolidate" | "compose" = "search";

  try {
    // calling plan (loading the parent if exists, calling the LLM) and returns PlanContext object to ctx
    const ctx = await plan(input, signal);
    if (signal.aborted) return;

    let rows: DataRow[];
    let sources: Source[];
    
    // Executes both search and consolidate steps
    if (ctx.needsSearch) {
      step = "search";
      const { scraped } = await runSearch(ctx.queries, emit, signal);
      if (signal.aborted) return;

      step = "consolidate";
      const consolidated = await runConsolidate(input.prompt, scraped, emit, signal);
      rows = consolidated.rows;
      sources = consolidated.sources;
    // Runs neither steps; pulls rows and sources from parent
    } else {
      rows = (ctx.parent?.data ?? []) as DataRow[];
      sources = (ctx.parent?.sources ?? []) as Source[];
    }
    if (signal.aborted) return;

    // Compose runs regardless of how the data was filled (by requiring search + consoldiate, or pulling from parent)
    step = "compose";
    const composed = await runCompose(input.prompt, rows, sources, ctx.parent?.spec ?? null, emit, signal);
    if (signal.aborted) return;

    // Write to DB with results
    const saved = await saveDraft({
      parentId: input.parentId ?? null,
      prompt: input.prompt,
      title: composed.title,
      description: composed.description,
      data: rows,
      spec: composed.spec,
      sources,
    });

    // Tell's client its done
    emit({ type: "result", id: saved.id, createdAt: saved.createdAt.toISOString() });
  // If any await anywhere above throws, then execution jumps straight here
  } catch (err) {
    if (isAbortError(err)) return;
    emit({ type: "error", step, message: shortReason(err) });
  }
}
