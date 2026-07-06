import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import {
  generateObject as aiGenerateObject,
  generateText as aiGenerateText,
  streamText as aiStreamText,
  tool,
  type LanguageModel,
  type Tool,
} from "ai";
import type { z } from "zod";

export type AiProvider = "anthropic" | "openai" | "google";

export type AiConfig = {
  provider?: AiProvider;
  model?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  googleApiKey?: string;
};

export const DEFAULT_AI_PROVIDER: AiProvider = "anthropic";
export const DEFAULT_AI_MODEL = "claude-sonnet-5";

export class AiNotConfiguredError extends Error {
  constructor(message = "AI provider credentials are not configured.") {
    super(message);
    this.name = "AiNotConfiguredError";
  }
}

export function isAiConfigured(config: AiConfig) {
  const provider = config.provider ?? DEFAULT_AI_PROVIDER;
  if (provider === "anthropic") return Boolean(config.anthropicApiKey);
  if (provider === "openai") return Boolean(config.openaiApiKey);
  return Boolean(config.googleApiKey);
}

export function createLanguageModel(config: AiConfig): LanguageModel {
  const provider = config.provider ?? DEFAULT_AI_PROVIDER;
  const model = config.model ?? DEFAULT_AI_MODEL;

  if (!isAiConfigured(config)) {
    throw new AiNotConfiguredError();
  }

  if (provider === "anthropic") return anthropic(model);
  if (provider === "openai") return openai(model);
  return google(model);
}

export function composeSystemPrompt(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
}

export function defineTool<TSchema extends z.ZodTypeAny, TResult>({
  description,
  inputSchema,
  execute,
}: {
  description: string;
  inputSchema: TSchema;
  execute: (input: z.infer<TSchema>) => Promise<TResult> | TResult;
}): Tool {
  return tool({
    description,
    inputSchema: inputSchema as never,
    execute: execute as never,
  });
}

export const streamText = aiStreamText;
export const generateText = aiGenerateText;
export const generateObject = aiGenerateObject;
