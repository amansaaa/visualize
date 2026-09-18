/**
 * 1. Hidden step that orchestrates whether SEARCH is needed (i.e is it a follow-up?) and loads its parent
 * 2. Writes the targeted search queries based off the user's input
 */
import { db, visualizations } from "@visualize/db";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getModel } from "../lib/llm";

// Assigns the type of a row the table would return (which was derived in packages/db)
// i.e if we ever get a row back from this table, ParentVisualization will have the shape of it
export type ParentVisualization = typeof visualizations.$inferSelect;

// Gets used in the orchestrator to know whether we need SEARCH, or if the request has a parent request
export interface PlanContext {
  parent: ParentVisualization | null;
  needsSearch: boolean;
  queries: string[];
}

const freshQueriesSchema = z.object({
  queries: z.array(z.string().min(1)).min(2).max(3),
});

// For brand new questions with no parent
async function planFreshQueries(prompt: string, signal: AbortSignal): Promise<PlanContext> {
  const { object } = await generateObject({
    model: getModel(),
    schema: freshQueriesSchema,
    abortSignal: signal,
    prompt: `Write 2-3 targeted web search queries to research this question: "${prompt}"`,
  });
  return { parent: null, needsSearch: true, queries: object.queries };
}

const followUpPlanSchema = z.object({
  needsSearch: z.boolean(),
  queries: z.array(z.string().min(1)).max(3),
});

// Called once per request (orchestrator)
export async function plan(
  input: { prompt: string; parentId?: string },
  signal: AbortSignal,
): Promise<PlanContext> {
  // If there is not parentID, then not a follow up so we can send it to planFreshQueries
  if (!input.parentId) {
    return planFreshQueries(input.prompt, signal);
  }

  // Handles the case where parent ID went stale in our DB
  const [parent] = await db.select().from(visualizations).where(eq(visualizations.id, input.parentId));
  if (!parent) {
    return planFreshQueries(input.prompt, signal);
  }

  // If there was an parentID, then we create a generateObject call for this case
  const { object } = await generateObject({
    model: getModel(),
    schema: followUpPlanSchema,
    abortSignal: signal,
    prompt: [
      `Original question: "${parent.prompt}"`,
      `Current chart type: ${parent.spec.type}`,
      `Follow-up request: "${input.prompt}"`,
      "Decide whether answering the follow-up requires new web research, or only changes how the existing data is presented (e.g. a different chart type, theme, or highlight). If new research is needed, write up to 3 targeted search queries.",
    ].join("\n"),
  });

  return { parent, needsSearch: object.needsSearch, queries: object.queries };
}
