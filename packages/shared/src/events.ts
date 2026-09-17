/** 
 * Zod schemas for streamed events (search, consolidate, compose, result, error) and the /generate request body.
 * Contract between apps/api and apps/web (i.e every event backend streams + shape of inital request)
 * Both import schemas so we can catch mismatch at compile time
*/ 

import { z } from "zod";
import { chartSpecSchema } from "./charts/spec";
import { sourceSchema } from "./sources";
import { dataRowSchema } from "./visualization";

/**
 * Executed before a user-visible step begins so terminal UI can show current state and start filling in results
 */
export const stepStartedEventSchema = z.object({
  type: z.literal("stepStarted"),
  step: z.enum(["search", "consolidate", "compose"]),
});
export type StepStartedEvent = z.infer<typeof stepStartedEventSchema>;

/**
 * Citations/sources that agent used; reused inside the search result events
 */
export const searchResultLinkSchema = z.object({
  domain: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
});
export type SearchResultLink = z.infer<typeof searchResultLinkSchema>;

/**
 * One instance per query run
 * Let's the terminal show "domain -- page title, link" incrementally
 */
export const searchResultsEventSchema = z.object({
  type: z.literal("searchResults"),
  query: z.string().min(1),
  results: z.array(searchResultLinkSchema),
});
export type SearchResultsEvent = z.infer<typeof searchResultsEventSchema>;

/**
 * Single summary line CONSOLIDATE produces
 * The rows, sources, date range, and clickable links
 */
export const consolidateSummaryEventSchema = z.object({
  type: z.literal("consolidateSummary"),
  rowCount: z.number().int().nonnegative(),
  sourceCount: z.number().int().nonnegative(),
  dateRange: z.string().nullable(),
  sources: z.array(sourceSchema),
});
export type ConsolidateSummaryEvent = z.infer<typeof consolidateSummaryEventSchema>;

/**
 * Payload when COMPOSE step finishes
 * What the right hand chart in the UI renders from
 */
export const composeEventSchema = z.object({
  type: z.literal("compose"),
  title: z.string().min(1),
  description: z.string().min(1),
  spec: chartSpecSchema,
  data: z.array(dataRowSchema),
  sources: z.array(sourceSchema),
});
export type ComposeEvent = z.infer<typeof composeEventSchema>;

/**
 * Sent last after row is inserted
 * id param needed for follow-up requests
 */
export const resultEventSchema = z.object({
  type: z.literal("result"),
  id: z.uuid(),
  createdAt: z.string(),
});
export type ResultEvent = z.infer<typeof resultEventSchema>;

/**
 * Shape sent over SSE when pipeline fails to denote to user that something broke
 */
export const errorEventSchema = z.object({
  type: z.literal("error"),
  step: z.enum(["search", "consolidate", "compose"]),
  message: z.string().min(1),
});
export type ErrorEvent = z.infer<typeof errorEventSchema>;

/**
 * Anything pushed into the terminal stream must be of these types below
 */
export const streamEventSchema = z.discriminatedUnion("type", [
  stepStartedEventSchema,
  searchResultsEventSchema,
  consolidateSummaryEventSchema,
  composeEventSchema,
  resultEventSchema,
  errorEventSchema,
]);
export type StreamEvent = z.infer<typeof streamEventSchema>;

/**
 * The /generate POST body
 * parentID is optional as every query does not have to be a follow-up
 */
export const generateRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  parentId: z.uuid().optional(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
