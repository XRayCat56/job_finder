import * as cheerio from "cheerio";

const DESCRIPTION_DIV_CLASS =
  "show-more-less-html__markup show-more-less-html__markup--clamp-after-5 relative overflow-hidden";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ScrapedJobPosting {
  jobId: string;
  viewUrl: string;
  title: string;
  descriptionHtml: string;
  descriptionText: string;
}

export class LinkedInScraperError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "LinkedInScraperError";
  }
}

function isLinkedInJobUrl(url: string): boolean {
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
}

export function extractLinkedInJobId(url: string): string | null {
  try {
    const parsed = new URL(url);

    const currentJobId = parsed.searchParams.get("currentJobId");
    if (currentJobId && /^\d+$/.test(currentJobId)) {
      return currentJobId;
    }

    const viewMatch = parsed.pathname.match(
      /\/jobs\/view\/(?:[^/]*-)?(\d+)\/?$/,
    );
    if (viewMatch?.[1]) {
      return viewMatch[1];
    }

    const jobMatch = parsed.pathname.match(/\/jobs?\/(?:[^/]*-)?(\d+)\/?$/);
    if (jobMatch?.[1]) {
      return jobMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

export function buildLinkedInJobViewUrl(jobId: string): string {
  return `https://www.linkedin.com/jobs/view/${jobId}`;
}

function extractTitle($: cheerio.CheerioAPI): string {
  const h1Title = $("h1.topcard__title").first().text().trim();
  if (h1Title) {
    return h1Title;
  }

  const layoutTitle = $("h1.top-card-layout__title").first().text().trim();
  if (layoutTitle) {
    return layoutTitle;
  }

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  if (ogTitle) {
    const hiringMatch = ogTitle.match(/hiring\s+(.+?)\s+in\s+/i);
    if (hiringMatch?.[1]) {
      return hiringMatch[1].trim();
    }
    const pipeIndex = ogTitle.indexOf(" | ");
    if (pipeIndex > 0) {
      return ogTitle.slice(0, pipeIndex).trim();
    }
    return ogTitle;
  }

  const pageTitle = $("title").first().text().trim();
  if (pageTitle) {
    const pipeIndex = pageTitle.indexOf(" | ");
    if (pipeIndex > 0) {
      return pageTitle.slice(0, pipeIndex).trim();
    }
    return pageTitle;
  }

  return "";
}

function extractDescription($: cheerio.CheerioAPI): {
  html: string;
  text: string;
} {
  const descriptionDiv = $(`div.${DESCRIPTION_DIV_CLASS.split(" ").join(".")}`).first();

  if (descriptionDiv.length === 0) {
    const fallbackDiv = $("div.show-more-less-html__markup").first();
    if (fallbackDiv.length === 0) {
      return { html: "", text: "" };
    }
    return {
      html: fallbackDiv.html()?.trim() ?? "",
      text: fallbackDiv.text().trim(),
    };
  }

  return {
    html: descriptionDiv.html()?.trim() ?? "",
    text: descriptionDiv.text().trim(),
  };
}

export async function scrapeLinkedInJob(url: string): Promise<ScrapedJobPosting> {
  if (!isLinkedInJobUrl(url)) {
    throw new LinkedInScraperError(
      "URL must be a LinkedIn job posting link.",
      400,
    );
  }

  const jobId = extractLinkedInJobId(url);
  if (!jobId) {
    throw new LinkedInScraperError(
      "Could not extract a job ID from the LinkedIn URL.",
      400,
    );
  }

  const viewUrl = buildLinkedInJobViewUrl(jobId);

  let response: Response;
  try {
    response = await fetch(viewUrl, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach LinkedIn";
    throw new LinkedInScraperError(
      `Could not fetch job posting: ${message}`,
      502,
    );
  }

  if (!response.ok) {
    throw new LinkedInScraperError(
      `LinkedIn returned status ${response.status}. The posting may be unavailable or blocked.`,
      502,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = extractTitle($);
  if (!title) {
    throw new LinkedInScraperError(
      "Could not parse job title from the LinkedIn page.",
      422,
    );
  }

  const description = extractDescription($);
  if (!description.text) {
    throw new LinkedInScraperError(
      "Could not parse job description from the LinkedIn page.",
      422,
    );
  }

  return {
    jobId,
    viewUrl,
    title,
    descriptionHtml: description.html,
    descriptionText: description.text,
  };
}
