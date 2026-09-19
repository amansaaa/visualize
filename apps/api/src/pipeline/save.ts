/** Inserts the final result as an unpublished draft so we can store in our database */
import type { ChartSpec, DataRow, Source } from "@visualize/shared";
import { db, visualizations } from "@visualize/db";

// Everything the pipeline produced into one object
export interface SaveInput {
  parentId: string | null;
  prompt: string;
  title: string;
  description: string;
  data: DataRow[];
  spec: ChartSpec;
  sources: Source[];
}


/** Saves the input as an unpublished row. id and createdAt aren't in our
 * input so Postgres generates them itself (via the defaults defined in
 * packages/db/src/schema.ts) and RETURNING the generated values back.
*/
export async function saveDraft(input: SaveInput): Promise<{ id: string; createdAt: Date }> {
  const [saved] = await db
    .insert(visualizations)
    .values({ ...input, isPublished: false })
    .returning({ id: visualizations.id, createdAt: visualizations.createdAt });

  if (!saved) throw new Error("insert returned no row");

  return saved;
}
