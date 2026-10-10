import { z } from "zod";
import { AcademicStatus, CourseStatus, SessionStatus, MembershipStatus } from "@prisma/client";

const optionalUuid = z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined);
const optionalText = z.string().trim().optional().or(z.literal("")).transform((v) => v || undefined);

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the student full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  studentNumber: optionalText,
  departmentId: optionalUuid,
  programId: optionalUuid,
  temporaryPassword: z.string().optional(),
});

export const updateStudentSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2, "Enter the student full name."),
  studentNumber: optionalText,
  departmentId: optionalUuid,
  programId: optionalUuid,
  status: z.nativeEnum(MembershipStatus),
});

export const createLecturerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the lecturer full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  title: optionalText,
  bio: optionalText,
  departmentId: optionalUuid,
  temporaryPassword: z.string().optional(),
});

export const updateLecturerSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2, "Enter the lecturer full name."),
  title: optionalText,
  bio: optionalText,
  departmentId: optionalUuid,
  status: z.nativeEnum(MembershipStatus),
});

export const createAdministratorSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the administrator full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  temporaryPassword: z.string().optional(),
});

export const updateAdministratorSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2, "Enter the administrator full name."),
  status: z.nativeEnum(MembershipStatus),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Department name is required."),
  code: z
    .string()
    .trim()
    .min(2, "Department code is required.")
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only.")
    .transform((v) => v.toUpperCase()),
  description: optionalText,
  status: z.nativeEnum(AcademicStatus).optional(),
});

export const updateDepartmentSchema = departmentSchema.extend({
  id: z.string().uuid(),
});

export const programSchema = z.object({
  name: z.string().trim().min(2, "Program name is required."),
  code: z
    .string()
    .trim()
    .min(2, "Program code is required.")
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only.")
    .transform((v) => v.toUpperCase()),
  description: optionalText,
  departmentId: optionalUuid,
  durationMonths: z.coerce.number().int().positive().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  status: z.nativeEnum(AcademicStatus).optional(),
});

export const updateProgramSchema = programSchema.extend({
  id: z.string().uuid(),
});

export const courseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Course code is required.")
    .transform((v) => v.toUpperCase()),
  title: z.string().trim().min(3, "Course title is required."),
  description: optionalText,
  lecturerProfileId: optionalUuid,
  departmentId: optionalUuid,
  programId: optionalUuid,
  status: z.nativeEnum(CourseStatus).optional(),
});

export const updateCourseSchema = courseSchema.extend({
  id: z.string().uuid(),
});

export const classSessionSchema = z.object({
  courseId: z.string().uuid("Select a course."),
  title: z.string().trim().min(3, "Class title is required."),
  description: optionalText,
  scheduledStart: optionalText,
  scheduledEnd: optionalText,
  status: z.nativeEnum(SessionStatus).optional(),
});

export const updateClassSessionSchema = classSessionSchema.extend({
  id: z.string().uuid(),
});

export const institutionSettingsSchema = z.object({
  name: z.string().trim().min(3, "Institution name is required."),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  phone: optionalText,
  website: optionalText,
  address: optionalText,
  country: optionalText,
  city: optionalText,
  description: optionalText,
  timezone: z.string().trim().min(1, "Timezone is required."),
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  temporaryPassword: z.string().min(8, "Password must be at least 8 characters.").optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });
