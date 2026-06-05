import { z } from "zod";
import { extractLinkedInJobId } from "../services/linkedinScraperService.js";

const linkedInJobUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL.")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return (
          parsed.hostname.includes("linkedin.com") &&
          (parsed.pathname.includes("/jobs/") ||
            parsed.pathname.includes("/job/") ||
            parsed.searchParams.has("currentJobId"))
        );
      } catch {
        return false;
      }
    },
    { message: "Must be a LinkedIn job posting URL." },
  )
  .refine((url) => extractLinkedInJobId(url) !== null, {
    message: "Could not extract a job ID from the LinkedIn URL.",
  });

export const createJobApplicationBodySchema = z.object({
  url: linkedInJobUrlSchema,
  appliedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Applied date must be YYYY-MM-DD."),
});

export type CreateJobApplicationBody = z.infer<
  typeof createJobApplicationBodySchema
>;
