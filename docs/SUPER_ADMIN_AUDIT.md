# ClassBridge — Super Admin Codebase & Architecture Audit

**Product:** ClassBridge  
**Document:** `SUPER_ADMIN_AUDIT.md`  
**Phase:** Phase 1 — Codebase Audit & Gap Analysis  
**Auditor:** Senior Full-Stack Engineer, Product Architect & Security Engineer  

---

## 1. Existing System Architecture & Tech Stack

ClassBridge is architected as a single full-stack Next.js (App Router) application written in strict TypeScript.

### 1.1 Technology Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS v4 + Lucide React v1.51 + custom utilities (`clsx`, `tailwind-merge`)
- **Database & ORM:** PostgreSQL + Prisma ORM v6 (`@prisma/client`)
- **Validation & Forms:** Zod v4 + React Hook Form v7 + `@hookform/resolvers`
- **Authentication:** Custom HTTP-only session cookie authentication (`lib/auth/session.ts`), bcryptjs password hashing.
- **Authorization & RBAC:** Server-side guard helpers in `lib/permissions/rbac.ts` (`requireSuperAdminUser()`, `requireRoleUser()`, `requireAuthUser()`).
- **Middleware Guard:** `src/middleware.ts` intercepts `/super-admin/:path*`, `/admin/:path*`, `/lecturer/:path*`, `/student/:path*`, redirecting unauthenticated users to `/login`.

---

## 2. Existing Database Schema Audit (Prisma)

### 2.1 Present Models (`prisma/schema.prisma`)
- `Institution` (id, name, slug, status [`ACTIVE`, `INACTIVE`, `TRASHED`], timezone, createdAt, updatedAt)
- `User` (id, email, passwordHash, fullName, avatarStorageKey, phone, status [`ACTIVE`, `INACTIVE`, `PENDING`], isPlatformSuperAdmin, createdAt, updatedAt)
- `Role` (id, key [`SUPER_ADMIN`, `INSTITUTION_ADMIN`, `LECTURER`, `STUDENT`], name)
- `InstitutionUser` (id, institutionId, userId, roleId, status [`ACTIVE`, `INACTIVE`])
- `StudentProfile` (id, institutionId, institutionUserId, studentNumber, extra)
- `LecturerProfile` (id, institutionId, institutionUserId, title, bio)
- `Course` (id, institutionId, lecturerProfileId, code, title, description, status [`DRAFT`, `ACTIVE`, `ARCHIVED`])
- `CourseModule` (id, courseId, title, description, sortOrder)
- `CourseEnrollment` (id, courseId, studentProfileId, enrolledAt)
- `ClassSession` (id, institutionId, courseId, title, roomName, status [`SCHEDULED`, `LIVE`, `COMPLETED`, `CANCELLED`])
- `ClassAttendance` (id, sessionId, studentProfileId, status [`PRESENT`, `LATE`, `ABSENT`])
- `ClassRecording` (id, sessionId, title, storageKey, durationSeconds, fileSizeBytes)
- `PasswordResetToken` (id, userId, tokenHash, expiresAt, usedAt)

### 2.2 Database Schema Recommendations for Super Admin SaaS Features
To support long-term auditability, global settings, and subscription tracking, the following schema expansions will be introduced in future database phases:
- `AuditLog`: `(id, actorUserId?, institutionId?, action, resourceType, resourceId?, metadata, createdAt, ip?)`
- `Subscription`: `(id, institutionId, planKey, status, currentPeriodStart, currentPeriodEnd, seatLimit, createdAt, updatedAt)`
- `PlatformSetting`: `(id, key, value, category, isSecret, updatedAt)`

---

## 3. Existing Super Admin Application Routes Audit

### 3.1 Implemented Routes
- `/super-admin` — Super Admin Dashboard (`page.tsx`)
- `/super-admin/institutions` — Institutions Management (`page.tsx` + `institutions-client-view.tsx`)
- `/super-admin/institutions/[id]` — Institution Detail View (`page.tsx`)
- `/super-admin/users` — User Directory (`page.tsx`)
- `/super-admin/subscriptions` — Subscription & Licensing Overview (`page.tsx`)
- `/super-admin/activity` — Activity Monitor (`page.tsx`)
- `/super-admin/settings` — Platform Settings (`page.tsx`)

