"use client";
// Thin feed header: centered "visualize" wordmark + the white "New
// visualization" pill. The pill has no behaviour yet — wave 2 passes
// `onNewVisualization` to open the compose modal.

interface HeaderProps {
  onNewVisualization?: () => void;
}

export function Header({ onNewVisualization }: HeaderProps) {
  return (
    <header className="relative flex h-20 items-center px-5 sm:px-8 lg:px-[68px]">
      {/* Centred on the page at desktop widths; falls back to the left edge on
          narrow screens so it can't collide with the button. */}
      <span className="pointer-events-none font-display text-ink text-[19px] leading-none tracking-[0.01em] select-none sm:absolute sm:left-1/2 sm:-translate-x-1/2">
        visualize
      </span>

      <button
        type="button"
        onClick={onNewVisualization}
        className="ml-auto flex h-9 w-[168px] shrink-0 items-center justify-between rounded-full bg-[#e9e8e6] px-[18px] text-[13.5px] leading-none text-[#141414] transition-colors hover:bg-white"
      >
        New visualization
        <span aria-hidden className="text-[13px]">
          →
        </span>
      </button>
    </header>
  );
}
