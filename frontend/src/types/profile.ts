export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface Education {
  id: number;
  school: string;
  degreeType: string;
  areaOfStudy: string;
  gpa: string | null;
}

export interface Skill {
  id: number;
  skillName: string;
  proficiencyLevel: string;
}

export interface PreviousJob {
  id: number;
  companyName: string;
  jobTitle: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  jobId: number | null;
  skillIds: number[];
}

export interface Profile {
  user: UserInfo | null;
  education: Education[];
  skills: Skill[];
  previousJobs: PreviousJob[];
  projects: Project[];
}

export interface UserInfoInput {
  fullName: string;
  email: string;
  phone: string;
}

export interface EducationInput {
  school: string;
  degreeType: string;
  areaOfStudy: string;
  gpa: string;
}

export interface SkillInput {
  skillName: string;
  proficiencyLevel: string;
}

export interface PreviousJobInput {
  companyName: string;
  jobTitle: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
}

export interface ProjectInput {
  name: string;
  description: string;
  jobId: string;
  skillIds: number[];
}

export const PROFICIENCY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
] as const;
