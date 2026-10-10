import { z } from "zod";

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the student full name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter an email address.")
    .email("Enter a valid email address."),
  studentNumber: z.string().trim().optional(),
  temporaryPassword: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
