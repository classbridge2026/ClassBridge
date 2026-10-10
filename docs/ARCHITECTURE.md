# ClassBridge — Architecture

**Application model:** one full-stack Next.js (App Router) + TypeScript app.  
**No separate NestJS (or other) backend.** Mobile apps later consume the same server.

---

## 1. Target architecture

```text
                       CLASSBRIDGE
                            │
                            ▼
                 Next.js + TypeScript
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Client/UI                     Server Side
             │                             │
       React Components             Server Components
       Tailwind CSS                 Server Actions
       shadcn/ui                    Route Handlers
       Classroom UI                 Domain services
             │                             │
             └──────────────┬──────────────┘
                            │
                          Prisma (server only)
                            │
                            ▼
                       PostgreSQL
                            │
             ┌──────────────┼──────────────┐
             │              │              │
        Application       Files         Live classes
           data         Object storage      │
                                         LiveKit
```

Later, when justified: Redis, email provider, push, payments, React Native.

---

## 2. Technology choices

| Concern | Choice | Notes |
| --- | --- | --- |
| App | Next.js App Router | Frontend + server |
| Language | TypeScript | Strict |
| DB | PostgreSQL | Source of truth |
| ORM | Prisma | Schema, migrations, seed, typed queries |
| UI | Tailwind + shadcn/ui + Lucide | Consistent academic look |
| Forms / validation | React Hook Form + Zod | Zod on server too |
| Client sync | TanStack Query | Only where it helps (classroom-adjacent, polling) |
| Realtime media | LiveKit | Do not build WebRTC infra |
| Files / video | S3-compatible object storage | Metadata in Postgres |
| Auth | Server sessions (HTTP-only cookies) | See below |
| Cache / jobs | Redis | **Not** in Phase 1; add when rate-limit/jobs/presence need it |

Do not install libraries without a phase need.

---

## 3. Project structure (planned)

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (student)/
│   ├── (lecturer)/
│   ├── (admin)/
│   ├── (super-admin)/
│   └── api/v1/
├── components/     ui, layout, shared
├── features/       auth, institutions, users, courses, classes, classroom, ...
├── lib/            db, auth, permissions, validations, utils
├── services/       server domain logic (no Prisma in client)
├── hooks/
├── types/
└── config/
prisma/
├── schema.prisma
└── seed.ts
docs/               this architecture set
```

The Next.js application root is `frontend/`. Repository documentation stays in `/docs`.

Adjustments are allowed if they preserve: feature isolation, server-only data access, and role route groups.

---

## 4. Server vs client

**Server Components:** secure data fetch, dashboards, lists, course pages.

**Server Actions:** mutations (enroll, schedule class, publish recording) with Zod + authz.

**Route Handlers (`/api/v1/...`):** health; LiveKit token issuance; storage/LiveKit webhooks; anything mobile or external must call.

**Client Components:** classroom, media controls, chat UI, interactive forms, browser APIs.

```text
Browser → Next.js server → Prisma → PostgreSQL
```

Never: browser → Prisma/PostgreSQL. Never expose `DATABASE_URL`, `AUTH_SECRET`, `LIVEKIT_API_SECRET`, or storage secrets via `NEXT_PUBLIC_*`.

---

## 5. Multi-tenancy

**Model:** shared database, shared schema, **mandatory `institutionId`** on every institution-scoped table.

**Enforcement:** every query and mutation for tenant data includes institution from the **session membership**, not from an untrusted client field.

**Isolation tests** (required): Institution A cannot read Institution B; Student A cannot read Student B’s private data.

Platform tables (e.g. `Institution`, `PlatformSetting`, Super Admin users) are not tenant rows. Audit logs may have nullable `institutionId` for platform actions.

No:

```typescript
if (institution === "Transit College") { ... }
```

---

## 6. Authentication architecture

**Recommended Phase 4 approach:** Auth.js (Auth.js / NextAuth) **or** a small custom session stack using:

- Argon2 or bcrypt password hashing
- Server-issued session (database or signed HTTP-only cookie)
- CSRF protections aligned with Next.js / same-site cookies
- Rate limiting on login and reset (in-memory first; Redis later if multi-instance)

**Session contents (conceptual):** `userId`, active `institutionId` (if any), `role`, `membershipId`. Super Admin may have null institution.

**Password reset:** single-use, time-limited tokens stored hashed.

**Email:** verification/reset email can start as a pluggable provider; local/dev may log links. Do not block Phase 4 on a paid email vendor.

**Account / institution status:** deactivated user or institution → authentication or session rejected.

---

## 7. Authorization architecture

Central helpers, used by Server Actions, Route Handlers, and layout guards:

```text
requireSession()
requireRole(...)
requirePermission(...)
requireInstitutionScope(resource)
requireCourseAccess(...)
requireClassAccess(...)
```

Layouts hide the wrong app; **services** enforce rules. Feature flags in UI never replace these checks.

RBAC tables (`Role`, `Permission`, mappings) can start as a fixed enum of roles plus a permission catalog in code, then move to DB-driven permissions without changing call sites. Phase 2 should still create `Role` / `InstitutionUser` so we do not paint into a corner.

---

## 8. Course architecture

```text
Institution
  └── Course
        ├── CourseLecturer (assignment)
        ├── CourseEnrollment (students)
        ├── CourseModule
        ├── LearningMaterial
        ├── Class
        └── Recording
