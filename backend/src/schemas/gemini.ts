import { z } from "zod";

export const geminiGenerateBodySchema = z.object({
  text: z.string().min(1).max(100_000),
  systemInstruction: z.string().max(10_000).optional(),
});

export type GeminiGenerateBody = z.infer<typeof geminiGenerateBodySchema>;
