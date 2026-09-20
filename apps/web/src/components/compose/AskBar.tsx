"use client";
// Floating "Ask anything…" bar. Pinned just above the bottom of the viewport
// with the feed scrolling under it. It doesn't take typing: per the owner's
// instruction, clicking anywhere on it opens the compose modal, which owns the
// real input.

interface AskBarProps {
  onOpen: () => void;
}

export function AskBar({ onOpen }: AskBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[10px] z-30 flex justify-center px-5">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Ask anything"
        className="pointer-events-auto flex h-11 w-full max-w-[580px] items-center justify-between rounded-full bg-[#1e1e1e]/85 pr-[7px] pl-[22px] text-left backdrop-blur-xl transition-colors hover:bg-[#232323]/90"
      >
        <span className="text-ink-muted text-[15px] leading-none">Ask anything…</span>
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d8d7d4] text-[13px] leading-none text-[#161616]"
        >
          →
        </span>
      </button>
    </div>
  );
}