```

Progress (e.g. “82%”) is derived from module/class/assignment completion when those exist — never hardcoded.

Enrollment is the gate for student course visibility and (with class state) classroom join.

---

## 9. Class architecture

A **Class** is a scheduled event on a course.

A **ClassSession** is the live (or completed) runtime: when it went live, ended, LiveKit room name, recording flags.

Statuses: `SCHEDULED` | `LIVE` | `COMPLETED` | `CANCELLED`.

**Start class:** lecturer authorized → session `LIVE` → create/ensure LiveKit room → issue lecturer token.

**Join class:** student enrolled in course → class `LIVE` → issue student token → attendance join recorded.

**End class:** lecturer/admin policy → room close → attendance leave/finalize → recording stop if active.

---

## 10. Virtual classroom architecture

```text
Lecturer Start Class
  → Next.js authorization (teaches class, institution active)
  → ClassSession LIVE
  → LiveKit room
  → client connects with short-lived JWT from our API

Student Join
  → enrollment + LIVE session
  → short-lived student JWT
  → LiveKit media
```

ClassBridge owns: who may connect, role in room (lecturer vs student), whether recording may start, chat persistence (our DB or LiveKit data messages + persist), raise-hand state (LiveKit data or our channel), attendance.

LiveKit owns: media routing, SFU, optional egress for recording.

Classroom UI is a Client Component; tokens come from a Route Handler after authz.

---

## 11. Recording architecture

```text
Lecturer explicit Start Recording
  → authorized? class LIVE?
  → LiveKit egress → object storage
  → Recording row: PROCESSING
  → webhook/job → READY (or FAILED)
  → lecturer review → PUBLISHED or remain UNPUBLISHED
  → students list only PUBLISHED + enrolled
```

Never auto-start recording on class start.

PostgreSQL stores: id, classId, institutionId, title, duration, storageKey, status, published flag/timestamps, createdBy.

---

## 12. Attendance architecture

On join: upsert participant, set `joinedAt`.  
On leave or class end: `leftAt`, duration.  
Status rules (institution settings): e.g. join after start+N minutes = Late; never joined = Absent; left before end-N = Left Early.

Enrollment without a join is **not** Present.

---

## 13. Notifications architecture

`Notification` rows: userId, institutionId, type, title, body, resource refs, readAt.

Writers: domain services (enroll, class scheduled, recording published, reminders).

Readers: in-app list/bell. Email/push later.

Reminders (“class in 10 minutes”) need a scheduler. **Do not add Redis/workers in foundation.** Phase 15 may use a lightweight cron or queue; Redis only if multi-instance requires it.

---

## 14. File storage architecture

S3-compatible (AWS S3, Cloudflare R2, Supabase Storage, MinIO for local).

```text
Client → Server (authz + file validation + size/type limits)
  → presigned upload or server upload
  → object key
  → metadata row (LearningMaterial, ProfilePhoto, Recording)
```

Local/dev: MinIO or filesystem adapter behind the same interface so production can switch providers via env.

---

## 15. Future assignments and assessments

Designed as course-child aggregates with attempts/submissions scoped by `institutionId` + enrollment. Grading services never leak other students’ attempts. Schema is specified in `DATABASE_SCHEMA.md` but **not migrated until those phases**.

---

## 16. Messaging architecture (later)

Private `Conversation` / `Message` with participant membership and institution rules. Separate from `ClassChatMessage`. Classroom chat is ephemeral-to-session with persistence for the class record if we store it.

---

## 17. Analytics architecture (later)

Prefer aggregated queries and optional daily rollup tables. Do not run unbounded table scans on the Super Admin dashboard. Dashboards in earlier phases use simple `COUNT`/`GROUP BY` with indexes.

---

## 18. Mobile architecture (later)

Expo app authenticates against the same session or token API (likely adding a documented token strategy in Phase 21 if cookies are web-only). Domain services stay shared. LiveKit has mobile SDKs; ClassBridge still mints tokens.

---

## 19. SaaS architecture (later)

`Subscription` per institution: plan, status, seats/limits, period. Enforcement: middleware/service checks before creating users/courses/live minutes. Billing provider (e.g. Stripe) is an adapter, not the source of tenant identity.

---

## 20. Deployment architecture

**Target (production):** container or Node host for Next.js; managed PostgreSQL; object storage; LiveKit Cloud or self-hosted LiveKit; env-based secrets; HTTPS; backups; error monitoring.

**Development:** `npm run dev`, local or Docker PostgreSQL, `.env` from `.env.example`.

**Phase 23:** security audit, tenant isolation audit, backups, monitoring, logging, DR notes (`DEPLOYMENT.md` then).

---

## 21. Environment (planned `.env.example`)

```env
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000

LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
```

Only public values use `NEXT_PUBLIC_`. Real `.env` is never committed.

---

## 22. Error handling and observability

- User: friendly messages (“We couldn’t load your courses. Please try again.”)
- Server logs: technical detail, no secrets
- Consistent error types from services to UI
- Health: `GET /api/v1/health`

---

## 23. Testing architecture

- Unit: permissions, attendance status rules, validators
- Integration: Prisma + authz + tenant isolation
- E2E: login, role routing, enroll, schedule, join permission, recording visibility

See `SECURITY.md` for isolation tests and `DEVELOPMENT_ROADMAP.md` for when they land.

---

## 24. Documentation set

| File | Purpose |
| --- | --- |
| `docs/PRODUCT_REQUIREMENTS.md` | What we build |
| `docs/PRODUCT_MAP.md` | Screens and journeys |
| `docs/ARCHITECTURE.md` | This file |
| `docs/DATABASE_SCHEMA.md` | Data model |
| `docs/SECURITY.md` | Threats and controls |
| `docs/DEVELOPMENT_ROADMAP.md` | Phased delivery |

Later: `README.md`, `DEPLOYMENT.md`. Docs evolve with the code.
