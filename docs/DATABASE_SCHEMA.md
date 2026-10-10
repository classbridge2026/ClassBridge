# ClassBridge — Database Schema

PostgreSQL via Prisma. This document is the **target relational design**. Migrations are added **by phase** — do not create every table in Phase 2.

Convention:

- UUID primary keys (`id`)
- `createdAt` / `updatedAt` on all tables
- `institutionId` on every tenant-scoped entity
- Foreign keys with `ON DELETE` chosen to prevent orphan tenant data
- Indexes on `institutionId`, `userId`, `courseId`, `classId`, `status`, `createdAt` where listed

---

## 1. Design principles

1. **Tenant isolation in the data model**, not only in the UI.
2. **Users are global people; membership is per institution.** A person can theoretically belong to multiple institutions with different roles.
3. **Profiles** hold role-specific fields (student ID, lecturer title) without duplicating login identity.
4. **Metadata in Postgres; blobs in object storage** (`storageKey`).
5. **Enums** for statuses to keep application and DB aligned.
6. **No Transit College-specific tables or columns.**

---

## 2. Entity relationship (core)

```text
PlatformSetting
Institution ── InstitutionSetting
     │
     ├── InstitutionUser ── User
     │         │
     │         ├── Role / permissions
     │         ├── StudentProfile
     │         └── LecturerProfile
     │
     ├── Course
     │     ├── CourseLecturer → InstitutionUser/User
     │     ├── CourseEnrollment → Student (User)
     │     ├── CourseModule
     │     ├── LearningMaterial
     │     ├── Class
     │     │     ├── ClassSession
     │     │     ├── ClassParticipant
     │     │     ├── Attendance
     │     │     ├── ClassChatMessage
     │     │     └── Recording
     │     ├── Assignment (later)
     │     └── Assessment (later)
     │
     ├── Notification
     ├── Conversation / Message (later)
     └── AuditLog (institutionId nullable for platform events)

Subscription (later) → Institution
```

---

## 3. Phase 2 — foundation models (migrated)

Implemented in `frontend/prisma/schema.prisma` and migration `20261004001723_init_core_models`.

### Institution

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| name | string | Display name |
| slug | string | Unique URL-safe identifier |
| status | enum | `ACTIVE`, `INACTIVE` |
| timezone | string | IANA timezone |

**Indexes:** unique `slug`; `status`.

### User

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| email | string | Unique, lowercase |
| passwordHash | string | Never returned to client |
| fullName | string | |
| avatarStorageKey | string? | Object storage |
| phone | string? | |
| status | enum | `ACTIVE`, `INACTIVE`, `PENDING` |
| emailVerifiedAt | datetime? | |
| isPlatformSuperAdmin | boolean | Platform role flag (or via Role table) |

**Indexes:** unique `email`; `status`.

Super Admin may have no `InstitutionUser` rows.

