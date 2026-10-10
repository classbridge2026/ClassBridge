import { z } from "zod";

export const createLecturerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the lecturer full name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter an email address.")
    .email("Enter a valid email address."),
  title: z.string().trim().optional(),
  temporaryPassword: z.string().optional(),
});

export type CreateLecturerInput = z.infer<typeof createLecturerSchema>;
