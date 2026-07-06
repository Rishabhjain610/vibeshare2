import { createGroq } from "@ai-sdk/groq";
import { createOllama } from "ai-sdk-ollama";
import { LanguageModel } from "ai";

const groq = createGroq();
const ollama = createOllama({ baseURL: process.env.OLLAMA_URL || "http://127.0.0.1:11434" });

// Centralized models
export const PRIMARY_MODEL_ID = "qwen/qwen3.6-27b";
export const FALLBACK_MODEL_ID = "minimax-m3:cloud"; // local Ollama model

/**
 * Wraps a primary model with a fallback model to gracefully handle rate limits (TPD/TPM errors)
 * or network outages by automatically failing over to the backup model.
 */
function wrapWithFallback(primary: LanguageModel, fallback: LanguageModel): LanguageModel {
  const p = primary as any;
  const f = fallback as any;
  return {
    specificationVersion: p.specificationVersion || "v1",
    provider: p.provider || "custom-fallback",
    modelId: p.modelId || "fallback-wrapped",
    defaultObjectGenerationMode: p.defaultObjectGenerationMode,
    doGenerate: async (options: any) => {
      try {
        return await p.doGenerate(options);
      } catch (error: any) {
        console.warn(
          `[AI Fallback] Primary model ${p.modelId || "unknown"} failed. Falling back to local ${f.modelId || "unknown"}. Error:`,
          error.message || error
        );
        return await f.doGenerate(options);
      }
    },
    doStream: async (options: any) => {
      try {
        return await p.doStream(options);
      } catch (error: any) {
        console.warn(
          `[AI Fallback] Primary model ${p.modelId || "unknown"} failed. Falling back to local ${f.modelId || "unknown"}. Error:`,
          error.message || error
        );
        return await f.doStream(options);
      }
    },
  } as any;
}

const primary = groq(PRIMARY_MODEL_ID);
const fallback = ollama(FALLBACK_MODEL_ID);

export const groqModel = wrapWithFallback(primary, fallback);
export const fallbackModel = fallback;
