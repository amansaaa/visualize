// Session tray: bottom right popup that lets you revisit an unpublished draft
// in your current browser session if you clicked outside of the workspace modal
// (i.e this browser session's finished-but-unpublished runs)

// sessionStorage only: the tray never involves the server or the
// DB, and the app stores nothing identifying. Entries die with the tab.
//
// Everything here is deliberately total: every access is wrapped, because
// `sessionStorage` is not merely empty but *throws on property access* in some
// privacy modes, and the stored JSON can be anything (another tab, an older
// build, a user poking at devtools). Failures degrade to an empty tray rather
// than taking the page down.
import { type ComposeEvent, composeEventSchema } from "@visualize/shared";

const STORAGE_KEY = "visualize.session-runs";

/**
 * One finished run. Holds the whole composed payload, not just the id, so
 * reopening its workspace is instant and needs no network round trip — and so
 * the tray still works if the API has gone away.
 */
export interface SessionRun {
  /** The saved draft's row id — what Publish sends, and the identity here. */
  id: string;
  /** The prompt that opened the workspace (the panel's heading). */
  prompt: string;
  /** Everything needed to redraw the chart and the workspace around it. */
  chart: ComposeEvent;
  createdAt: string;
}

function isSessionRun(value: unknown): value is SessionRun {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.prompt === "string" &&
    typeof candidate.createdAt === "string" &&
    composeEventSchema.safeParse(candidate.chart).success
  );
}

/** Never throws: an unavailable, empty or corrupt store all read as no runs. */
export function readSessionRuns(): SessionRun[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSessionRun) : [];
  } catch {
    return [];
  }
}

/**
 * Persists and returns the list, so callers can use the return value as React
 * state whether or not the write actually landed.
 */
function writeSessionRuns(runs: SessionRun[]): SessionRun[] {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    // Storage full, disabled or blocked: the tray just won't survive a reload.
  }
  return runs;
}

/**
 * Idempotent by id: re-saving the same run replaces it in place instead of
 * duplicating it or jumping it to the front, which lets HomeShell call this
 * from an effect without tracking what it has already saved.
 */
export function saveSessionRun(run: SessionRun): SessionRun[] {
  const existing = readSessionRuns();
  const index = existing.findIndex((entry) => entry.id === run.id);
  if (index === -1) return writeSessionRuns([run, ...existing]);

  const next = [...existing];
  next[index] = run;
  return writeSessionRuns(next);
}

/** Used by both the tray's × and a successful publish. */
export function removeSessionRun(id: string): SessionRun[] {
  return writeSessionRuns(readSessionRuns().filter((entry) => entry.id !== id));
}
