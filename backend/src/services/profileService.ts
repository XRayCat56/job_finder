import { prisma } from "../db.js";
import type {
  EducationBody,
  PreviousJobBody,
  ProjectBody,
  SkillBody,
  UserInfoBody,
} from "../schemas/profile.js";

export class ProfileServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

async function requireUserId(): Promise<number> {
  const user = await prisma.userInfo.findFirst({ select: { id: true } });
  if (!user) {
    throw new ProfileServiceError(
      "Save your profile information before adding other sections.",
      404,
    );
  }
  return user.id;
}

export async function getProfile(): Promise<{
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  education: Array<{
    id: number;
    school: string;
    degreeType: string;
    areaOfStudy: string;
    gpa: string | null;
  }>;
  skills: Array<{
    id: number;
    skillName: string;
    proficiencyLevel: string;
  }>;
  previousJobs: Array<{
    id: number;
    companyName: string;
    jobTitle: string;
    startMonth: number;
    startYear: number;
    endMonth: number | null;
    endYear: number | null;
  }>;
  projects: Array<{
    id: number;
    name: string;
    description: string | null;
    jobId: number | null;
    skillIds: number[];
  }>;
}> {
  const user = await prisma.userInfo.findFirst({
    include: {
      education: { orderBy: { id: "asc" } },
      skills: { orderBy: { id: "asc" } },
      previousJobs: { orderBy: { id: "asc" } },
      projects: {
        orderBy: { id: "asc" },
        include: { skills: { select: { skillId: true } } },
      },
    },
  });

  if (!user) {
    return {
      user: null,
      education: [],
      skills: [],
      previousJobs: [],
      projects: [],
    };
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
    education: user.education.map((entry) => ({
      id: entry.id,
      school: entry.school,
      degreeType: entry.degreeType,
      areaOfStudy: entry.areaOfStudy,
      gpa: entry.gpa?.toString() ?? null,
    })),
    skills: user.skills.map((skill) => ({
      id: skill.id,
      skillName: skill.skillName,
      proficiencyLevel: skill.proficiencyLevel,
    })),
    previousJobs: user.previousJobs.map((job) => ({
      id: job.id,
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      startMonth: job.startMonth,
      startYear: job.startYear,
      endMonth: job.endMonth,
      endYear: job.endYear,
    })),
    projects: user.projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      jobId: project.jobId,
      skillIds: project.skills.map((link) => link.skillId),
    })),
  };
}

export async function upsertUserInfo(
  body: UserInfoBody,
): Promise<{ id: number; fullName: string; email: string; phone: string | null }> {
  const existing = await prisma.userInfo.findFirst();

  if (existing) {
    const updated = await prisma.userInfo.update({
      where: { id: existing.id },
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone ?? null,
      },
    });
    return {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
    };
  }

  const created = await prisma.userInfo.create({
    data: {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone ?? null,
    },
  });
  return {
    id: created.id,
    fullName: created.fullName,
    email: created.email,
    phone: created.phone,
  };
}

export async function createEducation(body: EducationBody) {
  const userId = await requireUserId();
  return prisma.education.create({
    data: {
      userId,
      school: body.school,
      degreeType: body.degreeType,
      areaOfStudy: body.areaOfStudy,
      gpa: body.gpa ?? null,
    },
  });
}

export async function updateEducation(id: number, body: EducationBody) {
  const userId = await requireUserId();
  const existing = await prisma.education.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new ProfileServiceError("Education entry not found.", 404);
  }
  return prisma.education.update({
    where: { id },
    data: {
      school: body.school,
      degreeType: body.degreeType,
      areaOfStudy: body.areaOfStudy,
      gpa: body.gpa ?? null,
    },
  });
}

export async function deleteEducation(id: number): Promise<void> {
  const userId = await requireUserId();
  const existing = await prisma.education.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new ProfileServiceError("Education entry not found.", 404);
  }
  await prisma.education.delete({ where: { id } });
}

