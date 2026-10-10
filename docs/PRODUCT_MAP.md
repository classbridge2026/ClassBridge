# ClassBridge — Product Map

This document maps the product into surfaces, journeys, and modules. It is the UX counterpart to `PRODUCT_REQUIREMENTS.md`.

---

## 1. Product surfaces

```text
ClassBridge
├── Public marketing site
├── Auth (login, forgot/reset password)
├── Super Admin application
├── Institution Admin application
├── Lecturer application
├── Student application
└── Shared classroom (live session UI, role-aware)
```

Later surfaces: React Native apps (same APIs), billing/subscription admin, public help/resources.

Route groups (Next.js App Router, planned):

```text
(public)        landing, marketing
(auth)          login, forgot, reset
(super-admin)   platform administration
(admin)         institution administration
(lecturer)      teaching workspace
(student)       learning workspace
classroom       live session (lecturer vs student capabilities)
api             health, LiveKit tokens, webhooks, mobile-ready endpoints
```

---

## 2. Public marketing site

**Navbar:** ClassBridge · Platform · For Institutions · For Lecturers · For Students · Resources · Login · Get Started

**Hero (example copy, not fake metrics):**  
ONLINE LEARNING, CONNECTED.  
Teach. Learn. Connect. All in one virtual classroom.

**CTAs:** Get Started · Explore Virtual Classroom (product preview, not a live fake class)

**Footer:** product links, legal placeholders, contact.

No fabricated institution counts or testimonials presented as real.

---

## 3. Authentication

### Login (split layout)

- Left: brand + tagline (Connect. Learn. Teach.)
- Right: Welcome back · Email or Student ID · Password · Forgot password · Login
- Errors: invalid credentials, deactivated account, inactive institution, validation

Identifier strategy: email is the universal login. Student ID is an institution-scoped identifier that resolves to a user **within a tenant**. Login must not leak whether an email exists across tenants. See `SECURITY.md`.

### Forgot / reset password

- Request reset (generic success message)
- Tokenized reset form
- Session invalidation after reset (recommended)

### Post-login routing

Resolve memberships → if one role/institution, enter that app → if multiple, choose context → then role home dashboard.

---

## 4. Super Admin application

**Nav:** Dashboard · Institutions · Users · Activity · Subscriptions (later) · Settings · Logout

**Dashboard cards (real data):** Total Institutions · Total Students · Total Lecturers · Total Active Users · Active Classes · Total Recordings

**Institutions:** list (paginated), create, view, edit, activate/deactivate, institution admins, status.

**Users:** platform-level user search, suspend/activate, role/membership inspection.

**Activity:** audit/event feed (paginated, filterable).

**Settings:** platform settings (not tenant branding).

**Subscriptions:** placeholder navigation only until Phase 22; do not fake billing.

---

## 5. Institution Admin application

**Nav:** Dashboard · Students · Lecturers · Courses · Classes · Recordings · Attendance · Reports · Notifications · Settings · Logout

**Dashboard (this institution only):** Students · Lecturers · Courses · Upcoming Classes · Live Classes · Attendance snapshot · Recordings · Recent Activity

**Students / Lecturers:** CRUD-style management, status, pagination, search.

**Courses:** create/edit, assign lecturers, enroll students, modules, materials.

**Classes:** schedule overview, live/upcoming/completed, cancel.

**Recordings / Attendance / Reports:** institution-scoped lists and summaries.

**Notifications:** send/view institution notifications.

**Settings:** institution profile, timezone, policies (recording, lateness window, etc.).

---

## 6. Lecturer application

**Nav:** Dashboard · My Courses · Classes · Recordings · Attendance · Messages (later) · Notifications · Settings · Logout

**Dashboard:** greeting · today’s classes · Start Class (when allowed) · Schedule Class

**My Courses:** assigned courses, enrolled students, modules/materials.

**Classes:** schedule, edit, cancel, start, classroom link when live.

**Recordings:** preview, publish/unpublish, delete if authorized.

**Attendance:** per class / per course views.

**Classroom (lecturer):** title, live status, lecturer video, participants, chat, mic/camera/screen share, raised hands, start/stop recording, end class.

---

## 7. Student application

**Nav:** Dashboard · My Courses · Live Classes · Recordings · Assignments (later) · Results (later) · Messages (later) · Notifications · Settings · Logout

**Dashboard:** greeting · next upcoming class with Join when live/eligible · courses · recent published recordings · notifications · progress (when modules exist)

**My Courses:** enrolled only · modules · materials · classes · recordings.

**Live Classes:** joinable sessions for enrolled courses.

**Recordings:** published only.

**Classroom (student):** title, live indicator, lecturer video, participants (if permitted), chat, mic/camera, raise hand, leave. No start recording / end class.

---

## 8. Core user journeys

### 8.1 First institution onboarding

```text
Super Admin creates institution
  → assigns Institution Admin
  → Institution Admin adds lecturers and students
  → creates course, assigns lecturer, enrolls students
  → Lecturer schedules class
```

### 8.2 Live class (happy path)

```text
Lecturer: Schedule → Upcoming → Start Class
  → server authorizes → session Live → LiveKit room
Students: Join (enrollment + live session checks) → classroom
  → teach (optional explicit recording)
Lecturer: End Class → attendance finalized
  → recording processed (if any) → review → publish
Students: rewatch published recording
```

### 8.3 Student learning loop

```text
Login → institution + student role
  → dashboard → enrolled course → materials / upcoming class
  → join live or watch published recording
  → later: assignment/assessment → own results
```

### 8.4 Forbidden paths (must fail server-side)

- Student starts a class or recording
- Student reads unpublished recording or another student’s data
- Institution Admin reads another institution
- Lecturer starts a class they do not teach
- Inactive user or inactive institution uses the product

---

## 9. Module map vs phases

| Module | Primary owners | First delivery phase |
| --- | --- | --- |
| Public site + design system | All (unauthenticated) | 3 |
| Auth / sessions / RBAC foundation | All | 4 |
| Profiles / user admin | All roles | 5 |
| Institutions / tenancy | Super Admin | 6 |
| Admin dashboards | Super / Institution Admin | 7 |
| Courses / modules / enrollments | Admin, Lecturer, Student | 8 |
| Student app shell | Student | 9 |
| Lecturer app shell | Lecturer | 10 |
| Class scheduling | Lecturer, Admin | 11 |
| Virtual classroom | Lecturer, Student | 12 |
| Recordings + object storage | Lecturer, Student, Admin | 13 |
| Attendance | Lecturer, Admin | 14 |
| Notifications | All | 15 |
| Learning materials | Lecturer, Student | 16 |
| Assignments | Lecturer, Student | 17 |
| Assessments / results | Lecturer, Student | 18 |
| Private messaging | Lecturer, Student (policy) | 19 |
| Analytics | Admin, Super Admin | 20 |
| Mobile | Same roles | 21 |
| Subscriptions | Super Admin, Institution | 22 |
| Production hardening | Platform | 23 |

Classroom chat ships with Phase 12 (tied to the live session), not with private messaging.

---

## 10. Information architecture rules

- One visual design system; four role shells that share components, not copy-pasted apps.
- Tenant context is always in the session, never chosen by forging an `institutionId` in the client.
- Empty and loading states are first-class screens.
- Search and lists are paginated and permission-filtered.
- “Messages” in student/lecturer nav remains hidden or disabled until Phase 19 so we do not ship dead buttons.
