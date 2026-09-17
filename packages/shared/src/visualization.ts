// A finished visualization as the web app reads it (mirrors the DB row).
import { z } from "zod";
import { chartSpecSchema } from "./charts/spec";
import { sourceSchema } from "./sources";

export const dataRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));
export type DataRow = z.infer<typeof dataRowSchema>;

export const visualizationSchema = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  prompt: z.string(),
  title: z.string(),
  description: z.string(),
  data: z.array(dataRowSchema),
  spec: chartSpecSchema,
  sources: z.array(sourceSchema),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type Visualization = z.infer<typeof visualizationSchema>;
