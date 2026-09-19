// Throwaway route: not part of the product. Renders every published row from the
// database with the real Chart component so we can judge what the pipeline produced.
// Safe to delete once the real feed exists.
import { Chart } from "@/components/charts/Chart";
import { getPublishedVisualizations } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function SeededPage() {
  const rows = await getPublishedVisualizations();

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-10 py-12 text-neutral-300">
      <h1 className="mb-10 text-sm tracking-[0.2em] text-neutral-400 uppercase">
        Published visualizations from the database — throwaway route, not product UI ({rows.length})
      </h1>

      <div className="flex flex-col gap-16">
        {rows.map((row) => (
          <section key={row.id} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg text-neutral-100">{row.title}</h2>
              <p className="text-sm text-neutral-500">
                “{row.prompt}” · <span className="text-neutral-300">{row.spec.type}</span> ·{" "}
                {row.spec.theme} · {row.sources.length} sources
              </p>
            </div>

            <div className="flex flex-wrap items-start gap-8">
              <div className="overflow-hidden rounded-2xl">
                <Chart spec={row.spec} mode="thumbnail" width={360} height={280} />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <Chart spec={row.spec} mode="full" width={740} height={500} />
              </div>
            </div>

            <p className="max-w-3xl text-sm text-neutral-400">{row.description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
