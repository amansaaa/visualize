"use client";
// Throwaway harness: exercises streamGeneration, applyEvent and publishVisualization in a real browser.
import { useEffect, useRef, useState } from "react";
import { publishVisualization } from "@/app/actions";
import { Chart } from "@/components/charts/Chart";
import { applyEvent, failRun, newRunState, type RunState } from "@/lib/run";
import { GenerateError, streamGeneration } from "@/lib/stream";

export function StreamTest() {
  const [prompt, setPrompt] = useState("Top 5 tallest mountains in the world");
  const [run, setRun] = useState<RunState | null>(null);
  const [publishMessage, setPublishMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Leaving the page cancels any run in flight
  useEffect(() => () => abortRef.current?.abort(), []);

  async function start(parentId?: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPublishMessage("");
    let state = newRunState();
    setRun(state);

    try {
      for await (const event of streamGeneration({ prompt, parentId }, controller.signal)) {
        state = applyEvent(state, event);
        setRun(state);
      }
    } catch (err) {
      if (controller.signal.aborted) setRun(failRun(state, "Cancelled."));
      else if (err instanceof GenerateError) setRun(failRun(state, err.message));
      else setRun(failRun(state, `Unexpected error: ${String(err)}`));
    }
  }

  async function publish(id: string) {
    const result = await publishVisualization(id);
    setPublishMessage(JSON.stringify(result));
  }

  const running = run?.status === "running";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
        />
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => start()}
            disabled={running}
            className="rounded bg-neutral-200 px-3 py-1.5 text-neutral-900 disabled:opacity-40"
          >
            Run
          </button>
          <button
            onClick={() => start(run?.result?.id)}
            disabled={running || !run?.result}
            className="rounded bg-neutral-700 px-3 py-1.5 disabled:opacity-40"
          >
            Send as follow-up
          </button>
          <button
            onClick={() => abortRef.current?.abort()}
            disabled={!running}
            className="rounded bg-neutral-700 px-3 py-1.5 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>

      {run ? (
        <div className="flex flex-col gap-4 text-sm">
          <p data-testid="status">
            status: <span className="text-neutral-100">{run.status}</span>
            {run.result ? <> · saved id: <span className="text-neutral-100">{run.result.id}</span></> : null}
          </p>

          <ul className="flex flex-col gap-2">
            {run.steps.map((step) => (
              <li key={step}>
                <span className="tracking-[0.2em] text-neutral-100 uppercase">{step}</span>
                {step === "search" ? (
                  <ul className="mt-1 flex flex-col gap-2 pl-4">
                    {run.searches.map((s) => (
                      <li key={s.query}>
                        <div className="text-neutral-500">{s.query}</div>
                        {s.results.map((r) => (
                          <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="block underline">
                            {r.domain} — {r.title}
                          </a>
                        ))}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {step === "consolidate" && run.summary ? (
                  <div className="pl-4 text-neutral-500">
                    {run.summary.rowCount} rows · {run.summary.sourceCount} sources · {run.summary.dateRange ?? "no date range"}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          {run.error ? (
            <p className="text-red-400">
              error at {run.error.step}: {run.error.message}
            </p>
          ) : null}

          {run.composed ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg text-neutral-100">{run.composed.title}</h2>
              <p className="text-neutral-500">
                {run.composed.spec.type} · {run.composed.spec.theme}
              </p>
              <div className="overflow-hidden rounded-2xl">
                <Chart spec={run.composed.spec} mode="full" width={700} height={420} />
              </div>
              <p>{run.composed.description}</p>
            </div>
          ) : null}

          {run.result ? (
            <div className="flex items-center gap-3">
              <button onClick={() => publish(run.result!.id)} className="rounded bg-neutral-200 px-3 py-1.5 text-neutral-900">
                Publish
              </button>
              <span data-testid="publish-message" className="text-neutral-500">
                {publishMessage}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
