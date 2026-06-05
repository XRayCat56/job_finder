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

export interface CreateJobApplicationInput {
  url: string;
  appliedDate: string;
}
