import { prisma } from "../db.js";
import { generateResponse } from "./geminiService.js";
import {
  LinkedInScraperError,
  scrapeLinkedInJob,
} from "./linkedinScraperService.js";
import {
  exportResumeContent,
  getResumeContentType,
  type ResumeDownloadFormat,
} from "./resumeExportService.js";

export class JobApplicationServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "JobApplicationServiceError";
  }
}

export interface CreateJobApplicationInput {
  url: string;
  appliedDate: string;
}

export interface JobApplicationRecord {
  id: number;
  title: string;
  link: string;
  appliedDate: string;
  userId: number;
}

export interface ResumeRecord {
  id: number;
  jobId: number;
  createdAt: string;
  userId: number;
}

export interface CreateJobApplicationResult {
  jobApplication: JobApplicationRecord;
  resume: ResumeRecord;
}

async function requireUserId(): Promise<number> {
  const user = await prisma.userInfo.findFirst({ select: { id: true } });
  if (!user) {
    throw new JobApplicationServiceError(
      "Save your profile information before submitting job applications.",
      404,
    );
  }
  return user.id;
}

function parseAppliedDate(appliedDate: string): Date {
  const parsed = new Date(`${appliedDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new JobApplicationServiceError(
      "Applied date must be a valid date.",
      400,
    );
  }
  return parsed;
}

function formatAppliedDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function buildResumePrompt(
  userId: number,
  jobDescription: string,
): Promise<string> {
  const user = await prisma.userInfo.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      phone: true,
      skills: { orderBy: { id: "asc" } },
      projects: {
        orderBy: { id: "asc" },
        include: {
          skills: {
            include: { skill: { select: { skillName: true } } },
          },
        },
      },
    },
  });

  if (!user) {
    throw new JobApplicationServiceError("User profile not found.", 404);
  }

  const skillsSection =
    user.skills.length > 0
      ? user.skills
        .map(
          (skill) =>
            `- ${skill.skillName} (${skill.proficiencyLevel})`,
        )
        .join("\n")
      : "No skills on file.";

  const projectsSection =
    user.projects.length > 0
      ? user.projects
        .map((project) => {
          const projectSkills = project.skills
            .map((link) => link.skill.skillName)
            .join(", ");
          const skillsSuffix = projectSkills
            ? ` | Skills used: ${projectSkills}`
            : "";
          const description = project.description?.trim() ?? "No description";
          return `- ${project.name}: ${description}${skillsSuffix}`;
        })
        .join("\n")
      : "No projects on file.";

  return `Create a tailored resume for the job posting below.

Candidate:
- Name: ${user.fullName}
- Email: ${user.email}
${user.phone ? `- Phone: ${user.phone}` : ""}

Candidate Skills:
${skillsSection}

Candidate Projects:
${projectsSection}

Job Posting Description:
${jobDescription}

Instructions:
- Write a complete, professional resume in plain text.
- Emphasize the candidate's skills and projects that best match this role.
- Use clear sections (e.g., Summary, Skills, Projects, Experience if inferable).
- Do not invent employers, degrees, or projects not supported by the data above.
- Keep the tone concise and ATS-friendly.`;
}

export async function createJobApplicationFromUrl(
  input: CreateJobApplicationInput,
): Promise<CreateJobApplicationResult> {
  const userId = await requireUserId();
  const appliedDate = parseAppliedDate(input.appliedDate);

  let scraped;
  try {
    scraped = await scrapeLinkedInJob(input.url);
  } catch (error) {
    if (error instanceof LinkedInScraperError) {
      throw new JobApplicationServiceError(error.message, error.statusCode);
    }
    throw error;
  }

  const jobApplication = await prisma.jobApplication.create({
    data: {
      title: scraped.title,
      link: scraped.viewUrl,
      appliedDate,
      userId,
    },
  });

  let resume;
  try {
    const prompt = await buildResumePrompt(userId, scraped.descriptionText);
    const { text: resumeContent } = await generateResponse({
      text: prompt,
      systemInstruction:
        "You are an expert resume writer. Produce polished, job-tailored resumes using only the candidate information provided." +
        "The resume download format will be either .docx or .pdf. Format the resume accordingly.",
    });

    resume = await prisma.resume.create({
      data: {
        docContent: resumeContent,
        jobId: jobApplication.id,
        userId,
      },
    });
  } catch (error) {
    await prisma.jobApplication.delete({ where: { id: jobApplication.id } });
    throw error;
  }

  return {
    jobApplication: {
      id: jobApplication.id,
      title: jobApplication.title,
      link: jobApplication.link,
      appliedDate: formatAppliedDate(jobApplication.appliedDate),
      userId: jobApplication.userId,
    },
    resume: {
      id: resume.id,
      jobId: resume.jobId,
      createdAt: resume.createdAt.toISOString(),
      userId: resume.userId,
    },
  };
}

export interface ResumeDownloadResult {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export async function getResumeDownload(
  resumeId: number,
  format: ResumeDownloadFormat,
): Promise<ResumeDownloadResult> {
  const userId = await requireUserId();

  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      jobApplication: { select: { title: true } },
    },
  });

  if (!resume) {
    throw new JobApplicationServiceError("Resume not found.", 404);
  }

  const safeTitle = resume.jobApplication.title
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const baseName = `${safeTitle || "resume"}-resume`;

  return {
    filename: `${baseName}.${format}`,
    content: await exportResumeContent(resume.docContent, format),
    contentType: getResumeContentType(format),
  };
}
