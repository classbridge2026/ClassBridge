"use server";

import { revalidatePath } from "next/cache";
import { MembershipStatus, RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireInstitutionAdmin, assertSameInstitution } from "@/lib/permissions/institution-admin";
import { writeAuditLog } from "@/services/audit";
import { assertSeatAvailable } from "@/services/subscriptions";
import {
  createAdministratorSchema,
  createLecturerSchema,
  createStudentSchema,
  resetPasswordSchema,
  updateAdministratorSchema,
  updateLecturerSchema,
  updateStudentSchema,
} from "./schemas";
import {
  ActionFormState,
  DEFAULT_TEMP_PASSWORD,
  fieldErrorsFromZod,
} from "./form-state";

const PATHS = [
  "/institution-admin",
  "/institution-admin/students",
  "/institution-admin/lecturers",
  "/institution-admin/administrators",
];

function revalidatePeople() {
  for (const path of PATHS) revalidatePath(path);
}

async function resolveBelongingDeptProgram(
  institutionId: string,
  departmentId?: string,
  programId?: string,
) {
  if (departmentId) {
    const dept = await prisma.department.findFirst({ where: { id: departmentId, institutionId } });
    if (!dept) return "Department not found in this institution.";
  }
  if (programId) {
    const program = await prisma.program.findFirst({ where: { id: programId, institutionId } });
    if (!program) return "Program not found in this institution.";
  }
  return null;
}

export async function createStudentAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const seatError = await assertSeatAvailable(institutionId);
  if (seatError) return { ok: false, error: seatError };

  const parsed = createStudentSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    studentNumber: formData.get("studentNumber") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    programId: formData.get("programId") || undefined,
    temporaryPassword: formData.get("temporaryPassword") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const belongErr = await resolveBelongingDeptProgram(
    institutionId,
    parsed.data.departmentId,
    parsed.data.programId,
  );
  if (belongErr) return { ok: false, error: belongErr };

  const emailLower = parsed.data.email;
  const studentNumber = parsed.data.studentNumber ?? null;
  const tempPassword =
    parsed.data.temporaryPassword && parsed.data.temporaryPassword.length >= 8
      ? parsed.data.temporaryPassword
      : DEFAULT_TEMP_PASSWORD;

  try {
    const studentRole = await prisma.role.findUnique({ where: { key: RoleKey.STUDENT } });
    if (!studentRole) return { ok: false, error: "System role STUDENT not found." };

    if (studentNumber) {
      const existingNumber = await prisma.studentProfile.findFirst({
        where: { institutionId, studentNumber },
      });
      if (existingNumber) {
        return { ok: false, error: "That student number is already in use.", fieldErrors: { studentNumber: "Already in use." } };
      }
    }

    const passwordHash = await hashPassword(tempPassword);
    let createdProfileId = "";

    await prisma.$transaction(async (tx) => {
      let dbUser = await tx.user.findUnique({ where: { email: emailLower } });
      if (!dbUser) {
        dbUser = await tx.user.create({
          data: {
            email: emailLower,
            fullName: parsed.data.fullName,
            passwordHash,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
          },
        });
      }

      const existingMembership = await tx.institutionUser.findUnique({
        where: { institutionId_userId: { institutionId, userId: dbUser.id } },
        include: { studentProfile: true },
      });
      if (existingMembership?.studentProfile) throw new Error("STUDENT_EXISTS");
      if (existingMembership && existingMembership.roleId !== studentRole.id) throw new Error("ROLE_CONFLICT");

      const membership =
        existingMembership ??
        (await tx.institutionUser.create({
          data: { institutionId, userId: dbUser.id, roleId: studentRole.id, status: "ACTIVE" },
        }));

      const profile = await tx.studentProfile.create({
        data: {
          institutionId,
          institutionUserId: membership.id,
          studentNumber,
          departmentId: parsed.data.departmentId ?? null,
          programId: parsed.data.programId ?? null,
        },
      });
      createdProfileId = profile.id;
    });

    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "student.created",
      resourceType: "StudentProfile",
      resourceId: createdProfileId,
      metadata: { email: emailLower },
    });

    revalidatePeople();
    return { ok: true, message: `Student created. Temporary password: ${tempPassword}` };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "STUDENT_EXISTS") return { ok: false, error: "This user is already a student at this institution." };
      if (error.message === "ROLE_CONFLICT") return { ok: false, error: "This email already belongs to a different campus role." };
    }
    console.error(error);
    return { ok: false, error: "Failed to create student." };
  }
}

