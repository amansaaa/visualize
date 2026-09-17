/** Drizzle definition of the `visualizations` table and its feed index. 
 * Typescript description of what one table should look like
 *  drizzle-kit generate reads it to produce actual SQL
 *  Application code imports visualizations so we can write type safe queries
*/ 

import type { ChartSpec } from "@visualize/shared";
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Holds both the user's original request & exact blueprint needed to draw on the screen
 * Text (prompt, title, description): holds the original request
 * Blueprint (data, spec): Stores the raw numbers and JSON instructions (i.e type, theme)
 * Citations (sources): URLs agent used to find the data
 * Visibility (isPublished, publishedAt, createdAt): Publishes to public feed is user invokes by setting flags to true
 */
export const visualizations = pgTable(
  "visualizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Previous turn this row followed up on, if any. Survives the parent being swept. */
    parentId: uuid("parent_id").references((): AnyPgColumn => visualizations.id, {
      onDelete: "set null",
    }),
    prompt: text("prompt").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    data: jsonb("data").$type<unknown[]>().notNull(),
    spec: jsonb("spec").$type<ChartSpec>().notNull(),
    sources: jsonb("sources").$type<unknown[]>().notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Finished table object (sorted by descending order for newest posts and sets flag to true)
  (table) => [
    index("published_feed_idx")
      .on(table.publishedAt.desc())
      .where(sql`${table.isPublished} = true`),
  ],
);
