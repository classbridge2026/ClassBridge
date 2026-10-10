# ClassBridge — Development Roadmap

**Principle:** Architect first. Implement in phases. Stop for approval after each major phase.

This roadmap is the delivery contract. Phase 0 ends when these documents are approved.

---

## How every phase is executed

1. Explain what we are building  
2. Explain the architecture  
3. List files to create or modify  
4. Implement  
5. Run lint / build / tests  
6. Fix errors  
7. Explain what was completed  
8. Show how to test manually  
9. State what remains  
10. **STOP** — wait for approval before the next major phase  

If something breaks: identify → explain → locate → fix → test → verify. Do not rewrite the project.

**Quality bar:** UI → server action/API → validation → business logic → database/external service → authorization → response → UI. No dummy buttons. No hardcoded tenant/business data. No client-side Prisma.

---

## PHASE 0 — Product and architecture — APPROVED

**Deliverables:**

- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/PRODUCT_MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/SECURITY.md`
- `docs/DEVELOPMENT_ROADMAP.md`

**Done when:** you approve the architecture (including the Phase 4 login decision: email-first).

**Not in this phase:** Next.js app, Prisma migrations, UI.

---

## PHASE 1 — Project foundation — COMPLETE

Next.js + TypeScript application in `frontend/` with Tailwind, ESLint, Prisma 6 scaffolding (no domain models), `.env.example`, `src/` layout, and README.

**Verified:** `npm run lint`, `npm run build`, `npx prisma generate`.

**Note:** Git was not available on the PATH on the development machine during this phase. Initialize the repository when Git is installed.

---

---

## PHASE 2 — Database foundation — COMPLETE

Prisma models: Institution, User, Role, InstitutionUser, StudentProfile, LecturerProfile.

Migration `20261004001723_init_core_models` applied. Development seed includes Transit College, Riverside Institute (isolation fixture), Super Admin, institution admins, a lecturer, and students. Passwords are hashed. No tenant names are hardcoded in application logic.

**Verified:** `npx prisma validate`, migrate, seed, `npm run lint`, `npm run build`.

---

## PHASE 3 — Design system + public website

Logo treatment, tokens (colors/type), landing, login **UI**, forgot/reset **UI**, responsive nav, footer.

Login form may be present; it need not authenticate until Phase 4 (if so, state clearly — prefer wiring in Phase 4 rather than a dead submit). **Decision:** Phase 3 ships static/marketing + form UI; Phase 4 makes login real. Avoid a Login button that alerts.

---

## PHASE 4 — Authentication

Hashing, sessions, login/logout, password reset, protected routes, role detection, authorization helpers, rate limiting foundation.

**Tests:** login, deactivated user, wrong-role route/API.

---

## PHASE 5 — User management

Profiles, account status, role display, avatar upload path (storage can be stubbed with the storage interface if object storage is not yet provisioned — **must not** fake success without storing a key; if storage is missing, delay avatar binary to Phase 16 and keep name/password).

Prefer: name/password/preferences in Phase 5; photo when storage interface exists (Phase 5 with local adapter or Phase 16). **Recommendation:** filesystem/local adapter in Phase 5 so profiles are real.

---

## PHASE 6 — Institution management

Super Admin CRUD, activate/deactivate, institution admins, tenant isolation enforcement and tests.

---

## PHASE 7 — Admin dashboards

Super Admin and Institution Admin dashboards with **real** counts. Empty states if zero. No fake metrics.

---

## PHASE 8 — Course management

Courses, modules, lecturers, enrollments, course details. Server-side scoping.

---

## PHASE 9 — Student experience

Student dashboard, My Courses, course details, upcoming classes (may be empty until Phase 11), notifications shell if table exists, profile.

If classes are not yet modeled, upcoming classes is an empty state — not fake classes.

---

## PHASE 10 — Lecturer experience

Lecturer dashboard, My Courses, class management shell, schedule entry point, profile.

---

## PHASE 11 — Class scheduling

Create/edit/cancel class, statuses, upcoming, notifications if Notification model is ready (else queue for Phase 15).

---

## PHASE 12 — Virtual classroom

LiveKit integration. Lecturer and student classroom capabilities per requirements. Chat + raise hand. Token API. Authorization tests.

---

## PHASE 13 — Recordings

Egress, object storage, status machine, publish/unpublish, student visibility. Never silent record.

---

## PHASE 14 — Attendance

Join/leave/duration/status. Lecturer and admin views. Not derived from enrollment alone.

---

## PHASE 15 — Notifications

Reminders, recording published, enrollment, read/unread, preferences. Scheduler as needed.

---

## PHASE 16 — Learning materials

Upload/download, course permissions, object storage, file validation.

---

## PHASE 17 — Assignments

Create, publish, submit, grade, feedback.

---

## PHASE 18 — Assessments

Quizzes/exams, questions, attempts, grading, results.

---

## PHASE 19 — Private messaging

Conversations, messages, permissions. Separate from class chat.

---

## PHASE 20 — Analytics

Activity, attendance, course/class/recording stats, institution analytics. Real queries.

---

## PHASE 21 — Mobile application

React Native + Expo. Same backend. No second API product.

---

## PHASE 22 — SaaS / subscriptions

Plans, licensing, billing, limits, trials. Only after the education product is stable.

---

## PHASE 23 — Production hardening

Security and tenant audits, performance, backups, monitoring, logging, HTTPS, deployment, DR. `DEPLOYMENT.md`.

---

## Near-term sequence (after approval)

```text
Phase 0 (you are here)
  → approve
  → Phase 1 foundation
  → Phase 2 schema + seed
  → Phase 3 design + public site
  → Phase 4 real auth
  → then users, institutions, dashboards, courses...
```

Classroom is **Phase 12**, after users, courses, and scheduling exist.

---

## Open decisions (confirm with approval)

1. **Login:** email-first in v1 (recommended in `SECURITY.md`). Student ID for display and admin search; institution-branded student-ID login later if needed.
2. **One role per institution membership** in v1.
3. **Docs live in `/docs`** (this set). Root `README.md` arrives in Phase 1.
4. **Avatar storage:** local/S3-compatible adapter from Phase 5 rather than postponing all uploads.
5. **Auth library:** Auth.js vs custom sessions — implementer chooses in Phase 4 as long as security requirements are met.
6. **LiveKit hosting:** Cloud vs self-hosted — configuration-only; not a Phase 0 blocker.
7. **Object storage provider:** S3-compatible interface; MinIO or local for dev.

Approve Phase 0 to unlock Phase 1. Do not start coding the app before that approval.
