"use client";
// UI for when a user clicks on a diagram on the homepage (read-only record)
// showcasing chart w/ hovering ability and metadata panel (i.e prompt, JSON, sources)
//
// An on-screen overlay only: it never touches the URL, so
// there is no route, no `useSearchParams`, no history entry — HomeShell just
// stops rendering it. It is also strictly read-only: no follow-up bar, no
// Publish button, nothing that writes.
//
// Layout is a hard seam rather than a gap: the chart bleeds on the row's own
// theme background into the modal's (sharper, 8px) corners, and the dark panel
// sits flush against it with no border between the two.
import { type DataRow, type Source, dataRowSchema, sourceSchema } from "@visualize/shared";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Chart } from "@/components/charts/Chart";
import type { PublishedVisualization } from "@/lib/feed";
import { formatRelativeTime } from "@/lib/format";
import { themes } from "@/lib/themes";

/** Sources listed before collapsing into "+N more" (mockup 13). */
const MAX_SOURCES = 2;
/** Breathing room between the chart panel's edges and the chart's own box. */
const CHART_INSET = 34;

/**
 * `sources` and `data` are `unknown[]` on the DB row (the Drizzle column is
 * `$type<unknown[]>()`), so nothing has validated them since they were written.
 * Parse item by item rather than as a whole array: one malformed entry then
 * drops out instead of blanking the entire section.
 */
function parseSources(value: unknown[]): Source[] {
  return value.flatMap((item) => {
    const parsed = sourceSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function parseDataRows(value: unknown[]): DataRow[] {
  return value.flatMap((item) => {
    const parsed = dataRowSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-muted text-[10px] leading-none tracking-[0.18em] uppercase">{children}</p>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="absolute top-[18px] right-[18px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#4a4a4a] text-[13px] leading-none text-[#e9e8e6] transition-colors hover:bg-[#5a5a5a]"
    >
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden fill="none">
        <path
          d="M4 4 12 12M12 4 4 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

interface DetailModalProps {
  row: PublishedVisualization;
  onClose: () => void;
}

export function DetailModal({ row, onClose }: DetailModalProps) {
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const [chartBox, setChartBox] = useState<{ width: number; height: number } | null>(null);

  // Same measuring dance as Feed and Workspace: the chart components take pixel
  // dimensions, not CSS, so the panel measures its own box first.
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const sources = useMemo(() => parseSources(row.sources), [row.sources]);
  const dataJson = useMemo(() => {
    const rows = parseDataRows(row.data);
    // If every row failed validation but the column isn't empty, show what is
    // actually stored — the DATA block is a raw dump, not a rendering input.
    const payload = rows.length === 0 && row.data.length > 0 ? row.data : rows;
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return "[]";
    }
  }, [row.data]);

  const theme = themes[row.spec.theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 py-6">
      {/* Same heavy blur + scrim the compose and streaming overlays use. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-2xl"
      />

      <div className="relative flex h-full max-h-[880px] w-full max-w-[1200px] overflow-hidden rounded-[8px] shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
        <section
          className="relative min-w-0 flex-[68]"
          style={{ backgroundColor: theme.background }}
        >
          <div ref={chartBoxRef} className="absolute inset-0">
            {chartBox ? (
              <div style={{ padding: CHART_INSET }}>
                {/* full mode: all rows plus hover tooltips. */}
                <Chart
                  spec={row.spec}
                  mode="full"
                  width={Math.max(chartBox.width - CHART_INSET * 2, 120)}
                  height={Math.max(chartBox.height - CHART_INSET * 2, 120)}
                />
              </div>
            ) : null}
          </div>
        </section>

        <aside className="relative flex w-[32%] max-w-[400px] min-w-[300px] shrink-0 flex-col bg-[#1c1c1c]">
          <CloseButton onClick={onClose} />

          {/* The header block sits a shade lighter than the body, which is what
              draws the horizontal seam under the description in the mockups. */}
          <div className="shrink-0 bg-[#262626] px-6 pt-[22px] pb-[26px]">
            <MicroLabel>{formatRelativeTime(row.publishedAt)}</MicroLabel>
            <h2 className="text-ink mt-[14px] pr-10 text-[22px] leading-[1.22] font-semibold">
              {row.title}
            </h2>
            <p className="mt-[13px] text-[13.5px] leading-[22px] text-[#a3a29e]">
              {row.description}
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-6 pt-[22px] pb-6">
            <MicroLabel>Prompt</MicroLabel>
            <p className="mt-[11px] text-[13px] leading-[1.45] text-[#c9c8c4]">{row.prompt}</p>

            {sources.length > 0 ? (
              <div className="mt-[22px]">
                <MicroLabel>Sources</MicroLabel>
                <ol className="mt-[11px] flex flex-col gap-[7px]">
                  {sources.slice(0, MAX_SOURCES).map((source, index) => (
                    <li key={source.url} className="flex gap-[10px] text-[13px] leading-[1.45]">
                      <span className="text-link-dim shrink-0 tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 text-[#c9c8c4] no-underline transition-colors hover:text-[#e8e8e4]"
                      >
                        {source.domain} — {source.title}
                      </a>
                    </li>
                  ))}
                </ol>
                {sources.length > MAX_SOURCES ? (
                  <p className="text-link-dim mt-[7px] text-[12.5px]">
                    +{sources.length - MAX_SOURCES} more
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-[22px] flex min-h-0 flex-1 flex-col">
              <MicroLabel>Data</MicroLabel>
              <pre className="mt-[11px] min-h-0 flex-1 overflow-y-auto rounded-[4px] border border-white/[0.07] bg-[#121212] px-[14px] py-[13px] font-mono text-[11px] leading-[1.55] text-[#9b9a96]">
                {dataJson}
              </pre>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
