# ClassBridge — Super Admin Complete Interface Rebuild Plan

**Product:** ClassBridge EdTech SaaS Platform  
**Document:** `SUPER_ADMIN_REBUILD_PLAN.md`  
**Goal:** Full UI/UX Rebuild + Production-Ready Real Database Connection + Server-Side Authorization + Responsive Mobile Support  

---

## 1. Existing Infrastructure & Reusability Assessment

### 1.1 Preserved Backend Infrastructure
- **Prisma Schema (`prisma/schema.prisma`):** Preserving all 13 existing database models (`Institution`, `User`, `Role`, `InstitutionUser`, `StudentProfile`, `LecturerProfile`, `Course`, `CourseModule`, `CourseEnrollment`, `ClassSession`, `ClassAttendance`, `ClassRecording`, `PasswordResetToken`).
- **Authentication (`lib/auth/session.ts`):** Preserving HTTP-only session cookie authentication and bcryptjs password hashing.
- **Server Authorization (`lib/permissions/rbac.ts`):** Preserving `requireSuperAdminUser()`, `requireRoleUser()`, and `requireAuthUser()`.
- **Middleware Protection (`src/middleware.ts`):** Enforcing server-side redirects for unauthenticated users accessing `/super-admin/*`.

---

## 2. Target Super Admin Route Architecture

The following 8 core routes and detail sub-routes will be created and fully connected to PostgreSQL database queries via Prisma:

| Route Path | Purpose | Database Queries / Actions |
| --- | --- | --- |
| `/super-admin` | Super Admin Dashboard | Real database counts (`Institution`, `User`, `RoleKey`), line chart, recent activity feed, top institutions, top courses, quick actions |
| `/super-admin/institutions` | Institutions Management | Real database institution list with search, status filtering, type donut breakdown, line chart, Create/Edit/Trash/Restore actions |
| `/super-admin/institutions/[institutionId]` | Institution Detail Page | Detailed campus profile, membership counts, assigned courses, active sessions, and admin user directory |
| `/super-admin/users` | Global User Directory | Search, role filtering (`SUPER_ADMIN`, `INSTITUTION_ADMIN`, `LECTURER`, `STUDENT`), institution selector, user status toggling, user details |
| `/super-admin/users/[userId]` | User Detail Page | User profile, platform roles, institution memberships, enrollment history, and security logs |
| `/super-admin/platform-users` | Platform Staff Directory | Platform super admins & support personnel list, add super admin action, status controls |
| `/super-admin/subscriptions` | Subscriptions & Licensing | Subscription plans breakdown, active/trial institution count, renewal calendar, license management |
| `/super-admin/reports` | Analytics & Reports | Platform growth analytics, user growth reports, attendance stats, date range filter, export action |
| `/super-admin/activity` | Activity Monitor | Platform activity log, action category filters (`INSTITUTION`, `USER`, `SECURITY`), actor search, timestamp timeline |
| `/super-admin/settings` | Categorized Platform Settings | Tabbed settings (General, Security, Authentication, Storage, Live Classes), Zod validation, server action persistence |

---

## 3. Server Actions & Feature Logic Inventory

### 3.1 Feature Actions (`src/features/super-admin/actions.ts` & `src/features/institutions/actions.ts`)
- `createInstitutionAction`: Form action to create new institution with validated slug, timezone, and optional admin user.
- `updateInstitutionAction`: Edit institution details, timezone, and status (`ACTIVE`, `INACTIVE`, `TRASHED`).
- `toggleUserStatusAction`: Activate or suspend user accounts platform-wide.
- `createPlatformUserAction`: Grant platform super admin privileges to a user.
- `savePlatformSettingsAction`: Persist platform settings (General, Auth, Live Classes, Storage) to server config/DB.

---

## 4. Rebuild Execution Strategy

1. **Rebuild Component Architecture:** Create modular components in `src/components/super-admin/` for stat cards, line charts, donut charts, data tables, modals, and detail drawers.
2. **Rebuild All 8 Route Surfaces:** Implement `/super-admin`, `/super-admin/institutions`, `/super-admin/institutions/[institutionId]`, `/super-admin/users`, `/super-admin/users/[userId]`, `/super-admin/platform-users`, `/super-admin/subscriptions`, `/super-admin/reports`, `/super-admin/activity`, `/super-admin/settings`.
3. **Connect to Prisma Database:** Ensure every statistics card, list table, chart, filter, search, and action uses real server-side queries.
4. **Verification & Build Testing:** Execute `npm run lint` and verify zero errors and warnings.
