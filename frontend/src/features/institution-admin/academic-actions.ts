"use server";

import { revalidatePath } from "next/cache";
import { AcademicStatus, CourseStatus, SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireInstitutionAdmin, assertSameInstitution } from "@/lib/permissions/institution-admin";
import { writeAuditLog } from "@/services/audit";
import {
  classSessionSchema,
  courseSchema,
  departmentSchema,
  programSchema,
  updateClassSessionSchema,
  updateCourseSchema,
  updateDepartmentSchema,
  updateProgramSchema,
} from "./schemas";
import { ActionFormState, fieldErrorsFromZod } from "./form-state";

function revalidateAcademic(extra: string[] = []) {
  const paths = [
    "/institution-admin",
    "/institution-admin/departments",
    "/institution-admin/programs",
    "/institution-admin/courses",
    "/institution-admin/classes",
    ...extra,
  ];
  for (const path of paths) revalidatePath(path);
}

async function assertDept(institutionId: string, departmentId?: string) {
  if (!departmentId) return null;
  const row = await prisma.department.findFirst({ where: { id: departmentId, institutionId } });
  return row ? null : "Department not found in this institution.";
}

async function assertProgram(institutionId: string, programId?: string) {
  if (!programId) return null;
  const row = await prisma.program.findFirst({ where: { id: programId, institutionId } });
  return row ? null : "Program not found in this institution.";
}

async function assertLecturer(institutionId: string, lecturerProfileId?: string) {
  if (!lecturerProfileId) return null;
  const row = await prisma.lecturerProfile.findFirst({ where: { id: lecturerProfileId, institutionId } });
  return row ? null : "Lecturer not found in this institution.";
}

async function assertCourse(institutionId: string, courseId: string) {
  const row = await prisma.course.findFirst({ where: { id: courseId, institutionId } });
  return row ? null : "Course not found in this institution.";
}

export async function createDepartmentAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    const row = await prisma.department.create({
      data: {
        institutionId,
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description ?? null,
      },
    });
    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "department.created",
      resourceType: "Department",
      resourceId: row.id,
    });
    revalidateAcademic([`/institution-admin/departments/${row.id}`]);
    return { ok: true, message: "Department created." };
  } catch {
    return { ok: false, error: "Could not create department. Code may already exist." };
  }
}

export async function updateDepartmentAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = updateDepartmentSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const existing = await prisma.department.findUnique({ where: { id: parsed.data.id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  try {
    await prisma.department.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description ?? null,
        status: parsed.data.status ?? existing.status,
      },
    });
    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "department.updated",
      resourceType: "Department",
      resourceId: existing.id,
    });
    revalidateAcademic([`/institution-admin/departments/${existing.id}`]);
    return { ok: true, message: "Department updated." };
  } catch {
    return { ok: false, error: "Could not update department. Code may already exist." };
  }
}

export async function setDepartmentStatusAction(id: string, status: AcademicStatus): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }
  await prisma.department.update({ where: { id }, data: { status } });
  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: status === "ACTIVE" ? "department.activated" : "department.deactivated",
    resourceType: "Department",
    resourceId: id,
  });
  revalidateAcademic([`/institution-admin/departments/${id}`]);
  return { ok: true, message: status === "ACTIVE" ? "Department activated." : "Department deactivated." };
}

export async function createProgramAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    durationMonths: formData.get("durationMonths") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const deptErr = await assertDept(institutionId, parsed.data.departmentId);
  if (deptErr) return { ok: false, error: deptErr };

  try {
    const row = await prisma.program.create({
      data: {
        institutionId,
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description ?? null,
        departmentId: parsed.data.departmentId ?? null,
        durationMonths: parsed.data.durationMonths ?? null,
      },
    });
    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "program.created",
      resourceType: "Program",
      resourceId: row.id,
    });
    revalidateAcademic([`/institution-admin/programs/${row.id}`]);
    return { ok: true, message: "Program created." };
  } catch {
    return { ok: false, error: "Could not create program. Code may already exist." };
  }
}

export async function updateProgramAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = updateProgramSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    durationMonths: formData.get("durationMonths") || undefined,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const existing = await prisma.program.findUnique({ where: { id: parsed.data.id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  const deptErr = await assertDept(institutionId, parsed.data.departmentId);
  if (deptErr) return { ok: false, error: deptErr };

  try {
    await prisma.program.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description ?? null,
        departmentId: parsed.data.departmentId ?? null,
        durationMonths: parsed.data.durationMonths ?? null,
        status: parsed.data.status ?? existing.status,
      },
    });
    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "program.updated",
      resourceType: "Program",
      resourceId: existing.id,
    });
    revalidateAcademic([`/institution-admin/programs/${existing.id}`]);
    return { ok: true, message: "Program updated." };
  } catch {
    return { ok: false, error: "Could not update program. Code may already exist." };
  }
}

export async function setProgramStatusAction(id: string, status: AcademicStatus): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }
  await prisma.program.update({ where: { id }, data: { status } });
  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: status === "ACTIVE" ? "program.activated" : "program.deactivated",
    resourceType: "Program",
    resourceId: id,
  });
  revalidateAcademic([`/institution-admin/programs/${id}`]);
  return { ok: true, message: status === "ACTIVE" ? "Program activated." : "Program deactivated." };
}

