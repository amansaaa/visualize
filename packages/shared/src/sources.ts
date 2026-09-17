// A citation stored with every visualization.
import { z } from "zod";

export const sourceSchema = z.object({
  url: z.url(),
  domain: z.string().min(1),
  title: z.string().min(1),
});

export type Source = z.infer<typeof sourceSchema>;
