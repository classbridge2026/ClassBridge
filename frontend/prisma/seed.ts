import {
  MembershipStatus,
  PrismaClient,
  RoleKey,
  UserStatus,
  CourseStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Development-only credentials. Never use these values in production. */
export const DEV_SEED_PASSWORD = "ClassBridge!dev1";

async function upsertRole(key: RoleKey, name: string) {
  return prisma.role.upsert({
    where: { key },
    update: { name },
    create: { key, name },
  });
}

async function upsertUser(data: {
  email: string;
  fullName: string;
  passwordHash: string;
  status: UserStatus;
  isPlatformSuperAdmin?: boolean;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      status: data.status,
      isPlatformSuperAdmin: data.isPlatformSuperAdmin ?? false,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: data.email,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      status: data.status,
      isPlatformSuperAdmin: data.isPlatformSuperAdmin ?? false,
      emailVerifiedAt: new Date(),
    },
  });
}

async function upsertInstitution(data: {
  slug: string;
  name: string;
  timezone: string;
}) {
  return prisma.institution.upsert({
    where: { slug: data.slug },
    update: { name: data.name, timezone: data.timezone },
    create: data,
  });
}

async function upsertMembership(data: {
  institutionId: string;
  userId: string;
  roleId: string;
  status?: MembershipStatus;
}) {
  return prisma.institutionUser.upsert({
    where: {
      institutionId_userId: {
        institutionId: data.institutionId,
        userId: data.userId,
      },
    },
    update: {
      roleId: data.roleId,
      status: data.status ?? MembershipStatus.ACTIVE,
    },
    create: {
      institutionId: data.institutionId,
      userId: data.userId,
      roleId: data.roleId,
      status: data.status ?? MembershipStatus.ACTIVE,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_SEED_PASSWORD, 12);

  const [superAdminRole, institutionAdminRole, lecturerRole, studentRole] =
    await Promise.all([
      upsertRole(RoleKey.SUPER_ADMIN, "Super Admin"),
      upsertRole(RoleKey.INSTITUTION_ADMIN, "Institution Admin"),
      upsertRole(RoleKey.LECTURER, "Lecturer"),
      upsertRole(RoleKey.STUDENT, "Student"),
    ]);

  void superAdminRole;

  const transit = await upsertInstitution({
    slug: "transit-college",
    name: "Transit College",
    timezone: "Africa/Freetown",
  });

  const riverside = await upsertInstitution({
    slug: "riverside-institute",
    name: "Riverside Institute",
    timezone: "UTC",
  });

  await upsertUser({
    email: "superadmin@classbridge.local",
    fullName: "ClassBridge Super Admin",
    passwordHash,
    status: UserStatus.ACTIVE,
    isPlatformSuperAdmin: true,
  });

  const transitAdmin = await upsertUser({
    email: "admin@transit.local",
    fullName: "Aminata Sesay",
    passwordHash,
    status: UserStatus.ACTIVE,
  });

  const transitLecturer = await upsertUser({
    email: "lecturer@transit.local",
    fullName: "Ibrahim Kamara",
    passwordHash,
    status: UserStatus.ACTIVE,
  });

  const transitStudent = await upsertUser({
    email: "student@transit.local",
    fullName: "Osman Tholley",
    passwordHash,
    status: UserStatus.ACTIVE,
  });

  const riversideAdmin = await upsertUser({
    email: "admin@riverside.local",
    fullName: "Grace Mensah",
    passwordHash,
    status: UserStatus.ACTIVE,
  });

  const riversideStudent = await upsertUser({
    email: "student@riverside.local",
    fullName: "Daniel Owusu",
    passwordHash,
    status: UserStatus.ACTIVE,
  });

  await upsertMembership({
    institutionId: transit.id,
    userId: transitAdmin.id,
    roleId: institutionAdminRole.id,
  });

  const lecturerMembership = await upsertMembership({
    institutionId: transit.id,
    userId: transitLecturer.id,
    roleId: lecturerRole.id,
  });

  const studentMembership = await upsertMembership({
    institutionId: transit.id,
    userId: transitStudent.id,
    roleId: studentRole.id,
  });

  await upsertMembership({
    institutionId: riverside.id,
    userId: riversideAdmin.id,
    roleId: institutionAdminRole.id,
  });

  const riversideStudentMembership = await upsertMembership({
    institutionId: riverside.id,
    userId: riversideStudent.id,
    roleId: studentRole.id,
  });

  const lecturerProfile = await prisma.lecturerProfile.upsert({
    where: { institutionUserId: lecturerMembership.id },
    update: {
      institutionId: transit.id,
      title: "Senior Lecturer",
      bio: "Teaches computing courses at Transit College.",
    },
    create: {
      institutionId: transit.id,
      institutionUserId: lecturerMembership.id,
      title: "Senior Lecturer",
      bio: "Teaches computing courses at Transit College.",
    },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { institutionUserId: studentMembership.id },
    update: {
      institutionId: transit.id,
      studentNumber: "TC-0001",
    },
    create: {
      institutionId: transit.id,
      institutionUserId: studentMembership.id,
      studentNumber: "TC-0001",
    },
  });

  await prisma.studentProfile.upsert({
    where: { institutionUserId: riversideStudentMembership.id },
    update: {
      institutionId: riverside.id,
      studentNumber: "RI-0001",
    },
    create: {
      institutionId: riverside.id,
      institutionUserId: riversideStudentMembership.id,
      studentNumber: "RI-0001",
    },
  });

  // Seed Course 1: Web Development (CS101)
  const webDevCourse = await prisma.course.upsert({
    where: {
      institutionId_code: {
        institutionId: transit.id,
        code: "CS101",
      },
    },
    update: {
      title: "Web Development",
      description: "Full-stack HTML, CSS, JavaScript, and Web System Architecture.",
      lecturerProfileId: lecturerProfile.id,
      status: CourseStatus.ACTIVE,
    },
    create: {
      institutionId: transit.id,
      code: "CS101",
      title: "Web Development",
      description: "Full-stack HTML, CSS, JavaScript, and Web System Architecture.",
      lecturerProfileId: lecturerProfile.id,
      status: CourseStatus.ACTIVE,
    },
  });

  // Seed Course Modules for Web Development
  const existingModules = await prisma.courseModule.count({ where: { courseId: webDevCourse.id } });
  if (existingModules === 0) {
    await prisma.courseModule.createMany({
      data: [
        { courseId: webDevCourse.id, title: "Module 1: HTML Basics & Semantic Structure", sortOrder: 1 },
        { courseId: webDevCourse.id, title: "Module 2: CSS Layouts & Responsive Design", sortOrder: 2 },
        { courseId: webDevCourse.id, title: "Module 3: JavaScript & DOM Manipulation", sortOrder: 3 },
      ],
    });
  }

  // Seed Student Enrollment (Osman Tholley into CS101)
  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentProfileId: {
        courseId: webDevCourse.id,
        studentProfileId: studentProfile.id,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      studentProfileId: studentProfile.id,
    },
  });

  // Seed Class Session 1: Completed Web Systems Lecture
  const existingSessions = await prisma.classSession.count({ where: { courseId: webDevCourse.id } });
  if (existingSessions === 0) {
    const session = await prisma.classSession.create({
      data: {
        institutionId: transit.id,
        courseId: webDevCourse.id,
        title: "CS101 Web Systems & DOM Manipulation",
        roomName: "CS101-ROOM",
        status: "COMPLETED",
        startedAt: new Date(Date.now() - 3600000 * 24), // 24 hrs ago
        endedAt: new Date(Date.now() - 3600000 * 23),
      },
    });

    // Seed Attendance Record for Osman Tholley
    await prisma.classAttendance.create({
      data: {
        sessionId: session.id,
        studentProfileId: studentProfile.id,
        joinedAt: new Date(Date.now() - 3600000 * 24),
        leftAt: new Date(Date.now() - 3600000 * 23),
        durationMinutes: 60,
        status: "PRESENT",
      },
    });

    // Seed Recording Archive
    await prisma.classRecording.create({
      data: {
        sessionId: session.id,
        title: "CS101 DOM & Event Listeners Broadcast",
        storageKey: "recordings/cs101-lecture-1.mp4",
        durationSeconds: 3600,
        fileSizeBytes: BigInt(450 * 1024 * 1024), // 450MB
      },
    });
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);
  const proEnd = new Date();
  proEnd.setFullYear(proEnd.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { institutionId: transit.id },
    update: {
      planKey: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      seatLimit: 500,
      currentPeriodEnd: proEnd,
    },
    create: {
      institutionId: transit.id,
      planKey: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      seatLimit: 500,
      currentPeriodEnd: proEnd,
    },
  });

  await prisma.subscription.upsert({
    where: { institutionId: riverside.id },
    update: {
      planKey: SubscriptionPlan.TRIAL,
      status: SubscriptionStatus.TRIALING,
      seatLimit: 50,
      currentPeriodEnd: trialEnd,
    },
    create: {
      institutionId: riverside.id,
      planKey: SubscriptionPlan.TRIAL,
      status: SubscriptionStatus.TRIALING,
      seatLimit: 50,
      currentPeriodEnd: trialEnd,
    },
  });

  console.log("Seed complete (courses, sessions, attendance, recordings, subscriptions).");
  console.log("Super Admin is not a member of any institution.");
  console.log(`Password for all seed users: ${DEV_SEED_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
