// Query for published visualizations, newest first.
import { db, visualizations } from "@visualize/db";
import { desc, eq } from "drizzle-orm";

export type PublishedVisualization = typeof visualizations.$inferSelect;

export async function getPublishedVisualizations(): Promise<PublishedVisualization[]> {
  return db
    .select()
    .from(visualizations)
    .where(eq(visualizations.isPublished, true))
    .orderBy(desc(visualizations.publishedAt));
}
