// Color palette for each card theme. Theme names are shared with the agent
// (packages/shared/src/charts/themes.ts); the actual values are a rendering
// concern, so they stay here rather than in the shared package.
import type { ThemeName } from "@visualize/shared";

export interface ChartTheme {
  /** Card background. */
  background: string;
  /** Primary text color for titles and direct labels. */
  ink: string;
  /** Secondary text color for micro labels, axes-adjacent text, source lines. */
  mutedInk: string;
  /** Color for the one highlighted item in a chart. */
  accent: string;
  /** Ramp used for multi-series charts (donut slices, treemap cells, etc.), in order. */
  seriesRamp: string[];
}

export const themes: Record<ThemeName, ChartTheme> = {
  oxblood: {
    background: "#4a1620",
    ink: "#f2e9de",
    mutedInk: "#c9a9a0",
    accent: "#e8604a",
    seriesRamp: ["#4a8fa0", "#e8dcc4", "#8b6f7a", "#c97b5c"],
  },
  olive: {
    background: "#2e3620",
    ink: "#f1ede0",
    mutedInk: "#9ca37e",
    accent: "#d9573f",
    seriesRamp: ["#c9ad6b", "#d9573f", "#8a9b5e", "#6e7a4a"],
  },
  cream: {
    background: "#f2ece1",
    ink: "#1c1a16",
    mutedInk: "#8a8375",
    accent: "#b4432e",
    seriesRamp: ["#4a5fa8", "#b4432e", "#7a6a9e", "#c9ad6b"],
  },
  cobalt: {
    background: "#2440e0",
    ink: "#ffffff",
    mutedInk: "#a9b8f5",
    accent: "#ffffff",
    seriesRamp: ["#ffffff", "#9fb0f0", "#6b82d6", "#c7d0f5"],
  },
  "signal-red": {
    background: "#ee5138",
    ink: "#1a0f0c",
    mutedInk: "#7a2e22",
    accent: "#1a0f0c",
    seriesRamp: ["#2a1712", "#5c2a20", "#8c4433", "#c97354"],
  },
  teal: {
    background: "#2e4c4f",
    ink: "#ece6d8",
    mutedInk: "#7fa0a0",
    accent: "#c9ad6b",
    seriesRamp: ["#6e5a8e", "#8fa0a8", "#c9ad6b", "#4f6e73"],
  },
  tan: {
    background: "#c6a85e",
    ink: "#241c10",
    mutedInk: "#8a7440",
    accent: "#5c2a20",
    seriesRamp: ["#5c2a20", "#7a5230", "#3a2a1c", "#8c6a3e"],
  },
  navy: {
    background: "#131a30",
    ink: "#ece9e0",
    mutedInk: "#6b7590",
    accent: "#e8846a",
    seriesRamp: ["#e8846a", "#8a93aa", "#c9ad6b", "#4a5578"],
  },
  "near-black": {
    background: "#111111",
    ink: "#ece6d8",
    mutedInk: "#6e6a62",
    accent: "#e8503d",
    seriesRamp: ["#e8503d", "#c97354", "#8c4433", "#5c2a20"],
  },
  salmon: {
    background: "#eda57e",
    ink: "#2a1710",
    mutedInk: "#b87a55",
    accent: "#5c1a1a",
    seriesRamp: ["#5c1a1a", "#8c4433", "#c97354", "#f0ddc4"],
  },
  chartreuse: {
    background: "#d2d64a",
    ink: "#1a1a0c",
    mutedInk: "#8a8c3e",
    accent: "#1a1a0c",
    seriesRamp: ["#f0edc4", "#1a1a0c", "#8a8c3e", "#b9bc3e"],
  },
  lavender: {
    background: "#d3d8ed",
    ink: "#1c2340",
    mutedInk: "#8890b5",
    accent: "#c9503d",
    seriesRamp: ["#3a4a8c", "#c9503d", "#8890b5", "#5c6a9e"],
  },
};
