"use client";
// Renders streamed step lines with clickable source links.
//
// Everything here is derived from RunState and nothing else. 
// The terminal shows *only* step lines and source links.
import type { SearchResultLink, Source } from "@visualize/shared";

import type { RunState } from "@/lib/run";

/** Search results shown per query before collapsing into "+N more". */
const MAX_LINKS = 6;

type Step = RunState["steps"][number];

/** Sentence-case wording for the step that is still in flight. */
const RUNNING_LABEL: Record<Step, string> = {
  search: "Searching",
  consolidate: "Consolidating",
  compose: "Composing",
};

type LineState = "done" | "running" | "error";

const DOT_CLASS: Record<LineState, string> = {
  done: "bg-status-done",
  running: "bg-status-running",
  error: "bg-[#e0614a]",
};

/**
 * One terminal row: status dot, step label, content column. A finished line
 * gets the uppercase micro label; the line in flight gets sentence case
 * instead — that contrast is deliberate in the mockups.
 */
function Line({
  step,
  state,
  children,
}: {
  step: Step;
  state: LineState;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 py-[7px]">
      <span className="flex w-[6px] shrink-0 justify-center pt-[7px]">
        <span className={`h-[6px] w-[6px] rounded-full ${DOT_CLASS[state]}`} />
      </span>
      {state === "running" ? (
        <span className="text-ink-muted shrink-0 pt-[1px] text-[12px] leading-[1.5]">
          {RUNNING_LABEL[step]}
        </span>
      ) : (
        <span className="text-ink-muted w-[84px] shrink-0 pt-[3px] text-[10px] leading-[1.6] tracking-[0.18em] uppercase">
          {step}
        </span>
      )}
      {children ? <div className="min-w-0 flex-1">{children}</div> : null}
    </div>
  );
}

/** `domain — title`: the domain bright, the title half dim, never underlined. */
export function SourceLine({
  link,
  clamp = 1,
}: {
  link: SearchResultLink | Source;
  clamp?: 1 | 2;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className={`block text-[12.5px] leading-[1.5] no-underline ${clamp === 1 ? "truncate" : ""}`}
    >
      <span className="text-ink/80">{link.domain}</span>
      <span className="text-link-dim"> — {link.title}</span>
    </a>
  );
}

function MoreCount({ count }: { count: number }) {
  return <div className="text-link-dim pt-[2px] text-[12.5px] leading-[1.5]">+{count} more</div>;
}

function LinkList({ links }: { links: (SearchResultLink | Source)[] }) {
  return (
    <div className="pt-[3px]">
      {links.slice(0, MAX_LINKS).map((link) => (
        <SourceLine key={link.url} link={link} />
      ))}
      {links.length > MAX_LINKS ? <MoreCount count={links.length - MAX_LINKS} /> : null}
    </div>
  );
}

interface TerminalProps {
  run: RunState;
}

export function Terminal({ run }: TerminalProps) {
  // The step in flight is the last one started, while the run is still running.
  const inFlight = run.status === "running" ? (run.steps.at(-1) ?? null) : null;

  // Content arrives after its stepStarted, so a step can be both "in flight"
  // and already have lines to show (search results stream in one query at a
  // time). Content lines render as done; the in-flight marker follows them.
  const content = (step: Step) => {
    if (step === "search") {
      return run.searches.map((search) => (
        <Line key={search.query} step="search" state="done">
          <div className="text-ink truncate text-[13.5px] leading-[1.5]">
            &quot;{search.query}&quot;
          </div>
          <LinkList links={search.results} />
        </Line>
      ));
    }

    if (step === "consolidate") {
      const summary = run.summary;
      if (!summary) return null;
      return (
        <Line step="consolidate" state="done">
          <div className="text-ink text-[13.5px] leading-[1.5]">
            {summary.rowCount} rows · {summary.sourceCount} sources
            {summary.dateRange ? ` · ${summary.dateRange}` : ""}
          </div>
          <LinkList links={summary.sources} />
        </Line>
      );
    }

    if (!run.composed) return null;
    return (
      <Line step="compose" state="done">
        <div className="text-ink text-[13.5px] leading-[1.5]">{run.composed.title}</div>
      </Line>
    );
  };

  return (
    <div className="flex flex-col">
      {run.steps.map((step, index) => (
        <div key={`${step}-${index}`}>
          {content(step)}
          {step === inFlight && index === run.steps.length - 1 ? (
            <Line step={step} state="running" />
          ) : null}
        </div>
      ))}

      {/* Inline at the step it failed on — which failRun and the backend both
          report as the last step started (or "search" if none had). */}
      {run.error ? (
        <Line step={run.error.step} state="error">
          <div className="text-[13.5px] leading-[1.5] text-[#e0614a]">{run.error.message}</div>
        </Line>
      ) : null}
    </div>
  );
}