### 3.2 Routes to Add / Upgrade
- `/super-admin/platform-users` — Dedicated directory for Super Admins and Platform Support Staff.
- `/super-admin/reports` — Platform-wide analytics, institution growth reports, and export tools.
- `/super-admin/courses` — Global Platform Courses & Programs overview.
- `/super-admin/users/[userId]` — Detailed user profile, membership audit, and access log view.

---

## 4. Component & Design System Inventory

### 4.1 Reusable UI Components Identified & Reused
- **Logo Component (`src/components/shared/logo.tsx`):** Renders official ClassBridge vector mark (Cap + Arch Bridge + Open Book with Green accent wings) and dual-tone typography (`CLASS` navy `#002B66` + `BRIDGE` blue `#0066FF`).
- **Sidebar (`src/components/layout/super-admin-sidebar.tsx`):** Dark navy (`#0B192C`), active navigation pills (`#0066FF`), official logo header, and bottom Campus Graphic Banner (`"Stronger Institutions, Better Education, A Brighter Future"`).
- **Header Bar (`src/components/layout/super-admin-header.tsx`):** Global search bar input (`#F1F6FB`), notification bell with unread badge (`3`), user profile avatar, name, role badge, and logout control.
- **Super Admin Dashboard (`src/app/(super-admin)/super-admin/page.tsx`):** 4 Stat cards, vector SVG Platform Growth line chart, recent activity feed, top institutions table, top courses completion rate table, quick actions grid.
- **Institutions Management View (`src/features/institutions/institutions-client-view.tsx`):** 5 Stat cards, vector SVG line chart ("Institutions Overview"), Donut chart ("Institutions by Type"), quick actions, data table with Active/Inactive/All filters, search, and action modals (`Create`, `Edit`, `View`, `Trash`, `Delete`).

---

## 5. Summary of Visual Reference Alignment & Gaps

| Feature Area | Current State | Target Reference State | Action Plan |
| --- | --- | --- | --- |
| **Branding & Logo** | Official ClassBridge vector logo & dual-tone typography implemented | Exact match | Maintain & reuse across all shells |
| **Sidebar Navigation** | Dark navy `#0B192C` with active blue pill `#0066FF` & campus graphic banner | Exact match | Add mobile drawer toggle for screens <1024px |
| **Header Bar** | Search bar, notification badge `3`, user profile dropdown | Exact match | Connect global search API endpoint |
| **Dashboard** | 4 Stat cards, line chart, activity feed, top institutions/courses tables | Exact match | Ensure 100% database query integration |
| **Institutions Management** | 5 Stat cards, line chart, donut chart, quick actions, data table, recent activity, empowering banner | Exact match | Add server-side pagination & location/type metadata fields |
| **Users Directory** | Basic table listing users & memberships | Needs role filters, search, status toggles, user details modal | Upgrade `/super-admin/users` in Phase 5 |
| **Platform Users** | Rendered inside main user directory | Dedicated route `/super-admin/platform-users` | Implement in Phase 5 |
| **Subscriptions** | Overview page shell | Full plans breakdown, renewal dates, revenue statistics | Upgrade in Phase 6 |
| **Reports** | Navigation link exists | Full analytics reports, date range selector, CSV export | Build in Phase 7 |
| **Activity Monitor** | Event stream from DB timestamps | Paginated audit timeline, event type filter, search | Upgrade in Phase 8 |
| **Settings & Security** | Basic settings shell | Categorized tabs (General, Security, Auth, Storage, Live Classes) | Upgrade in Phase 9 |

---

## 6. Audit Conclusion & Phase 1 Sign-Off

The existing ClassBridge codebase has a solid full-stack foundation with Next.js App Router, PostgreSQL, Prisma, server-side RBAC, and clean design system tokens.

Phase 1 audit is complete. We are ready to proceed to Phase 2 (Super Admin Design Alignment & Mobile Drawer Support) upon approval.
