import { Router } from "express";
import { ZodError } from "zod";
import {
  educationBodySchema,
  previousJobBodySchema,
  projectBodySchema,
  skillBodySchema,
  userInfoBodySchema,
} from "../schemas/profile.js";
import {
  ProfileServiceError,
  createEducation,
  createPreviousJob,
  createProject,
  createSkill,
  deleteEducation,
  deletePreviousJob,
  deleteProject,
  deleteSkill,
  getProfile,
  updateEducation,
  updatePreviousJob,
  updateProject,
  updateSkill,
  upsertUserInfo,
} from "../services/profileService.js";

export const profileRouter = Router();

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
  if (error instanceof ProfileServiceError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

profileRouter.get("/", async (_req, res) => {
  try {
    const profile = await getProfile();
    res.json(profile);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.put("/user", async (req, res) => {
  try {
    const body = userInfoBodySchema.parse(req.body);
    const user = await upsertUserInfo(body);
    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.post("/education", async (req, res) => {
  try {
    const body = educationBodySchema.parse(req.body);
    const entry = await createEducation(body);
    res.status(201).json(entry);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.put("/education/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid education id" });
    return;
  }
  try {
    const body = educationBodySchema.parse(req.body);
    const entry = await updateEducation(id, body);
    res.json(entry);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.delete("/education/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid education id" });
    return;
  }
  try {
    await deleteEducation(id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.post("/skills", async (req, res) => {
  try {
    const body = skillBodySchema.parse(req.body);
    const skill = await createSkill(body);
    res.status(201).json(skill);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.put("/skills/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid skill id" });
    return;
  }
  try {
    const body = skillBodySchema.parse(req.body);
    const skill = await updateSkill(id, body);
    res.json(skill);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.delete("/skills/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid skill id" });
    return;
  }
  try {
    await deleteSkill(id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.post("/previous-jobs", async (req, res) => {
  try {
    const body = previousJobBodySchema.parse(req.body);
    const job = await createPreviousJob(body);
    res.status(201).json(job);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.put("/previous-jobs/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }
  try {
    const body = previousJobBodySchema.parse(req.body);
    const job = await updatePreviousJob(id, body);
    res.json(job);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.delete("/previous-jobs/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }
  try {
    await deletePreviousJob(id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.post("/projects", async (req, res) => {
  try {
    const body = projectBodySchema.parse(req.body);
    const project = await createProject(body);
    res.status(201).json(project);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.put("/projects/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  try {
    const body = projectBodySchema.parse(req.body);
    const project = await updateProject(id, body);
    res.json(project);
  } catch (error) {
    handleError(error, res);
  }
});

profileRouter.delete("/projects/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  try {
    await deleteProject(id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
});
