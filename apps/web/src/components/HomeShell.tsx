"use client";

// Decides what is currently on the screen right now (client shell for the route)

// Everything the app does happens in overlays on top of the server-rendered feed -
// the URL endpoint  never changes — so this component owns which overlay is open, the run in flight,
// its abort controller, and the prompts that produced it. 
//
// HomeShell remembers which component is open in memory (compose modal, workspace, detail modal) as
// they're all on the same endpoint.
//
// The run state lives *here*, not inside <Workspace>, on purpose: collapsing
// the overlay unmounts the workspace, and the run has to keep streaming in the
// background (session tray reopens it). Only Cancel, a refresh or a
// closed tab abort a run.
import type { ComposeEvent } from "@visualize/shared";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { publishVisualization } from "@/app/actions";
import { Header } from "@/components/Header";
import { AskBar } from "@/components/compose/AskBar";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { DetailModal } from "@/components/detail/DetailModal";
import { Feed } from "@/components/feed/Feed";
import { SessionTray } from "@/components/session/SessionTray";
import { Workspace } from "@/components/workspace/Workspace";
import type { PublishedVisualization } from "@/lib/feed";
import { applyEvent, failRun, newRunState, type RunState } from "@/lib/run";
import {
  readSessionRuns,
  removeSessionRun,
  saveSessionRun,
  type SessionRun,
} from "@/lib/session";
import { GenerateError, streamGeneration } from "@/lib/stream";

type Overlay = "none" | "compose" | "run";

interface HomeShellProps {
  rows: PublishedVisualization[];
}

export function HomeShell({ rows }: HomeShellProps) {
  const router = useRouter();

  const [overlay, setOverlay] = useState<Overlay>("none");
  const [run, setRun] = useState<RunState | null>(null);
  /** Last chart composed this session; survives a follow-up's fresh RunState. */
  const [chart, setChart] = useState<ComposeEvent | null>(null);
  const [prompt, setPrompt] = useState("");
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  /** Feed row shown in the read-only detail modal. Never touches the URL. */
  const [detailRow, setDetailRow] = useState<PublishedVisualization | null>(null);
  /** This session's finished, still-unpublished runs (the tray). */
  const [sessionRuns, setSessionRuns] = useState<SessionRun[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  // Refreshing or closing the tab cancels the run (the server sees the
  // connection drop). Collapsing the overlay does not — this shell stays
  // mounted, so the loop below keeps running.
  useEffect(() => () => abortRef.current?.abort(), []);

  // sessionStorage can't be read during render (there is no server-side
  // equivalent, and the markup must match), so the tray fills in after mount.
  useEffect(() => setSessionRuns(readSessionRuns()), []);

  // A run joins the tray as soon as it has a result: that means the draft row
  // exists, so it can be reopened and published. saveSessionRun is idempotent
  // by id, so repeating this on unrelated re-renders is harmless.
  useEffect(() => {
    const result = run?.result;
    if (!result || !chart) return;
    // Labelled with the session's opening question, not the follow-up, so the
    // tray entry reads like the thing the user asked for (mockup 17).
    setSessionRuns(saveSessionRun({ id: result.id, prompt, chart, createdAt: result.createdAt }));
  }, [run, chart, prompt]);

  async function start(nextPrompt: string, parentId?: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPublishing(false);
    setPublishedAt(null);
    setPublishError(null);
    setOverlay("run");

    if (parentId) {
      setFollowUpPrompt(nextPrompt);
    } else {
      // A brand new question starts from an empty workspace.
      setPrompt(nextPrompt);
      setFollowUpPrompt(null);
      setChart(null);
    }

    // Local mirror: setRun is async, so the reducer has to fold onto this.
    let state = newRunState();
    setRun(state);

    try {
      for await (const event of streamGeneration({ prompt: nextPrompt, parentId }, controller.signal)) {
        state = applyEvent(state, event);
        setRun(state);
        if (event.type === "compose") setChart(event);
      }
    } catch (err) {
      // Something else already took over the shell's state — a newer run, or a
      // tray entry being reopened, both of which abort this one on their way
      // in. Writing "Cancelled." now would clobber what they just put there.
      if (abortRef.current !== controller) return;
      if (controller.signal.aborted) setRun(failRun(state, "Cancelled."));
      else if (err instanceof GenerateError) setRun(failRun(state, err.message));
      else setRun(failRun(state, `Unexpected error: ${String(err)}`));
    }
  }

  async function publish() {
    const id = run?.result?.id;
    if (!id) return;

    setPublishing(true);
    setPublishError(null);
    const result = await publishVisualization(id);
    setPublishing(false);

    if (result.ok) {
      setPublishedAt(result.publishedAt);
      // It's on the feed now, so it is no longer "ready to publish".
      setSessionRuns(removeSessionRun(id));
      // The feed is a dynamic Server Component: re-render it so the new post is
      // there when the overlay is collapsed.
      router.refresh();
    } else {
      setPublishError(result.error);
    }
  }

  /**
   * Reopens a tray entry's workspace from the stored payload — no network call.
   * A run still streaming is aborted first: its loop would otherwise keep
   * writing over the state we're about to restore.
   */
  function reopen(entry: SessionRun) {
    if (run?.result?.id !== entry.id) {
      abortRef.current?.abort();
      abortRef.current = null;
      setPrompt(entry.prompt);
      setFollowUpPrompt(null);
      setChart(entry.chart);
      // Terminal logs aren't stored (CLAUDE.md), so the restored run shows the
      // finished compose line and its sources rather than a replayed terminal.
      setRun({
        status: "done",
        steps: ["search", "consolidate", "compose"],
        searches: [],
        summary: null,
        composed: entry.chart,
        result: { id: entry.id, createdAt: entry.createdAt },
        error: null,
      });
      setPublishing(false);
      setPublishedAt(null);
      setPublishError(null);
    }
    setOverlay("run");
  }

  return (
    <main className="min-h-screen">
      <Header onNewVisualization={() => setOverlay("compose")} />
      <Feed rows={rows} onOpen={setDetailRow} />
      <AskBar onOpen={() => setOverlay("compose")} />

      <SessionTray
        runs={sessionRuns}
        onOpen={reopen}
        onDismiss={(id) => setSessionRuns(removeSessionRun(id))}
      />

      {overlay === "compose" ? (
        <ComposeModal onSubmit={(value) => start(value)} onClose={() => setOverlay("none")} />
      ) : null}

      {overlay === "run" && run ? (
        <Workspace
          run={run}
          chart={chart}
          prompt={prompt}
          followUpPrompt={followUpPrompt}
          publishedAt={publishedAt}
          publishError={publishError}
          publishing={publishing}
          onPublish={publish}
          onCancel={() => abortRef.current?.abort()}
          onCollapse={() => setOverlay("none")}
          onFollowUp={(value) => start(value, run.result?.id)}
        />
      ) : null}

      {detailRow ? <DetailModal row={detailRow} onClose={() => setDetailRow(null)} /> : null}
    </main>
  );
}
