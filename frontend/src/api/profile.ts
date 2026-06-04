import type {
  EducationInput,
  PreviousJobInput,
  Profile,
  ProjectInput,
  SkillInput,
  UserInfo,
  UserInfoInput,
} from "../types/profile";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchProfile(): Promise<Profile> {
  const response = await fetch("/api/profile");
  return parseJsonResponse<Profile>(response);
}

export async function saveUserInfo(body: UserInfoInput): Promise<UserInfo> {
  const response = await fetch("/api/profile/user", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone.trim() === "" ? null : body.phone,
    }),
  });
  return parseJsonResponse<UserInfo>(response);
}

export async function createEducation(
  body: EducationInput,
): Promise<void> {
  const response = await fetch("/api/profile/education", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toEducationPayload(body)),
  });
  await parseJsonResponse(response);
}

export async function updateEducation(
  id: number,
  body: EducationInput,
): Promise<void> {
  const response = await fetch(`/api/profile/education/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toEducationPayload(body)),
  });
  await parseJsonResponse(response);
}

export async function deleteEducation(id: number): Promise<void> {
  const response = await fetch(`/api/profile/education/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    await parseJsonResponse(response);
  }
}

export async function createSkill(body: SkillInput): Promise<void> {
  const response = await fetch("/api/profile/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await parseJsonResponse(response);
}

export async function updateSkill(id: number, body: SkillInput): Promise<void> {
  const response = await fetch(`/api/profile/skills/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await parseJsonResponse(response);
}

export async function deleteSkill(id: number): Promise<void> {
  const response = await fetch(`/api/profile/skills/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    await parseJsonResponse(response);
  }
}

export async function createPreviousJob(
  body: PreviousJobInput,
): Promise<void> {
  const response = await fetch("/api/profile/previous-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPreviousJobPayload(body)),
  });
  await parseJsonResponse(response);
}

export async function updatePreviousJob(
  id: number,
  body: PreviousJobInput,
): Promise<void> {
  const response = await fetch(`/api/profile/previous-jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPreviousJobPayload(body)),
  });
  await parseJsonResponse(response);
}

export async function deletePreviousJob(id: number): Promise<void> {
  const response = await fetch(`/api/profile/previous-jobs/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    await parseJsonResponse(response);
  }
}

export async function createProject(body: ProjectInput): Promise<void> {
  const response = await fetch("/api/profile/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toProjectPayload(body)),
  });
  await parseJsonResponse(response);
}

export async function updateProject(
  id: number,
  body: ProjectInput,
): Promise<void> {
  const response = await fetch(`/api/profile/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toProjectPayload(body)),
  });
  await parseJsonResponse(response);
}

export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`/api/profile/projects/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    await parseJsonResponse(response);
  }
}

function toEducationPayload(body: EducationInput): Record<string, unknown> {
  return {
    school: body.school,
    degreeType: body.degreeType,
    areaOfStudy: body.areaOfStudy,
    gpa: body.gpa.trim() === "" ? null : Number(body.gpa),
  };
}

function toPreviousJobPayload(
  body: PreviousJobInput,
): Record<string, unknown> {
  return {
    companyName: body.companyName,
    jobTitle: body.jobTitle,
    startMonth: Number(body.startMonth),
    startYear: Number(body.startYear),
    endMonth: body.isCurrent ? null : Number(body.endMonth),
    endYear: body.isCurrent ? null : Number(body.endYear),
  };
}

function toProjectPayload(body: ProjectInput): Record<string, unknown> {
  return {
    name: body.name,
    description: body.description.trim() === "" ? null : body.description,
    jobId: body.jobId === "" ? null : Number(body.jobId),
    skillIds: body.skillIds,
  };
}