export async function createSkill(body: SkillBody) {
  const userId = await requireUserId();
  return prisma.skill.create({
    data: {
      userId,
      skillName: body.skillName,
      proficiencyLevel: body.proficiencyLevel,
    },
  });
}

export async function updateSkill(id: number, body: SkillBody) {
  const userId = await requireUserId();
  const existing = await prisma.skill.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new ProfileServiceError("Skill not found.", 404);
  }
  return prisma.skill.update({
    where: { id },
    data: {
      skillName: body.skillName,
      proficiencyLevel: body.proficiencyLevel,
    },
  });
}

export async function deleteSkill(id: number): Promise<void> {
  const userId = await requireUserId();
  const existing = await prisma.skill.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new ProfileServiceError("Skill not found.", 404);
  }
  await prisma.skill.delete({ where: { id } });
}

export async function createPreviousJob(body: PreviousJobBody) {
  const userId = await requireUserId();
  return prisma.previousJob.create({
    data: {
      userId,
      companyName: body.companyName,
      jobTitle: body.jobTitle,
      startMonth: body.startMonth,
      startYear: body.startYear,
      endMonth: body.endMonth ?? null,
      endYear: body.endYear ?? null,
    },
  });
}

export async function updatePreviousJob(id: number, body: PreviousJobBody) {
  const userId = await requireUserId();
  const existing = await prisma.previousJob.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new ProfileServiceError("Previous job not found.", 404);
  }
  return prisma.previousJob.update({
    where: { id },
    data: {
      companyName: body.companyName,
      jobTitle: body.jobTitle,
      startMonth: body.startMonth,
      startYear: body.startYear,
      endMonth: body.endMonth ?? null,
      endYear: body.endYear ?? null,
    },
  });
}

export async function deletePreviousJob(id: number): Promise<void> {
  const userId = await requireUserId();
  const existing = await prisma.previousJob.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new ProfileServiceError("Previous job not found.", 404);
  }
  await prisma.previousJob.delete({ where: { id } });
}

async function syncProjectSkills(
  projectId: number,
  userId: number,
  skillIds: number[],
): Promise<void> {
  if (skillIds.length === 0) {
    await prisma.projectSkill.deleteMany({ where: { projectId } });
    return;
  }

  const ownedSkills = await prisma.skill.findMany({
    where: { userId, id: { in: skillIds } },
    select: { id: true },
  });
  const ownedIds = new Set(ownedSkills.map((skill) => skill.id));
  const validSkillIds = skillIds.filter((id) => ownedIds.has(id));

  await prisma.projectSkill.deleteMany({ where: { projectId } });
  if (validSkillIds.length > 0) {
    await prisma.projectSkill.createMany({
      data: validSkillIds.map((skillId) => ({ projectId, skillId })),
    });
  }
}

export async function createProject(body: ProjectBody) {
  const userId = await requireUserId();

  if (body.jobId) {
    const job = await prisma.previousJob.findFirst({
      where: { id: body.jobId, userId },
    });
    if (!job) {
      throw new ProfileServiceError("Linked previous job not found.", 400);
    }
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name: body.name,
      description: body.description ?? null,
      jobId: body.jobId ?? null,
    },
  });

  await syncProjectSkills(project.id, userId, body.skillIds);
  return project;
}

export async function updateProject(id: number, body: ProjectBody) {
  const userId = await requireUserId();
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new ProfileServiceError("Project not found.", 404);
  }

  if (body.jobId) {
    const job = await prisma.previousJob.findFirst({
      where: { id: body.jobId, userId },
    });
    if (!job) {
      throw new ProfileServiceError("Linked previous job not found.", 400);
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description ?? null,
      jobId: body.jobId ?? null,
    },
  });

  await syncProjectSkills(id, userId, body.skillIds);
  return project;
}

export async function deleteProject(id: number): Promise<void> {
  const userId = await requireUserId();
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new ProfileServiceError("Project not found.", 404);
  }
  await prisma.project.delete({ where: { id } });
}
