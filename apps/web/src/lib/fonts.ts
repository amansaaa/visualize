// Fonts, loaded and self-hosted by next/font. Defined here rather than in
// layout.tsx so the chart components can reuse the exact family name: SVG
// `font-family` is a presentation attribute and does not resolve `var()`,
// so charts need the resolved stack, not the CSS variable.
import { Anton, Inter } from "next/font/google";

/** UI sans for all page chrome and chart labels. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/** Ultra-condensed grotesque for the "visualize" wordmark only. */
export const wordmark = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-wordmark",
});

export const fontVariables = `${inter.variable} ${wordmark.variable}`;
