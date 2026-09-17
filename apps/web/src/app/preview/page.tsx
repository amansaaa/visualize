// Throwaway route: not part of the product. Renders the bar chart with
// hardcoded mock data across a few themes so we can visually diff against
// design/mockups while building the style system. Safe to delete once the
// real feed exists.
import type { BarChartSpec } from "@visualize/shared";

import { Chart } from "@/components/charts/Chart";

const specs: { title: string; spec: BarChartSpec }[] = [
  {
    title: "Spotify's global top 10 right now",
    spec: {
      type: "bar",
      theme: "cream",
      valueFormat: "compact",
      highlight: "BbY WOW",
      rows: [
        { label: "BbY WOW", value: 4.14e6 },
        { label: "Dai Dai", value: 3.52e6 },
        { label: "Beauty And A Beat", value: 3.49e6 },
        { label: "The One That Got Away", value: 3.17e6 },
        { label: "Earrings", value: 3.13e6 },
        { label: "Billie Jean", value: 3.06e6 },
        { label: "Self Aware", value: 3.0e6 },
        { label: "Loser", value: 2.97e6 },
        { label: "Babydoll", value: 2.81e6 },
        { label: "Choosin' Texas", value: 2.72e6 },
      ],
    },
  },
  {
    title: "Big Mac price vs. the US, by country",
    spec: {
      type: "bar",
      theme: "olive",
      valueFormat: "currency",
      highlight: "Switzerland",
      rows: [
        { label: "Switzerland", value: 11.03 },
        { label: "Luxembourg", value: 10.51 },
        { label: "Norway", value: 9.87 },
        { label: "United States", value: 5.69 },
        { label: "Uruguay", value: 5.42 },
        { label: "Israel", value: 5.35 },
      ],
    },
  },
  {
    title: "NHL points leaders, 2025-26 season",
    spec: {
      type: "bar",
      theme: "navy",
      valueFormat: "compact",
      highlight: "Connor McDavid",
      rows: [
        { label: "Connor McDavid", value: 138 },
        { label: "Nathan MacKinnon", value: 121 },
        { label: "Nikita Kucherov", value: 118 },
        { label: "Leon Draisaitl", value: 112 },
        { label: "David Pastrnak", value: 104 },
      ],
    },
  },
  {
    title: "Median rent by US metro",
    spec: {
      type: "bar",
      theme: "near-black",
      valueFormat: "currency",
      highlight: "San Jose",
      rows: [
        { label: "San Jose", value: 3729 },
        { label: "San Francisco", value: 3410 },
        { label: "Boston", value: 3180 },
        { label: "New York", value: 3050 },
        { label: "San Diego", value: 2890 },
        { label: "Seattle", value: 2640 },
      ],
    },
  },
  {
    title: "Most-used programming languages, 2026",
    spec: {
      type: "bar",
      theme: "chartreuse",
      valueFormat: "percent",
      highlight: "TypeScript",
      rows: [
        { label: "TypeScript", value: 38.2 },
        { label: "Python", value: 34.6 },
        { label: "Rust", value: 12.1 },
        { label: "Go", value: 9.8 },
        { label: "Swift", value: 5.3 },
      ],
    },
  },
  {
    title: "America's most popular dog breeds, 2024",
    spec: {
      type: "bar",
      theme: "lavender",
      valueFormat: "compact",
      highlight: "French Bulldog",
      rows: [
        { label: "French Bulldog", value: 108_500 },
        { label: "Labrador Retriever", value: 94_200 },
        { label: "Golden Retriever", value: 81_700 },
        { label: "German Shepherd", value: 73_400 },
        { label: "Poodle", value: 58_900 },
      ],
    },
  },
];

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-10 py-12">
      <h1 className="mb-8 text-sm tracking-[0.2em] text-neutral-400 uppercase">
        Bar chart theme preview — throwaway route, not product UI
      </h1>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {specs.map(({ title, spec }) => (
          <div key={title} className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-2xl">
              <Chart spec={spec} mode="thumbnail" width={360} height={280} />
            </div>
            <p className="text-sm text-neutral-300">{title}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
