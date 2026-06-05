import { Router } from "express";
import { ZodError } from "zod";
import { geminiGenerateBodySchema } from "../schemas/gemini.js";
import {
  GeminiServiceError,
  generateResponse,
} from "../services/geminiService.js";

export const geminiRouter = Router();

function handleError(
  error: unknown,
  res: import("express").Response,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: error.flatten().fieldErrors,
    });
    return;
  }
  if (error instanceof GeminiServiceError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

geminiRouter.post("/generate", async (req, res) => {
  try {
    const body = geminiGenerateBodySchema.parse(req.body);
    const result = await generateResponse(body);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});
