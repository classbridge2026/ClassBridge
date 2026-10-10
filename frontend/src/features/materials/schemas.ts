import { z } from "zod";

export const uploadMaterialSchema = z.object({
  courseId: z.string().uuid("Valid course ID required."),
  moduleId: z.string().uuid("Valid module ID required.").optional().or(z.literal("")),
  title: z.string().trim().min(2, "Title must be at least 2 characters."),
});

export const deleteMaterialSchema = z.object({
  materialId: z.string().uuid("Valid material ID required."),
  courseId: z.string().uuid("Valid course ID required."),
});

export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>;
export type DeleteMaterialInput = z.infer<typeof deleteMaterialSchema>;