export async function updateStudentAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = updateStudentSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    studentNumber: formData.get("studentNumber") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    programId: formData.get("programId") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { id: parsed.data.id },
    include: { institutionUser: true },
  });
  if (!profile || !assertSameInstitution(profile.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  const belongErr = await resolveBelongingDeptProgram(
    institutionId,
    parsed.data.departmentId,
    parsed.data.programId,
  );
  if (belongErr) return { ok: false, error: belongErr };

  if (parsed.data.studentNumber) {
    const clash = await prisma.studentProfile.findFirst({
      where: {
        institutionId,
        studentNumber: parsed.data.studentNumber,
        NOT: { id: profile.id },
      },
    });
    if (clash) return { ok: false, error: "Student number already in use." };
  }

  await prisma.$transaction([
    prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        studentNumber: parsed.data.studentNumber ?? null,
        departmentId: parsed.data.departmentId ?? null,
        programId: parsed.data.programId ?? null,
      },
    }),
    prisma.institutionUser.update({
      where: { id: profile.institutionUserId },
      data: { status: parsed.data.status },
    }),
    prisma.user.update({
      where: { id: profile.institutionUser.userId },
      data: { fullName: parsed.data.fullName },
    }),
  ]);

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "student.updated",
    resourceType: "StudentProfile",
    resourceId: profile.id,
  });

  revalidatePeople();
  revalidatePath(`/institution-admin/students/${profile.id}`);
  return { ok: true, message: "Student updated." };
}

export async function setStudentStatusAction(id: string, status: MembershipStatus): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const profile = await prisma.studentProfile.findUnique({ where: { id } });
  if (!profile || !assertSameInstitution(profile.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }
  await prisma.institutionUser.update({
    where: { id: profile.institutionUserId },
    data: { status },
  });
  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: status === "ACTIVE" ? "student.activated" : "student.suspended",
    resourceType: "StudentProfile",
    resourceId: id,
  });
  revalidatePeople();
  revalidatePath(`/institution-admin/students/${id}`);
  return { ok: true, message: status === "ACTIVE" ? "Student activated." : "Student suspended." };
}

export async function createLecturerAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const seatError = await assertSeatAvailable(institutionId);
  if (seatError) return { ok: false, error: seatError };

  const parsed = createLecturerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    title: formData.get("title") || undefined,
    bio: formData.get("bio") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    temporaryPassword: formData.get("temporaryPassword") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const belongErr = await resolveBelongingDeptProgram(institutionId, parsed.data.departmentId);
  if (belongErr) return { ok: false, error: belongErr };

  const emailLower = parsed.data.email;
  const tempPassword =
    parsed.data.temporaryPassword && parsed.data.temporaryPassword.length >= 8
      ? parsed.data.temporaryPassword
      : DEFAULT_TEMP_PASSWORD;

  try {
    const lecturerRole = await prisma.role.findUnique({ where: { key: RoleKey.LECTURER } });
    if (!lecturerRole) return { ok: false, error: "System role LECTURER not found." };

    const passwordHash = await hashPassword(tempPassword);
    let createdId = "";

    await prisma.$transaction(async (tx) => {
      let dbUser = await tx.user.findUnique({ where: { email: emailLower } });
      if (!dbUser) {
        dbUser = await tx.user.create({
          data: {
            email: emailLower,
            fullName: parsed.data.fullName,
            passwordHash,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
          },
        });
      }

      const existingMembership = await tx.institutionUser.findUnique({
        where: { institutionId_userId: { institutionId, userId: dbUser.id } },
        include: { lecturerProfile: true },
      });
      if (existingMembership?.lecturerProfile) throw new Error("LECTURER_EXISTS");
      if (existingMembership && existingMembership.roleId !== lecturerRole.id) throw new Error("ROLE_CONFLICT");

      const membership =
        existingMembership ??
        (await tx.institutionUser.create({
          data: { institutionId, userId: dbUser.id, roleId: lecturerRole.id, status: "ACTIVE" },
        }));

      const profile = await tx.lecturerProfile.create({
        data: {
          institutionId,
          institutionUserId: membership.id,
          title: parsed.data.title ?? null,
          bio: parsed.data.bio ?? null,
          departmentId: parsed.data.departmentId ?? null,
        },
      });
      createdId = profile.id;
    });

    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "lecturer.created",
      resourceType: "LecturerProfile",
      resourceId: createdId,
      metadata: { email: emailLower },
    });

    revalidatePeople();
    return { ok: true, message: `Lecturer created. Temporary password: ${tempPassword}` };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LECTURER_EXISTS") return { ok: false, error: "This user is already a lecturer at this institution." };
      if (error.message === "ROLE_CONFLICT") return { ok: false, error: "This email already belongs to a different campus role." };
    }
    console.error(error);
    return { ok: false, error: "Failed to create lecturer." };
  }
}

