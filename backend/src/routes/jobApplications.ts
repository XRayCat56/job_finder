import { Router } from "express";
import { ZodError } from "zod";
import { createJobApplicationBodySchema } from "../schemas/jobApplication.js";
import {
  GeminiServiceError,
} from "../services/geminiService.js";
import {
  JobApplicationServiceError,
  createJobApplicationFromUrl,
  getResumeDownload,
} from "../services/jobApplicationService.js";
import { LinkedInScraperError } from "../services/linkedinScraperService.js";
import {
  RESUME_DOWNLOAD_FORMAT,
  isResumeDownloadFormat,
} from "../services/resumeExportService.js";

export const jobApplicationsRouter = Router();

function parseIdParam(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }
  return id;
}

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
  if (
    error instanceof JobApplicationServiceError ||
    error instanceof LinkedInScraperError ||
    error instanceof GeminiServiceError
  ) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

jobApplicationsRouter.post("/", async (req, res) => {
  try {
    const body = createJobApplicationBodySchema.parse(req.body);
    const result = await createJobApplicationFromUrl(body);
    res.status(201).json(result);
  } catch (error) {
    handleError(error, res);
  }
});

jobApplicationsRouter.get("/resumes/:id/download", async (req, res) => {
  const resumeId = parseIdParam(req.params.id);
  if (!resumeId) {
    res.status(400).json({ error: "Invalid resume id." });
    return;
  }

  const formatParam = req.query.format;
  const format = isResumeDownloadFormat(formatParam)
    ? formatParam
    : RESUME_DOWNLOAD_FORMAT.DOCX;

  try {
    const download = await getResumeDownload(resumeId, format);
    res.setHeader("Content-Type", download.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${download.filename}"`,
    );
    res.send(download.content);
  } catch (error) {
    handleError(error, res);
  }
});
