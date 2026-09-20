/**
 * Publish buttons backend: when user clicks Publish, broswer calls this fiucntion, 
 * and it runs on the server, flipping the draft's is_published to true and setting published_at.
 * Only place on in the web app that writes to the database.
 */

// Each function exported from this file is a Server Action
// Code that runs on the server but a browser component can call like a normal function
"use server";

// Server Action: publish a draft by id.
import { db, visualizations } from "@visualize/db";
import { visualizationSchema } from "@visualize/shared";
import { and, eq } from "drizzle-orm";

// Two possible answers: post is published and time, it failed and why
export type PublishResult = { ok: true; publishedAt: string } | { ok: false; error: string };

// Server Action: given a draft's id, make the draft public and reports back
// Only place the web app writes to the database
export async function publishVisualization(id: string): Promise<PublishResult> {
  /** Check the ID is a real UUID: Server Actions are public POST endpoints, so the argument can't be trusted to actually be a uuid */
  const parsedId = visualizationSchema.shape.id.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id." };

  // Try to publish
  const [published] = await db
    .update(visualizations)
    .set({ isPublished: true, publishedAt: new Date() })
    .where(and(eq(visualizations.id, parsedId.data), eq(visualizations.isPublished, false)))
    .returning({ publishedAt: visualizations.publishedAt });

  if (published?.publishedAt) return { ok: true, publishedAt: published.publishedAt.toISOString() };

  // Nothing was updated: either it was already published (fine) or the id doesn't exist
  const [existing] = await db
    .select({ isPublished: visualizations.isPublished, publishedAt: visualizations.publishedAt })
    .from(visualizations)
    .where(eq(visualizations.id, parsedId.data));

  // Look up the row and if it exists and is published; return success w/ original publish time
  if (existing?.isPublished && existing.publishedAt) {
    return { ok: true, publishedAt: existing.publishedAt.toISOString() };
  }
  return { ok: false, error: "That visualization doesn't exist." };
}
