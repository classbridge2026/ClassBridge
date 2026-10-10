import { z } from "zod";

export const createAssessmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  timeLimitMins: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    }),
  questionPrompt: z.string().trim().min(2).max(1000),
  questionType: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  options: z.string().optional().or(z.literal("")),
  correctAnswer: z.string().trim().min(1).max(500),
  points: z.coerce.number().int().positive().default(1),
  published: z.boolean().optional(),
});

export const submitAttemptSchema = z.object({
  assessmentId: z.string().uuid(),
});