export async function createCourseAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = courseSchema.safeParse({
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    lecturerProfileId: formData.get("lecturerProfileId") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    programId: formData.get("programId") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  for (const err of [
    await assertDept(institutionId, parsed.data.departmentId),
    await assertProgram(institutionId, parsed.data.programId),
    await assertLecturer(institutionId, parsed.data.lecturerProfileId),
  ]) {
    if (err) return { ok: false, error: err };
  }

  try {
    const row = await prisma.course.create({
      data: {
        institutionId,
        code: parsed.data.code,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        lecturerProfileId: parsed.data.lecturerProfileId ?? null,
        departmentId: parsed.data.departmentId ?? null,
        programId: parsed.data.programId ?? null,
      },
    });
    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "course.created",
      resourceType: "Course",
      resourceId: row.id,
    });
    revalidateAcademic([`/institution-admin/courses/${row.id}`]);
    return { ok: true, message: "Course created." };
  } catch {
    return { ok: false, error: "Could not create course. Code may already exist." };
  }
}

export async function updateCourseAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = updateCourseSchema.safeParse({
    id: formData.get("id"),
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    lecturerProfileId: formData.get("lecturerProfileId") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    programId: formData.get("programId") || undefined,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const existing = await prisma.course.findUnique({ where: { id: parsed.data.id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  for (const err of [
    await assertDept(institutionId, parsed.data.departmentId),
    await assertProgram(institutionId, parsed.data.programId),
    await assertLecturer(institutionId, parsed.data.lecturerProfileId),
  ]) {
    if (err) return { ok: false, error: err };
  }

  try {
    await prisma.course.update({
      where: { id: existing.id },
      data: {
        code: parsed.data.code,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        lecturerProfileId: parsed.data.lecturerProfileId ?? null,
        departmentId: parsed.data.departmentId ?? null,
        programId: parsed.data.programId ?? null,
        status: parsed.data.status ?? existing.status,
      },
    });
    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "course.updated",
      resourceType: "Course",
      resourceId: existing.id,
    });
    revalidateAcademic([`/institution-admin/courses/${existing.id}`]);
    return { ok: true, message: "Course updated." };
  } catch {
    return { ok: false, error: "Could not update course. Code may already exist." };
  }
}

export async function setCourseStatusAction(id: string, status: CourseStatus): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }
  await prisma.course.update({ where: { id }, data: { status } });
  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "course.status_changed",
    resourceType: "Course",
    resourceId: id,
    metadata: { status },
  });
  revalidateAcademic([`/institution-admin/courses/${id}`]);
  return { ok: true, message: `Course marked ${status.toLowerCase()}.` };
}

export async function createClassAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = classSessionSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    scheduledStart: formData.get("scheduledStart") || undefined,
    scheduledEnd: formData.get("scheduledEnd") || undefined,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const courseErr = await assertCourse(institutionId, parsed.data.courseId);
  if (courseErr) return { ok: false, error: courseErr };

  const status = parsed.data.status ?? SessionStatus.SCHEDULED;
  if (status === SessionStatus.LIVE || status === SessionStatus.COMPLETED) {
    return { ok: false, error: "New classes must be Draft, Scheduled, or Cancelled." };
  }

  const scheduledStart = parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null;
  const scheduledEnd = parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null;
  if (scheduledStart && scheduledEnd && scheduledEnd <= scheduledStart) {
    return { ok: false, error: "End time must be after start time.", fieldErrors: { scheduledEnd: "Must be after start." } };
  }

  const row = await prisma.classSession.create({
    data: {
      institutionId,
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      roomName: `class_${crypto.randomUUID().slice(0, 8)}`,
      status,
      scheduledStart,
      scheduledEnd,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "class.scheduled",
    resourceType: "ClassSession",
    resourceId: row.id,
  });
  revalidateAcademic([`/institution-admin/classes/${row.id}`]);
  return { ok: true, message: "Class created." };
}

export async function updateClassAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = updateClassSessionSchema.safeParse({
    id: formData.get("id"),
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    scheduledStart: formData.get("scheduledStart") || undefined,
    scheduledEnd: formData.get("scheduledEnd") || undefined,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const existing = await prisma.classSession.findUnique({ where: { id: parsed.data.id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  const courseErr = await assertCourse(institutionId, parsed.data.courseId);
  if (courseErr) return { ok: false, error: courseErr };

  const scheduledStart = parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null;
  const scheduledEnd = parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null;
  if (scheduledStart && scheduledEnd && scheduledEnd <= scheduledStart) {
    return { ok: false, error: "End time must be after start time." };
  }

  // Institution admin can publish/cancel/edit but not force LIVE (lecturer owns live classroom)
  const nextStatus = parsed.data.status ?? existing.status;
  if (nextStatus === SessionStatus.LIVE && existing.status !== SessionStatus.LIVE) {
    return { ok: false, error: "Live status is controlled from the lecturer classroom." };
  }

  await prisma.classSession.update({
    where: { id: existing.id },
    data: {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      scheduledStart,
      scheduledEnd,
      status: nextStatus,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "class.updated",
    resourceType: "ClassSession",
    resourceId: existing.id,
  });
  revalidateAcademic([`/institution-admin/classes/${existing.id}`]);
  return { ok: true, message: "Class updated." };
}

export async function setClassStatusAction(id: string, status: SessionStatus): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const existing = await prisma.classSession.findUnique({ where: { id } });
  if (!existing || !assertSameInstitution(existing.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }
  if (status === SessionStatus.LIVE) {
    return { ok: false, error: "Live status is controlled from the lecturer classroom." };
  }
  await prisma.classSession.update({ where: { id }, data: { status } });
  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: status === SessionStatus.CANCELLED ? "class.cancelled" : "class.status_changed",
    resourceType: "ClassSession",
    resourceId: id,
    metadata: { status },
  });
  revalidateAcademic([`/institution-admin/classes/${id}`]);
  return { ok: true, message: `Class marked ${status.toLowerCase()}.` };
}
