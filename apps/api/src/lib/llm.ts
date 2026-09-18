// Selects the Gemini model from LLM_MODEL (single place to swap models).
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { env } from "../env";

// Every pipeline step imports getModel() to be able to easily swap LLM providers
export function getModel(): LanguageModel {
  return google(env.LLM_MODEL);
}