export async function updateLecturerAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = updateLecturerSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    title: formData.get("title") || undefined,
    bio: formData.get("bio") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const profile = await prisma.lecturerProfile.findUnique({
    where: { id: parsed.data.id },
    include: { institutionUser: true },
  });
  if (!profile || !assertSameInstitution(profile.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  const belongErr = await resolveBelongingDeptProgram(institutionId, parsed.data.departmentId);
  if (belongErr) return { ok: false, error: belongErr };

  await prisma.$transaction([
    prisma.lecturerProfile.update({
      where: { id: profile.id },
      data: {
        title: parsed.data.title ?? null,
        bio: parsed.data.bio ?? null,
        departmentId: parsed.data.departmentId ?? null,
      },
    }),
    prisma.institutionUser.update({
      where: { id: profile.institutionUserId },
      data: { status: parsed.data.status },
    }),
    prisma.user.update({
      where: { id: profile.institutionUser.userId },
      data: { fullName: parsed.data.fullName },
    }),
  ]);

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "lecturer.updated",
    resourceType: "LecturerProfile",
    resourceId: profile.id,
  });

  revalidatePeople();
  revalidatePath(`/institution-admin/lecturers/${profile.id}`);
  return { ok: true, message: "Lecturer updated." };
}

export async function setLecturerStatusAction(id: string, status: MembershipStatus): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const profile = await prisma.lecturerProfile.findUnique({ where: { id } });
  if (!profile || !assertSameInstitution(profile.institutionId, institutionId)) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }
  await prisma.institutionUser.update({ where: { id: profile.institutionUserId }, data: { status } });
  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: status === "ACTIVE" ? "lecturer.activated" : "lecturer.suspended",
    resourceType: "LecturerProfile",
    resourceId: id,
  });
  revalidatePeople();
  revalidatePath(`/institution-admin/lecturers/${id}`);
  return { ok: true, message: status === "ACTIVE" ? "Lecturer activated." : "Lecturer suspended." };
}

export async function createAdministratorAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const seatError = await assertSeatAvailable(institutionId);
  if (seatError) return { ok: false, error: seatError };

  const parsed = createAdministratorSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    temporaryPassword: formData.get("temporaryPassword") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const emailLower = parsed.data.email;
  const tempPassword =
    parsed.data.temporaryPassword && parsed.data.temporaryPassword.length >= 8
      ? parsed.data.temporaryPassword
      : DEFAULT_TEMP_PASSWORD;

  try {
    const adminRole = await prisma.role.findUnique({ where: { key: RoleKey.INSTITUTION_ADMIN } });
    if (!adminRole) return { ok: false, error: "System role INSTITUTION_ADMIN not found." };

    const passwordHash = await hashPassword(tempPassword);
    let membershipId = "";

    await prisma.$transaction(async (tx) => {
      let dbUser = await tx.user.findUnique({ where: { email: emailLower } });
      if (!dbUser) {
        dbUser = await tx.user.create({
          data: {
            email: emailLower,
            fullName: parsed.data.fullName,
            passwordHash,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
            isPlatformSuperAdmin: false,
          },
        });
      }

      if (dbUser.isPlatformSuperAdmin) throw new Error("PLATFORM_USER");

      const existing = await tx.institutionUser.findUnique({
        where: { institutionId_userId: { institutionId, userId: dbUser.id } },
        include: { role: true },
      });
      if (existing?.role.key === RoleKey.INSTITUTION_ADMIN) throw new Error("ADMIN_EXISTS");
      if (existing) throw new Error("ROLE_CONFLICT");

      const membership = await tx.institutionUser.create({
        data: {
          institutionId,
          userId: dbUser.id,
          roleId: adminRole.id,
          status: "ACTIVE",
        },
      });
      membershipId = membership.id;
    });

    await writeAuditLog({
      actorUserId: user.id,
      institutionId,
      action: "administrator.invited",
      resourceType: "InstitutionUser",
      resourceId: membershipId,
      metadata: { email: emailLower },
    });

    revalidatePeople();
    return { ok: true, message: `Administrator invited. Temporary password: ${tempPassword}` };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ADMIN_EXISTS") return { ok: false, error: "This user is already an administrator here." };
      if (error.message === "ROLE_CONFLICT") return { ok: false, error: "This email already belongs to a different campus role." };
      if (error.message === "PLATFORM_USER") return { ok: false, error: "Cannot invite platform-level users as institution administrators." };
    }
    console.error(error);
    return { ok: false, error: "Failed to invite administrator." };
  }
}

