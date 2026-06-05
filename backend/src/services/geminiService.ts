import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiGenerateBody } from "../schemas/gemini.js";

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

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey());
}

export async function generateResponse(
  input: GeminiGenerateBody,
): Promise<{ text: string }> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash",
    ...(input.systemInstruction
      ? { systemInstruction: input.systemInstruction }
      : {}),
  });

  try {
    const result = await model.generateContent(input.text);
    const text = result.response.text();

    if (!text) {
      throw new GeminiServiceError("Gemini returned an empty response.", 502);
    }

    return { text };
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unknown Gemini API error";
    throw new GeminiServiceError(`Gemini request failed: ${message}`, 502);
  }
}
