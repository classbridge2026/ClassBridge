import { z } from "zod";

export const createAssignmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  dueAt: z.string().optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export const publishAssignmentSchema = z.object({
  assignmentId: z.string().uuid(),
});

export const submitWorkSchema = z.object({
  assignmentId: z.string().uuid(),
  textContent: z.string().trim().max(20000).optional().or(z.literal("")),
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  grade: z.coerce.number().min(0).max(100),
  feedback: z.string().trim().max(5000).optional().or(z.literal("")),
});
