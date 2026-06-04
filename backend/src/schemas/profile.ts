import { z } from "zod";

export const userInfoBodySchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional().nullable(),
});

export const educationBodySchema = z.object({
  school: z.string().min(1).max(200),
  degreeType: z.string().min(1).max(100),
  areaOfStudy: z.string().min(1).max(200),
  gpa: z.coerce.number().min(0).max(4).optional().nullable(),
});

export const skillBodySchema = z.object({
  skillName: z.string().min(1).max(100),
  proficiencyLevel: z.string().min(1).max(50),
});

export const previousJobBodySchema = z.object({
  companyName: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  startMonth: z.coerce.number().int().min(1).max(12),
  startYear: z.coerce.number().int().min(1900).max(2100),
  endMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  endYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
});

export const projectBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  skillIds: z.array(z.coerce.number().int().positive()).default([]),
});

export type UserInfoBody = z.infer<typeof userInfoBodySchema>;
export type EducationBody = z.infer<typeof educationBodySchema>;
export type SkillBody = z.infer<typeof skillBodySchema>;
export type PreviousJobBody = z.infer<typeof previousJobBodySchema>;
export type ProjectBody = z.infer<typeof projectBodySchema>;