### Role

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| key | enum/string | `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `LECTURER`, `STUDENT` |
| name | string | |

Seeded, not freely created by tenants in v1.

### InstitutionUser

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| institutionId | UUID | FK |
| userId | UUID | FK |
| roleId | UUID | FK |
| status | enum | `ACTIVE`, `INACTIVE` |
| unique | (institutionId, userId) | One membership row per institution (role changes update this row, or we later allow multiple roles) |

**Indexes:** `(institutionId, userId)` unique; `userId`; `roleId`.

v1 assumption: **one role per institution membership**. Multiple roles in one school can be a later migration.

### StudentProfile

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| institutionUserId | UUID | Unique FK |
| studentNumber | string? | Unique **per institution** |
| extra | json? | Optional institution fields without schema churn |

**Indexes:** unique `(institutionId via join)` + `studentNumber` — implement as unique `(institutionUserId)` plus a unique `(institutionId, studentNumber)` if `institutionId` is denormalized onto the profile (recommended for query simplicity).

**Recommendation:** denormalize `institutionId` onto StudentProfile, LecturerProfile, and all course/class tables.

### LecturerProfile

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| institutionId | UUID | Denormalized |
| institutionUserId | UUID | Unique FK |
| title | string? | e.g. display title |
| bio | string? | |

---

## 4. Auth support tables (Phase 4)

### Session (if database sessions)

`id`, `userId`, `institutionId?`, `expiresAt`, `createdAt`

### PasswordResetToken

`id`, `userId`, `tokenHash`, `expiresAt`, `usedAt?`

Do not store raw tokens.

---

## 5. Courses (Phase 8)

### Course

`id`, `institutionId`, `code?`, `title`, `description?`, `status` (`DRAFT`, `PUBLISHED`, `ARCHIVED`)

**Indexes:** `(institutionId, status)`, `(institutionId, title)`

### CourseLecturer

`id`, `institutionId`, `courseId`, `userId` (lecturer), unique `(courseId, userId)`

### CourseEnrollment

`id`, `institutionId`, `courseId`, `userId` (student), `status` (`ACTIVE`, `REMOVED`), unique `(courseId, userId)`

### CourseModule

`id`, `institutionId`, `courseId`, `title`, `description?`, `position` (int), `status`

---

## 6. Classes, classroom, attendance, chat (Phases 11–14)

### Class

`id`, `institutionId`, `courseId`, `lecturerUserId`, `title`, `description?`, `startsAt`, `endsAt`, `status` (`SCHEDULED`, `LIVE`, `COMPLETED`, `CANCELLED`)

**Indexes:** `(institutionId, startsAt)`, `(courseId, startsAt)`, `(lecturerUserId, startsAt)`, `status`

### ClassSession

`id`, `institutionId`, `classId` (unique or 1:1 for v1), `livekitRoomName`, `startedAt`, `endedAt?`, `startedByUserId`

v1: one session per class (rescheduling cancelled classes creates a new Class).

### ClassParticipant

`id`, `institutionId`, `classId`, `userId`, `roleInClass` (`LECTURER`, `STUDENT`), `joinedAt?`, `leftAt?`

### Attendance

`id`, `institutionId`, `classId`, `userId`, `joinedAt?`, `leftAt?`, `durationSeconds?`, `status` (`PRESENT`, `LATE`, `ABSENT`, `LEFT_EARLY`)

Unique `(classId, userId)`.

### ClassChatMessage

`id`, `institutionId`, `classId`, `userId`, `body`, `createdAt`

---

## 7. Recordings and files (Phases 13, 16)

### Recording

`id`, `institutionId`, `classId`, `title`, `durationSeconds?`, `storageKey?`, `status` (`PROCESSING`, `READY`, `PUBLISHED`, `UNPUBLISHED`, `FAILED`, `DELETED`), `startedByUserId`, `publishedAt?`, `publishedByUserId?`

**Indexes:** `(institutionId, status)`, `classId`

### LearningMaterial

`id`, `institutionId`, `courseId`, `moduleId?`, `title`, `fileName`, `contentType`, `byteSize`, `storageKey`, `createdByUserId`

### (Optional) FileObject

Shared metadata table if we want one abstraction for avatars, materials, and recordings. Not required in Phase 2.

---

## 8. Notifications and audit (Phases 6+, 15)

### Notification

`id`, `institutionId?`, `userId`, `type`, `title`, `body`, `resourceType?`, `resourceId?`, `readAt?`, `createdAt`

**Indexes:** `(userId, readAt, createdAt)`

### NotificationPreference

`userId` + `institutionId` + channel/type flags.

### AuditLog

`id`, `actorUserId?`, `institutionId?`, `action`, `resourceType`, `resourceId?`, `metadata` (json, redacted), `createdAt`, `ip?` (optional)

**Indexes:** `(institutionId, createdAt)`, `(actorUserId, createdAt)`, `action`

---

## 9. Later models (do not migrate early)

### Assignment / AssignmentSubmission

Assignment: course, title, dueAt, published, createdBy.  
Submission: assignment, student, submittedAt, storageKeys, grade, feedback. Unique `(assignmentId, userId)` for v1 single submission.

### Assessment / AssessmentQuestion / AssessmentAttempt / Result

Attempt scoped to student + assessment; Result may be a view over attempts/grades.

### Conversation / ConversationParticipant / Message

Institution-scoped; participants must share allowed relationship (same institution; policy later).

### Subscription

`institutionId`, `planKey`, `status`, `currentPeriodEnd`, `seatLimit?`

### PlatformSetting / InstitutionSetting

Key-value or typed columns. InstitutionSetting includes lateness threshold, recording default = off, whether students may screen-share.

---

## 10. Seed data (development only)

Prisma `seed.ts` may create:

- Platform Super Admin
- Institution **Transit College** (ordinary row)
- Institution Admin, Lecturer, Student memberships
- Optional sample course later (not in Phase 2 unless useful)

Production never depends on these names. Tests should also create **Institution B** to prove isolation.

---

## 11. Indexing and performance

Add indexes when tables are created, not as an afterthought:

- All FKs used in WHERE
- Composite `(institutionId, createdAt)` for lists
- Unique constraints that encode business rules (enrollment, attendance, slug, email)

Pagination: keyset or `skip/take` with caps; never unbounded `findMany` for students/courses/classes/recordings/audit.

---

## 12. Prisma rules

- Single `schema.prisma`; migrations in version control
- Prisma Client **only** imported from `src/lib/db` (or equivalent) on the server
- Soft deletes only where we need history (`DELETED` recording status, `REMOVED` enrollment); prefer status enums over silent physical deletes for auditability
