"use client";
// The run's overlay, in two modes that share one terminal:
//
//   streaming — a centred modal, shown while the run is early.
//   workspace — two panels, shown once the chart has arrived.
//
// It owns no run state: everything comes down as props from HomeShell, so
// collapsing this overlay (which unmounts it) can't abort or lose a run.
import type { ComposeEvent } from "@visualize/shared";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Chart } from "@/components/charts/Chart";
import type { RunState } from "@/lib/run";
import { themes } from "@/lib/themes";

import { SourceLine, Terminal } from "./Terminal";

/** Sources listed under SOURCES before collapsing into "+N more". */
const MAX_SOURCES = 2;
/** Breathing room between the right panel's edges and the chart's own box. */
const CHART_INSET = 32;

/** StreamingModal's box, mirrored here so the chart can grow out of it. */
const MODAL_MAX_WIDTH = 640;
const MODAL_HEIGHT = 660;
const MODAL_MARGIN = { x: 20, y: 32 };
const EXPAND_MS = 700;
const EXPAND_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden fill="none">
      <path
        d="M4 6.25 8 10.25 12 6.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseButton({ onClick, tone = "dark" }: { onClick: () => void; tone?: "dark" | "light" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Collapse"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
        tone === "light"
          ? "bg-[#e9e8e6] text-[#141414] hover:bg-white"
          : "bg-[#3a3a3a] text-ink hover:bg-[#474747]"
      }`}
    >
      <ChevronDown />
    </button>
  );
}

/** Rounded input + circular arrow, used for the follow-up bar. */
function PromptPill({
  placeholder,
  disabled,
  onSubmit,
}: {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    onSubmit(trimmed);
  };

  return (
    <div className="flex h-[52px] items-center gap-2 rounded-full bg-[#232323] pr-[7px] pl-[22px]">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        placeholder={placeholder}
        maxLength={500}
        disabled={disabled}
        className="text-ink placeholder:text-ink-muted min-w-0 flex-1 bg-transparent text-[14.5px] outline-none disabled:opacity-50"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || value.trim().length === 0}
        aria-label="Send follow-up"
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#4a4a4a] text-[13px] leading-none text-[#e8e8e4] transition-colors hover:bg-[#5a5a5a] disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

/** Keeps the terminal pinned to the newest line as events stream in. */
function useAutoScroll(dependency: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [dependency]);
  return ref;
}

interface WorkspaceProps {
  run: RunState;
  /**
   * The chart on screen. Normally `run.composed`, but a follow-up starts from a
   * fresh RunState, so HomeShell holds the last composed chart and keeps it
   * visible while the follow-up re-composes (mockup 05). Null until the first
   * chart of the session arrives — that's what picks the streaming modal.
   */
  chart: ComposeEvent | null;
  /** The prompt that opened this workspace — the panel/modal title. */
  prompt: string;
  /** The follow-up currently being answered, if this isn't the first run. */
  followUpPrompt: string | null;
  publishedAt: string | null;
  publishError: string | null;
  publishing: boolean;
  onPublish: () => void;
  onCancel: () => void;
  onCollapse: () => void;
  onFollowUp: (prompt: string) => void;
}

interface SplitWorkspaceProps extends WorkspaceProps {
  /** True when this mounted in place of the streaming modal: play the expand-out. */
  expandFromModal: boolean;
}

export function Workspace(props: WorkspaceProps) {
  // Only a workspace that grew out of the streaming modal gets the expand
  // animation; one reopened from the session tray mounts already complete.
  const [wasStreaming, setWasStreaming] = useState(!props.chart);
  if (!props.chart && !wasStreaming) setWasStreaming(true);

  // The chart's arrival is what turns the streaming modal into the workspace.
  return props.chart ? (
    <SplitWorkspace {...props} expandFromModal={wasStreaming} />
  ) : (
    <StreamingModal {...props} />
  );
}

function StreamingModal({ run, prompt, onCancel, onCollapse }: WorkspaceProps) {
  const scrollRef = useAutoScroll(run);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 py-8">
      <button
        type="button"
        aria-label="Collapse"
        onClick={onCollapse}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-2xl"
      />

      <div className="relative flex h-[660px] max-h-full w-full max-w-[640px] flex-col rounded-[14px] border border-white/[0.07] bg-[#242424]/85 shadow-[0_28px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="flex items-start gap-4 px-8 pt-7">
          <h2 className="text-ink min-w-0 flex-1 text-[26px] leading-[1.25]">{prompt}</h2>
          <CollapseButton onClick={onCollapse} />
        </div>

        <div ref={scrollRef} className="mt-6 flex-1 overflow-y-auto px-8 pb-4">
          <Terminal run={run} />
        </div>

        <div className="flex h-[52px] shrink-0 items-center px-8">
          {run.status === "running" ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-ink-muted hover:text-ink text-[10.5px] tracking-[0.18em] uppercase transition-colors"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SplitWorkspace({
  run,
  chart,
  prompt,
  followUpPrompt,
  publishedAt,
  publishError,
  publishing,
  onPublish,
  onCancel,
  onCollapse,
  onFollowUp,
  expandFromModal,
}: SplitWorkspaceProps) {
  const scrollRef = useAutoScroll(run);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const chartPanelRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const [chartBox, setChartBox] = useState<{ width: number; height: number } | null>(null);

  // Same problem the feed has: the chart components take pixel dimensions, not
  // CSS, so the panel measures its own box and hands down the numbers.
  useLayoutEffect(() => {
    const element = chartBoxRef.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setChartBox({ width: rect.width, height: rect.height });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The streaming modal is replaced by this layout in one render. To make that
  // read as the modal opening up, the chart panel is revealed through a
  // clip-path that starts at the modal's box and grows to the panel's full
  // size. Clipping (rather than scaling) means the chart is laid out at its
  // final size throughout, so nothing stretches. Runs before first paint.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    const chartPanel = chartPanelRef.current;
    const controls = controlsRef.current;
    if (!expandFromModal || !root || !panel || !chartPanel || !controls) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = chartPanel.getBoundingClientRect();
    const modalWidth = Math.min(MODAL_MAX_WIDTH, window.innerWidth - MODAL_MARGIN.x * 2);
    const modalHeight = Math.min(MODAL_HEIGHT, window.innerHeight - MODAL_MARGIN.y * 2);
    const modalLeft = (window.innerWidth - modalWidth) / 2;
    const modalTop = (window.innerHeight - modalHeight) / 2;

    const inset = (value: number) => Math.max(0, Math.round(value));
    const from = `inset(${inset(modalTop - rect.top)}px ${inset(rect.right - (modalLeft + modalWidth))}px ${inset(
      rect.bottom - (modalTop + modalHeight),
    )}px ${inset(modalLeft - rect.left)}px round 14px)`;

    const timing = { duration: EXPAND_MS, easing: EXPAND_EASING };
    const fadeIn = { duration: 450, easing: "ease-out", delay: 250, fill: "backwards" as const };

    // Scrim -> page: the modal's blurred backdrop dissolves into the solid page.
    const finalBackground = getComputedStyle(root).backgroundColor;
    const animations = [
      root.animate(
        [
          { backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(40px)" },
          { backgroundColor: finalBackground, backdropFilter: "blur(40px)" },
        ],
        timing,
      ),
      chartPanel.animate([{ clipPath: from }, { clipPath: "inset(0px round 12px)" }], timing),
      panel.animate(
        [
          { opacity: 0, transform: "translateX(-16px)" },
          { opacity: 1, transform: "none" },
        ],
        fadeIn,
      ),
      controls.animate([{ opacity: 0 }, { opacity: 1 }], fadeIn),
    ];
    return () => animations.forEach((animation) => animation.cancel());
    // Only the first paint after mounting animates.
  }, []);

  const composed = chart!;
  const theme = themes[composed.spec.theme];
  const sources = composed.sources;
  const running = run.status === "running";

  return (
    <div ref={rootRef} className="bg-page fixed inset-0 z-50 flex gap-2 p-4">
      <aside ref={panelRef} className="bg-panel flex w-[370px] shrink-0 flex-col overflow-hidden rounded-xl">
        <h2 className="text-ink shrink-0 px-8 pt-8 pb-5 text-[19px] leading-[1.3]">{prompt}</h2>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-8">
          {followUpPrompt ? (
            <h3 className="text-ink pt-1 pb-3 text-[17px] leading-[1.3]">{followUpPrompt}</h3>
          ) : null}
          <Terminal run={run} />

          <div className="mt-7 border-t border-white/[0.08] pt-6 pb-2">
            <p className="text-ink-muted text-[10px] tracking-[0.18em] uppercase">Sources</p>
            <div className="mt-3 flex flex-col gap-2">
              {sources.slice(0, MAX_SOURCES).map((source) => (
                <SourceLine key={source.url} link={source} clamp={2} />
              ))}
              {sources.length > MAX_SOURCES ? (
                <p className="text-link-dim text-[12.5px]">+{sources.length - MAX_SOURCES} more</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 pt-3 pb-4">
          {running ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-ink-muted hover:text-ink mb-2 ml-4 text-[10.5px] tracking-[0.18em] uppercase transition-colors"
            >
              Cancel
            </button>
          ) : null}
          <PromptPill placeholder="Ask a follow-up…" disabled={running} onSubmit={onFollowUp} />
        </div>
      </aside>

      <section
        ref={chartPanelRef}
        className="relative min-w-0 flex-1 overflow-hidden rounded-xl"
        style={{ backgroundColor: theme.background }}
      >
        <div ref={chartBoxRef} className="absolute inset-0">
          {chartBox ? (
            <div style={{ padding: CHART_INSET }}>
              <Chart
                spec={composed.spec}
                mode="full"
                width={Math.max(chartBox.width - CHART_INSET * 2, 120)}
                height={Math.max(chartBox.height - CHART_INSET * 2, 120)}
              />
            </div>
          ) : null}
        </div>

        <div ref={controlsRef} className="absolute top-5 right-5 flex items-center gap-2">
          {publishError ? (
            <span className="text-[12px] text-[#e0614a]">{publishError}</span>
          ) : null}
          {run.result ? (
            publishedAt ? (
              // Published posts can't be unpublished, so this is a state, not a toggle.
              <span className="flex h-9 items-center rounded-full bg-white/15 px-[18px] text-[13.5px] leading-none text-[#e9e8e6]">
                Published
              </span>
            ) : (
              <button
                type="button"
                onClick={onPublish}
                disabled={publishing}
                className="flex h-9 items-center rounded-full bg-[#e9e8e6] px-[18px] text-[13.5px] leading-none text-[#141414] transition-colors hover:bg-white disabled:opacity-60"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            )
          ) : null}
          <CollapseButton onClick={onCollapse} tone="light" />
        </div>
      </section>
    </div>
  );
}
