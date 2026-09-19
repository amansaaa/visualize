// Runs the real pipeline on example prompts and publishes the results so the feed isn't empty.
import { db, visualizations } from "@visualize/db";
import type { StreamEvent } from "@visualize/shared";
import { and, eq } from "drizzle-orm";
import { runPipeline } from "./pipeline";

const PROMPTS = [
  "Top 10 most streamed songs on Spotify of all time",
  "Global cruise passengers per year, 2010 to 2024",
  "US drug overdose deaths per year since 2000",
  "Average daily hours Americans spend watching TV, 2010 to 2024",
  "Minimum wage by US state",
  "Global smartphone market share by brand",
  "Home price to income ratio in the world's most expensive cities",
  "Life expectancy of men versus women in the 8 most populous countries",
];

async function alreadySeeded(prompt: string): Promise<boolean> {
  const [row] = await db
    .select({ id: visualizations.id })
    .from(visualizations)
    .where(and(eq(visualizations.prompt, prompt), eq(visualizations.isPublished, true)))
    .limit(1);
  return row !== undefined;
}

async function seedPrompt(prompt: string): Promise<boolean> {
  const outcome: { id: string | null; error: string | null } = { id: null, error: null };

  const emit = (event: StreamEvent) => {
    if (event.type === "stepStarted") console.log(`   ${event.step.toUpperCase()}`);
    if (event.type === "result") outcome.id = event.id;
    if (event.type === "error") outcome.error = event.message;
  };

  await runPipeline({ prompt }, emit, new AbortController().signal);

  if (!outcome.id) {
    console.log(`   FAILED: ${outcome.error ?? "no result"}`);
    return false;
  }

  await db
    .update(visualizations)
    .set({ isPublished: true, publishedAt: new Date() })
    .where(eq(visualizations.id, outcome.id));
  console.log(`   published ${outcome.id}`);
  return true;
}

async function main() {
  let published = 0;
  let skipped = 0;
  let failed = 0;

  for (const prompt of PROMPTS) {
    console.log(`\n"${prompt}"`);

    if (await alreadySeeded(prompt)) {
      console.log("   already seeded, skipping");
      skipped++;
    } else if (await seedPrompt(prompt)) {
      published++;
    } else {
      failed++;
    }
  }

  console.log(`\nDone: ${published} published, ${skipped} skipped, ${failed} failed`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
