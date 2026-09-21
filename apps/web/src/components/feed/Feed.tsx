"use client";
// Masonry grid of published visualizations.
//
// The chart components take a pixel width/height, not CSS, so the grid measures
// its own content box with a ResizeObserver, decides the column count itself,
// and hands every card the exact pixel width its masonry column will have. The
// same number is fed to <Masonry breakpointCols>, so the count the library uses
// and the width the charts render at can never disagree.
import type { PublishedVisualization } from "@/lib/feed";
import { useLayoutEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";

import { FeedCard } from "./FeedCard";

const GUTTER = 32;
const NARROW_GUTTER = 20;

function columnCountFor(width: number): number {
  if (width >= 1500) return 5;
  if (width >= 1180) return 4;
  if (width >= 860) return 3;
  if (width >= 560) return 2;
  return 1;
}

interface FeedProps {
  rows: PublishedVisualization[];
  /** Wave 3 opens the read-only detail modal from here. */
  onOpen?: (row: PublishedVisualization) => void;
}

export function Feed({ rows, onOpen }: FeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => setContainerWidth(element.getBoundingClientRect().width);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const columns = containerWidth ? columnCountFor(containerWidth) : 0;
  const gutter = columns > 1 ? GUTTER : NARROW_GUTTER;
  // Mirrors the CSS: each column is (100 / columns)% of the row, which the
  // negative margin widens by one gutter, and each column spends one gutter on
  // padding-left.
  const columnWidth =
    containerWidth && columns ? Math.floor((containerWidth - gutter * (columns - 1)) / columns) : 0;

  if (rows.length === 0) {
    return (
      <p className="px-5 pt-24 text-center text-[11px] tracking-[0.18em] text-ink-muted uppercase sm:px-8 lg:px-[68px]">
        Nothing published yet
      </p>
    );
  }

  return (
    <section className="px-5 pb-28 sm:px-8 lg:px-[68px]">
      <div ref={containerRef}>
        {columnWidth > 0 && (
          <Masonry
            breakpointCols={columns}
            className="feed-masonry"
            columnClassName="feed-masonry-column"
            style={{ "--feed-gutter": `${gutter}px` } as React.CSSProperties}
          >
            {rows.map((row) => (
              <FeedCard key={row.id} row={row} width={columnWidth} onOpen={onOpen} />
            ))}
          </Masonry>
        )}
      </div>
    </section>
  );
}
