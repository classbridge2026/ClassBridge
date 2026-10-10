import { z } from "zod";
import { InstitutionStatus } from "@prisma/client";

export const createInstitutionSchema = z.object({
  name: z.string().trim().min(3, "Institution name must be at least 3 characters."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens."),
  timezone: z.string().trim().default("UTC"),
  adminEmail: z.string().trim().email("Valid admin email is required."),
  adminFullName: z.string().trim().min(2, "Admin full name is required."),
});

export const updateInstitutionSchema = z.object({
  id: z.string().uuid("Valid institution ID required."),
  name: z.string().trim().min(3, "Institution name must be at least 3 characters."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens."),
  timezone: z.string().trim().min(1, "Timezone is required."),
  status: z.nativeEnum(InstitutionStatus).optional(),
});

export const institutionIdSchema = z.object({
  id: z.string().uuid("Valid institution ID required."),
});

export const permanentDeleteSchema = z.object({
  id: z.string().uuid("Valid institution ID required."),
  confirmSlug: z.string().trim().min(1, "Slug confirmation is required."),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;