export async function updateAdministratorAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId, institutionUserId } = await requireInstitutionAdmin();
  const parsed = updateAdministratorSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const membership = await prisma.institutionUser.findUnique({
    where: { id: parsed.data.id },
    include: { role: true, user: true },
  });
  if (
    !membership ||
    !assertSameInstitution(membership.institutionId, institutionId) ||
    membership.role.key !== RoleKey.INSTITUTION_ADMIN
  ) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  if (membership.id === institutionUserId && parsed.data.status === "INACTIVE") {
    return { ok: false, error: "You cannot suspend your own administrator account." };
  }

  await prisma.$transaction([
    prisma.institutionUser.update({
      where: { id: membership.id },
      data: { status: parsed.data.status },
    }),
    prisma.user.update({
      where: { id: membership.userId },
      data: { fullName: parsed.data.fullName },
    }),
  ]);

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "administrator.updated",
    resourceType: "InstitutionUser",
    resourceId: membership.id,
  });

  revalidatePeople();
  return { ok: true, message: "Administrator updated." };
}

export async function setAdministratorStatusAction(
  id: string,
  status: MembershipStatus,
): Promise<ActionFormState> {
  const { user, institutionId, institutionUserId } = await requireInstitutionAdmin();
  if (id === institutionUserId && status === "INACTIVE") {
    return { ok: false, error: "You cannot suspend your own administrator account." };
  }

  const membership = await prisma.institutionUser.findUnique({
    where: { id },
    include: { role: true },
  });
  if (
    !membership ||
    !assertSameInstitution(membership.institutionId, institutionId) ||
    membership.role.key !== RoleKey.INSTITUTION_ADMIN
  ) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }

  await prisma.institutionUser.update({ where: { id }, data: { status } });
  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: status === "ACTIVE" ? "administrator.activated" : "administrator.suspended",
    resourceType: "InstitutionUser",
    resourceId: id,
  });
  revalidatePeople();
  return { ok: true, message: status === "ACTIVE" ? "Administrator activated." : "Administrator suspended." };
}

export async function resetUserPasswordAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();
  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    temporaryPassword: formData.get("temporaryPassword") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const membership = await prisma.institutionUser.findFirst({
    where: { institutionId, userId: parsed.data.userId },
    include: { role: true, user: true },
  });
  if (!membership) {
    return { ok: false, error: "You don't have permission to access this resource." };
  }
  if (membership.user.isPlatformSuperAdmin || membership.role.key === RoleKey.SUPER_ADMIN) {
    return { ok: false, error: "Cannot reset password for platform-level accounts." };
  }

  const tempPassword =
    parsed.data.temporaryPassword && parsed.data.temporaryPassword.length >= 8
      ? parsed.data.temporaryPassword
      : DEFAULT_TEMP_PASSWORD;
  const passwordHash = await hashPassword(tempPassword);
  await prisma.user.update({ where: { id: parsed.data.userId }, data: { passwordHash } });

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "user.password_reset",
    resourceType: "User",
    resourceId: parsed.data.userId,
  });

  return { ok: true, message: `Password reset. Temporary password: ${tempPassword}` };
}
