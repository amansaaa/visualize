// List of card theme names the agent may choose (colors live in apps/web).

export const THEME_NAMES = [
  "oxblood",
  "olive",
  "cream",
  "cobalt",
  "signal-red",
  "teal",
  "tan",
  "navy",
  "near-black",
  "salmon",
  "chartreuse",
  "lavender",
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];
