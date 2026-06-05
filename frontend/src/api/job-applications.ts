import type {
  CreateJobApplicationInput,
  CreateJobApplicationResult,
} from "../types/job-application";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function submitJobApplication(
  body: CreateJobApplicationInput,
): Promise<CreateJobApplicationResult> {
  const response = await fetch("/api/job-applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<CreateJobApplicationResult>(response);
}

export function getResumeDownloadUrl(resumeId: number): string {
  return `/api/job-applications/resumes/${resumeId}/download`;
}
