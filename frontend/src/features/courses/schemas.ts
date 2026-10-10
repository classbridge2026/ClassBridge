import { z } from "zod";

export const createCourseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Course code must be at least 2 characters.")
    .toUpperCase(),
  title: z.string().trim().min(3, "Course title must be at least 3 characters."),
  description: z.string().trim().optional().or(z.literal("")),
  lecturerProfileId: z.string().uuid("Valid lecturer selection required.").optional().or(z.literal("")),
});

export const createModuleSchema = z.object({
  courseId: z.string().uuid("Valid course ID required."),
  title: z.string().trim().min(3, "Module title must be at least 3 characters."),
  description: z.string().trim().optional().or(z.literal("")),
});

export const enrollStudentSchema = z.object({
  courseId: z.string().uuid("Valid course ID required."),
  studentProfileId: z.string().uuid("Valid student selection required."),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
