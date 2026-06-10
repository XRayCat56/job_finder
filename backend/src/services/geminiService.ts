import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash";
const LOG_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../logs",
);
const LOG_FILE = path.join(LOG_DIR, "gemini.log");
const MAX_RETRIES = 2;

export interface GeminiGenerateInput {
  text: string;
  systemInstruction?: string;
}

export class GeminiServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "GeminiServiceError";
  }
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiServiceError("GEMINI_API_KEY is not configured.", 503);
  }
  return apiKey;
}

function getModelName(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_MODEL;
}

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Gemini API error";
}

function isQuotaError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("429") ||
    normalized.includes("quota") ||
    normalized.includes("resourceexhausted")
  );
}

function isZeroQuotaError(message: string): boolean {
  return message.includes("limit: 0");
}

function parseRetryDelayMs(message: string): number | null {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (!match?.[1]) {
    return null;
  }

  const seconds = Number.parseFloat(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return Math.ceil(seconds * 1000);
}

interface GeminiLogEntry {
  timestamp: string;
  model: string;
  status: "success" | "error";
  inputLength: number;
  output?: string;
  error?: string;
}

async function writeGeminiLog(entry: GeminiLogEntry): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // Logging must not affect API behavior.
  }
}

function buildQuotaErrorMessage(message: string, model: string): string {
  if (isZeroQuotaError(message)) {
    return `Gemini free-tier quota is unavailable for model "${model}". Link a billing account in Google AI Studio to activate free-tier limits, or set GEMINI_MODEL to a supported model such as gemini-2.5-flash-lite.`;
  }

  const retryMs = parseRetryDelayMs(message);
  if (retryMs) {
    return `Gemini rate limit exceeded for model "${model}". Wait about ${Math.ceil(retryMs / 1000)} seconds and try again.`;
  }

  return `Gemini quota or rate limit exceeded for model "${model}". Check usage in Google AI Studio or try again later.`;
}

export async function generateResponse(
  input: GeminiGenerateInput,
): Promise<{ text: string }> {
  const modelName = getModelName();
  const client = getClient();
  const model = client.getGenerativeModel({
    model: modelName,
    ...(input.systemInstruction
      ? { systemInstruction: input.systemInstruction }
      : {}),
  });

  let lastMessage = "Unknown Gemini API error";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await model.generateContent(input.text);
      const text = result.response.text();

      if (!text) {
        const errorMessage = "Gemini returned an empty response.";
        void writeGeminiLog({
          timestamp: new Date().toISOString(),
          model: modelName,
          status: "error",
          inputLength: input.text.length,
          error: errorMessage,
        });
        throw new GeminiServiceError(errorMessage, 502);
      }

      void writeGeminiLog({
        timestamp: new Date().toISOString(),
        model: modelName,
        status: "success",
        inputLength: input.text.length,
        output: text,
      });

      return { text };
    } catch (error) {
      if (error instanceof GeminiServiceError) {
        throw error;
      }

      lastMessage = getErrorMessage(error);

      if (isQuotaError(lastMessage)) {
        if (isZeroQuotaError(lastMessage)) {
          const errorMessage = buildQuotaErrorMessage(lastMessage, modelName);
          void writeGeminiLog({
            timestamp: new Date().toISOString(),
            model: modelName,
            status: "error",
            inputLength: input.text.length,
            error: errorMessage,
          });
          throw new GeminiServiceError(errorMessage, 429);
        }

        if (attempt < MAX_RETRIES) {
          const retryMs =
            parseRetryDelayMs(lastMessage) ?? (attempt + 1) * 2_000;
          await sleep(retryMs);
          continue;
        }

        const errorMessage = buildQuotaErrorMessage(lastMessage, modelName);
        void writeGeminiLog({
          timestamp: new Date().toISOString(),
          model: modelName,
          status: "error",
          inputLength: input.text.length,
          error: errorMessage,
        });
        throw new GeminiServiceError(errorMessage, 429);
      }

      const errorMessage = `Gemini request failed: ${lastMessage}`;
      void writeGeminiLog({
        timestamp: new Date().toISOString(),
        model: modelName,
        status: "error",
        inputLength: input.text.length,
        error: errorMessage,
      });
      throw new GeminiServiceError(errorMessage, 502);
    }
  }

  const errorMessage = `Gemini request failed: ${lastMessage}`;
  void writeGeminiLog({
    timestamp: new Date().toISOString(),
    model: modelName,
    status: "error",
    inputLength: input.text.length,
    error: errorMessage,
  });
  throw new GeminiServiceError(errorMessage, 502);
}
