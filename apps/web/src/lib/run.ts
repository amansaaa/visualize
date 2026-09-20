/**
 * Turns streamed backend events into the state the UI shows
 * stream.ts gives a stream of seperate events
 * This file puts together each event in the UI: which steps have searched, search links, whether there's a chart type, whether its finished
 */

import type {
  ComposeEvent,
  ConsolidateSummaryEvent,
  SearchResultLink,
  StepStartedEvent,
  StreamEvent,
} from "@visualize/shared";

type Step = StepStartedEvent["step"];

// Everything the workspace needs to draw one run: terminal lines, source links, the chart, and the saved id
export interface RunState {
  status: "running" | "done" | "error";
  steps: Step[];
  searches: { query: string; results: SearchResultLink[] }[];
  summary: ConsolidateSummaryEvent | null;
  composed: ComposeEvent | null;
  result: { id: string; createdAt: string } | null;
  error: { step: Step; message: string } | null;
}

// Each run (including each follow-up) starts from a fresh state
export function newRunState(): RunState {
  return {
    status: "running",
    steps: [],
    searches: [],
    summary: null,
    composed: null,
    result: null,
    error: null,
  };
}

// Returns a new state object instead of editing the old one, so React can tell something changed
export function applyEvent(state: RunState, event: StreamEvent): RunState {
  switch (event.type) {
    case "stepStarted":
      return { ...state, steps: [...state.steps, event.step] };
    case "searchResults":
      return { ...state, searches: [...state.searches, { query: event.query, results: event.results }] };
    case "consolidateSummary":
      return { ...state, summary: event };
    case "compose":
      return { ...state, composed: event };
    case "result":
      return { ...state, status: "done", result: { id: event.id, createdAt: event.createdAt } };
    case "error":
      return { ...state, status: "error", error: { step: event.step, message: event.message } };
  }
}

// For failures that never became an event (429, 400, dropped connection), i.e. errors thrown by streamGeneration
export function failRun(state: RunState, message: string): RunState {
  return { ...state, status: "error", error: { step: state.steps.at(-1) ?? "search", message } };
}
