/**
 * Validates required environment variables at startup.
 * Ensures that if a required key is missing or malformed, that we catch it immediately 
*/ 
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.url(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  LLM_MODEL: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
