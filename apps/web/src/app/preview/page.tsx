// Throwaway route: not part of the product. Renders every chart type with
// hardcoded mock data (lifted from design/mockups) in thumbnail and full
// mode so we can visually diff against the mockups. Safe to delete once
// the real feed exists.
import type { ChartSpec } from "@visualize/shared";

import { Chart } from "@/components/charts/Chart";

const specs: { title: string; spec: ChartSpec }[] = [
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
    title: "Top 10 streamed songs on Spotify this week",
    spec: {
      type: "bar",
      theme: "near-black",
      valueFormat: "compact",
      highlight: "Dai Dai",
      showRank: true,
      rows: [
        { label: "Dai Dai", value: 29.0e6 },
        { label: "BbY WOW", value: 25.6e6 },
        { label: "Beauty And A Beat", value: 24.1e6 },
        { label: "Earrings", value: 23.9e6 },
        { label: "Billie Jean", value: 23.2e6 },
        { label: "Self Aware", value: 22.7e6 },
        { label: "Loser", value: 22.1e6 },
        { label: "Babydoll", value: 21.4e6 },
        { label: "Choosin' Texas", value: 20.9e6 },
        { label: "Espresso", value: 20.1e6 },
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
    title: "Home price-to-income ratio by city",
    spec: {
      type: "lollipop",
      theme: "olive",
      valueFormat: "compact",
      highlight: "Hong Kong",
      referenceLine: { value: 3, label: "3× affordable" },
      rows: [
        { label: "Hong Kong", value: 14.1 },
        { label: "Sydney", value: 14.0 },
        { label: "Vancouver", value: 12.3 },
        { label: "San Jose", value: 11.9 },
        { label: "Los Angeles", value: 10.9 },
        { label: "Auckland", value: 10.1 },
        { label: "Toronto", value: 9.5 },
        { label: "Melbourne", value: 9.3 },
        { label: "San Francisco", value: 9.0 },
        { label: "London", value: 8.7 },
      ],
    },
  },
  {
    title: "Fastest-growing U.S. cities, 2024–25",
    spec: {
      type: "lollipop",
      theme: "olive",
      valueFormat: "percent",
      highlight: "Fulshear, TX",
      rows: [
        { label: "Fulshear, TX", value: 27.5 },
        { label: "Celina, TX", value: 26.2 },
        { label: "Princeton, TX", value: 18.5 },
        { label: "Iowa Colony, TX", value: 15.1 },
        { label: "Anna, TX", value: 13.2 },
        { label: "Melissa, TX", value: 12.4 },
        { label: "Lebanon, TN", value: 10.7 },
        { label: "Prosper, TX", value: 9.9 },
      ],
    },
  },
  {
    title: "Global cruise passengers, 2010–2024",
    spec: {
      type: "column",
      theme: "teal",
      valueFormat: "compact",
      highlight: "2021",
      annotations: [{ label: "2020", text: "COVID" }],
      rows: [
        19.1, 20.6, 20.9, 21.3, 22.3, 23.2, 24.7, 26.7, 28.5, 29.7, 5.8, 13.9, 20.4, 31.7, 34.6,
      ].map((v, i) => ({ label: String(2010 + i), value: v * 1e6 })),
    },
  },
  {
    title: "US drug overdose deaths, 2000–2023",
    spec: {
      type: "column",
      theme: "near-black",
      valueFormat: "compact",
      highlight: "2022",
      rows: [
        17415, 19394, 23518, 25785, 27424, 29813, 34425, 36010, 36450, 37004, 38329, 41340, 41502,
        43982, 47055, 52404, 63632, 70237, 67367, 70630, 91799, 106699, 107941, 105007,
      ].map((v, i) => ({ label: String(2000 + i), value: v })),
    },
  },
  {
    title: "Daily time spent watching TV in the U.S.",
    spec: {
      type: "line",
      theme: "oxblood",
      valueFormat: "duration",
      annotations: [{ x: "2020", text: "Pandemic" }],
      series: [
        {
          name: "Daily TV + movies",
          points: [
            158, 160, 157, 158, 161, 163, 167, 168, 170, 170, 168, 167, 166, 165, 167, 166, 166, 198,
            172, 160, 158, 156,
          ].map((y, i) => ({ x: String(2003 + i), y })),
        },
      ],
    },
  },
  {
    title: "Small business survival rate by year in business",
    spec: {
      type: "line",
      theme: "lavender",
      valueFormat: "percent",
      series: [
        {
          name: "Surviving",
          points: [100, 79.6, 68.6, 61.1, 54.8, 49.7, 45.4, 42.1, 39.4, 36.9, 34.7].map((y, i) => ({
            x: `Year ${i}`,
            y,
          })),
        },
      ],
    },
  },
  {
    title: "Global EV shipments, 2019–2024",
    spec: {
      type: "line",
      theme: "near-black",
      valueFormat: "compact",
      highlight: "BEV",
      area: false,
      series: [
        { name: "BEV", points: [1.5, 2.1, 4.7, 7.4, 9.5, 11.2].map((y, i) => ({ x: String(2019 + i), y: y * 1e6 })) },
        { name: "PHEV", points: [0.6, 0.9, 1.9, 2.9, 4.3, 5.1].map((y, i) => ({ x: String(2019 + i), y: y * 1e6 })) },
      ],
    },
  },
  {
    title: "Where 2024 game revenue came from",
    spec: {
      type: "donut",
      theme: "oxblood",
      valueFormat: "currency",
      centerLabel: "2024 global total",
      highlight: "Mobile",
      parts: [
        { label: "Mobile", value: 92.6e9 },
        { label: "Console", value: 51.9e9 },
        { label: "PC", value: 41.5e9 },
        { label: "Browser", value: 1.7e9 },
      ],
    },
  },
  {
    title: "North America's top Fortnite earners",
    spec: {
      type: "donut",
      theme: "near-black",
      valueFormat: "currency",
      centerLabel: "Top NA earners",
      highlight: "Bugha",
      parts: [
        { label: "Bugha", value: 3.77e6 },
        { label: "psalm", value: 1.87e6 },
        { label: "EpikWhale", value: 1.86e6 },
      ],
    },
  },
  {
    title: "PISA 2022: top performers in math, reading, science",
    spec: {
      type: "dotCompare",
      theme: "signal-red",
      valueFormat: "compact",
      highlight: "Singapore",
      series: ["Math", "Reading", "Science"],
      rows: [
        { label: "Singapore", values: [575, 543, 561] },
        { label: "Macao (China)", values: [552, 510, 543] },
        { label: "Chinese Taipei", values: [547, 515, 537] },
        { label: "Hong Kong (China)", values: [540, 500, 520] },
        { label: "Japan", values: [536, 516, 547] },
        { label: "Korea", values: [527, 515, 528] },
      ],
    },
  },
  {
    title: "NHL points leaders, 2025-26 season",
    spec: {
      type: "dotCompare",
      theme: "near-black",
      valueFormat: "compact",
      highlight: "Connor McDavid",
      series: ["Goals", "Assists"],
      rows: [
        { label: "Connor McDavid", values: [48, 90] },
        { label: "Nathan MacKinnon", values: [42, 79] },
        { label: "Nikita Kucherov", values: [40, 78] },
        { label: "Leon Draisaitl", values: [50, 62] },
        { label: "David Pastrnak", values: [44, 60] },
        { label: "Kirill Kaprizov", values: [45, 55] },
      ],
    },
  },
  {
    title: "Internet users by country",
    spec: {
      type: "treemap",
      theme: "tan",
      valueFormat: "compact",
      highlight: "China",
      cells: [
        { label: "China", value: 1100 },
        { label: "India", value: 806 },
        { label: "United States", value: 322 },
        { label: "Indonesia", value: 212 },
        { label: "Brazil", value: 183 },
        { label: "Russia", value: 130 },
        { label: "Nigeria", value: 123 },
        { label: "Japan", value: 109 },
        { label: "Mexico", value: 107 },
        { label: "Pakistan", value: 104 },
        { label: "Bangladesh", value: 99 },
        { label: "Germany", value: 78 },
        { label: "Philippines", value: 73 },
        { label: "Turkey", value: 72 },
        { label: "Vietnam", value: 71 },
        { label: "United Kingdom", value: 67 },
        { label: "Egypt", value: 66 },
        { label: "France", value: 60 },
        { label: "Iran", value: 59 },
      ],
    },
  },
  {
    title: "Global cancer cases by type, 2024",
    spec: {
      type: "treemap",
      theme: "tan",
      valueFormat: "compact",
      highlight: "Lung",
      cells: [
        { label: "Lung", value: 2.6e6 },
        { label: "Breast", value: 2.4e6 },
        { label: "Colorectum", value: 1.9e6 },
        { label: "Prostate", value: 1.5e6 },
        { label: "Skin (non-melanoma)", value: 1.2e6 },
        { label: "Stomach", value: 1.0e6 },
        { label: "Liver", value: 0.9e6 },
        { label: "Cervix", value: 0.7e6 },
        { label: "Thyroid", value: 0.6e6 },
        { label: "Bladder", value: 0.6e6 },
      ],
    },
  },
  {
    title: "Poverty rate by US state",
    spec: {
      type: "usMap",
      theme: "oxblood",
      valueFormat: "percent",
      rows: [
        ["MS", 19.1], ["LA", 18.6], ["NM", 17.6], ["WV", 16.7], ["KY", 16.5], ["AR", 15.7], ["AL", 15.6],
        ["OK", 15.2], ["SC", 14.2], ["TX", 14.0], ["GA", 13.7], ["TN", 13.6], ["AZ", 13.5], ["NC", 13.4],
        ["NY", 13.4], ["OH", 13.3], ["MI", 13.1], ["FL", 12.9], ["NV", 12.7], ["MO", 12.6], ["CA", 12.2],
        ["SD", 12.1], ["MT", 12.0], ["OR", 12.0], ["IN", 11.9], ["PA", 11.8], ["ID", 11.5], ["IL", 11.5],
        ["DE", 11.4], ["ME", 11.3], ["KS", 11.2], ["IA", 11.0], ["RI", 10.8], ["NE", 10.7], ["WI", 10.6],
        ["ND", 10.4], ["WY", 10.4], ["VT", 10.3], ["AK", 10.2], ["WA", 10.0], ["MA", 10.0], ["VA", 9.9],
        ["CO", 9.7], ["CT", 9.6], ["HI", 9.6], ["MN", 9.3], ["MD", 9.0], ["NJ", 9.0], ["UT", 8.2],
        ["NH", 7.2], ["DC", 14.0],
      ].map(([state, value]) => ({ state: state as string, value: value as number })),
    },
  },
  {
    title: "Minimum wage by state, 2026",
    spec: {
      type: "usMap",
      theme: "cream",
      valueFormat: "currency",
      highlight: "WA",
      rows: [
        ["WA", 17.13], ["DC", 17.95], ["CA", 16.9], ["NY", 16.5], ["CT", 16.94], ["NJ", 15.92],
        ["MA", 15.0], ["OR", 15.05], ["CO", 15.16], ["MD", 15.0], ["IL", 15.0], ["DE", 15.0],
        ["AZ", 15.15], ["RI", 15.0], ["ME", 14.65], ["VT", 14.42], ["HI", 14.0], ["MI", 13.73],
        ["FL", 14.0], ["MO", 13.75], ["NE", 15.0], ["MN", 11.41], ["VA", 12.77], ["NM", 12.0],
        ["AK", 13.0], ["SD", 11.5], ["OH", 11.0], ["MT", 10.55], ["AR", 11.0], ["NV", 12.0],
        ["WV", 8.75], ["TX", 7.25], ["GA", 7.25], ["TN", 7.25], ["AL", 7.25], ["MS", 7.25],
        ["LA", 7.25], ["SC", 7.25], ["NC", 7.25], ["KY", 7.25], ["OK", 7.25], ["KS", 7.25],
        ["IA", 7.25], ["WI", 7.25], ["IN", 7.25], ["PA", 7.25], ["NH", 7.25], ["ND", 7.25],
        ["WY", 7.25], ["UT", 7.25], ["ID", 7.25],
      ].map(([state, value]) => ({ state: state as string, value: value as number })),
    },
  },
];

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; mode?: string }>;
}) {
  const { type, mode } = await searchParams;
  const shown = type ? specs.filter((s) => s.spec.type === type) : specs;
  const modes: ("thumbnail" | "full")[] =
    mode === "full" || mode === "thumbnail" ? [mode] : ["thumbnail", "full"];

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-10 py-12 text-neutral-300">
      <h1 className="mb-8 text-sm tracking-[0.2em] text-neutral-400 uppercase">
        Chart preview — throwaway route, not product UI (?type=donut&mode=full to filter)
      </h1>

      {modes.includes("thumbnail") ? (
        <>
          <h2 className="mb-4 text-xs tracking-[0.2em] text-neutral-500 uppercase">Thumbnail mode</h2>
          <div className="mb-16 flex flex-wrap gap-8">
            {shown.map(({ title, spec }) => (
              <div key={title} className="flex shrink-0 flex-col gap-3">
                <div className="overflow-hidden rounded-2xl">
                  <Chart spec={spec} mode="thumbnail" width={360} height={280} />
                </div>
                <p className="text-sm">
                  {title} <span className="text-neutral-600">· {spec.type}</span>
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {modes.includes("full") ? (
        <>
          <h2 className="mb-4 text-xs tracking-[0.2em] text-neutral-500 uppercase">Full mode (hover for tooltips)</h2>
          <div className="flex flex-wrap gap-10">
            {shown.map(({ title, spec }) => (
              <div key={title} className="flex shrink-0 flex-col gap-3">
                <div className="overflow-hidden rounded-2xl">
                  <Chart spec={spec} mode="full" width={740} height={500} />
                </div>
                <p className="text-sm">
                  {title} <span className="text-neutral-600">· {spec.type}</span>
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
