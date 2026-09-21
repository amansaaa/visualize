"use client";
// Session tray: a bottom-right dot that opens a popover listing
// this session's finished runs, so a collapsed workspace can be reopened.
//
// The dot is deliberately just a dot — no icon, no count badge. It disappears
// entirely when there is nothing to reopen, which is also what happens when
// sessionStorage is unreadable (lib/session.ts degrades to an empty list).
import { useEffect, useRef, useState } from "react";

import type { SessionRun } from "@/lib/session";

interface SessionTrayProps {
  runs: SessionRun[];
  onOpen: (run: SessionRun) => void;
  onDismiss: (id: string) => void;
}

export function SessionTray({ runs, onOpen, onDismiss }: SessionTrayProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on Escape or a click anywhere outside the tray, the way the rest of
  // the app's transient surfaces behave.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Dismissing the last run should take the popover with it.
  useEffect(() => {
    if (runs.length === 0) setOpen(false);
  }, [runs.length]);

  if (runs.length === 0) return null;

  return (
    <div ref={rootRef} className="fixed right-6 bottom-6 z-[60]">
      {open ? (
        <div className="absolute right-0 bottom-[64px] w-[300px] rounded-[11px] bg-[#141414] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.6)]">
          <ul className="flex flex-col gap-[18px]">
            {runs.map((run) => (
              <li key={run.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpen(run);
                  }}
                  className="block w-full cursor-pointer text-left"
                >
                  <span className="flex items-center gap-[9px] pr-6">
                    <span className="bg-status-done h-[6px] w-[6px] shrink-0 rounded-full" />
                    <span className="text-ink-muted text-[10px] leading-none tracking-[0.18em] uppercase">
                      Ready to publish
                    </span>
                  </span>
                  <span className="text-ink mt-[9px] block truncate text-[14px] leading-[1.3]">
                    {run.prompt}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onDismiss(run.id)}
                  aria-label="Dismiss"
                  className="text-link-dim hover:text-ink absolute -top-[3px] right-0 flex h-[18px] w-[18px] cursor-pointer items-center justify-center transition-colors"
                >
                  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden fill="none">
                    <path
                      d="M4 4 12 12M12 4 4 12"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="This session's runs"
        aria-expanded={open}
        className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full bg-[#1f1f1f] shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#282828]"
      >
        <span className="bg-status-done h-[10px] w-[10px] rounded-full" />
      </button>
    </div>
  );
}
