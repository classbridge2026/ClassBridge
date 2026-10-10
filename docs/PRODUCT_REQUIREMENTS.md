# ClassBridge — Product Requirements

**Product:** ClassBridge  
**Tagline:** Connect. Learn. Teach.  
**Type:** Multi-institution education SaaS  
**First customer:** Transit College (one tenant among many; never hardcoded in application logic)  
**Status:** Phase 0 — architecture only. Implementation starts after approval.

---

## 1. Product summary

ClassBridge is a digital education platform that connects institutions, administrators, lecturers, and students around courses, scheduled classes, live virtual classrooms, recordings, attendance, materials, and (later) assignments, assessments, messaging, analytics, mobile apps, and subscriptions.

ClassBridge is **not** a standalone video call tool. The virtual classroom is one module inside a complete education system:

```text
Institution → Users → Courses → Enrollment → Classes → Classroom
    → Attendance → Recordings → Materials → Assignments → Assessments
    → Results → Analytics
```

The platform must be sellable or licensable to colleges, universities, training institutions, professional schools, and other educational organizations.

---

## 2. Goals and non-goals

### Goals

- Multi-tenant isolation from day one.
- Real authentication, authorization, and server-side RBAC.
- Real PostgreSQL persistence via Prisma (no fake APIs, no hardcoded business data).
- Incremental delivery by phase, with approval between major phases.
- A professional, academic, trustworthy product experience.
- Mobile-ready API and domain model (React Native later; same backend).

### Non-goals (now)

- Building a custom WebRTC stack (use LiveKit).
- Storing large files or video in PostgreSQL.
- Building Redis, billing, or mobile until there is a real need / later phase.
- Hardcoding Transit College, named people, or courses in application logic.
- Implementing assignments, assessments, private messaging, analytics, or SaaS billing before the core education loop is stable.

---

## 3. Users and roles

ClassBridge has four primary roles. Roles are data-driven. Application code must not special-case an institution name.

| Role | Scope | Purpose |
| --- | --- | --- |
| Super Admin | Platform | Own ClassBridge: institutions, platform users, platform settings, later subscriptions |
| Institution Admin | One institution | Manage that institution’s people, courses, classes, recordings, reports, settings |
| Lecturer | One institution | Teach assigned courses: schedule/start classes, classroom, recordings, attendance, later grading |
| Student | One institution | Learn: enrolled courses, join live classes, published recordings, materials, later submissions and results |

A user may later hold more than one institution membership (for example a lecturer at two schools). Phase 2 models `InstitutionUser` so this is possible. Early product UX may assume one active institution per session.

---

## 4. Permissions (conceptual)

Permissions are checked on the server for every protected operation:

```text
Authenticated? → Correct institution? → Correct role? → Correct permission?
  → Resource belongs to tenant / user? → Allow
```

Hiding a button is not security.

### Super Admin

- Create, view, update institutions
- Activate / deactivate institutions
- View institution administrators
- Manage platform users and suspend accounts
- View platform statistics and activity
- Configure platform settings
- Later: manage subscriptions and licensing

Must **not** be used as a shortcut to bypass tenant rules when acting “as” an institution unless an explicit, audited impersonation/support mode is designed later.

### Institution Admin

- Manage students, lecturers, and institution users
- Manage courses, lecturer assignment, and enrollments
- Manage classes and view attendance
- Manage recordings (within institution policy)
- View reports and send institution notifications
- Manage institution settings

Must **never** read or write another institution’s data.

### Lecturer

- Manage own profile
- View assigned courses and enrolled students in those courses
- Schedule, edit, cancel, start, and end own/assigned classes
- Classroom: camera, mic, screen share, chat, participants, raised hands
- Start / stop recording (never silent recording)
- Review, publish, unpublish recordings they are authorized for
- View attendance for their classes
- Create learning materials
- Later: assignments, assessments, grading

Must **not** start a class they do not teach, publish another lecturer’s recording without authorization, or access other institutions.

### Student

- Manage own profile
- View enrolled courses only
- View upcoming classes and join live classes they are entitled to
- Classroom: camera, mic, watch lecturer/screen, chat, raise hand, leave
- View **published** recordings for enrolled courses
- View learning materials for enrolled courses
- Receive notifications
- Later: submit assignments, take assessments, view own results, messaging

Must **not** start/end classes, start recording, access unpublished recordings, or access another student’s private data.

---

## 5. Functional requirements

### 5.1 Platform and institutions

- Super Admin creates institutions as first-class tenants.
- Each institution has status (e.g. active / inactive). Inactive institutions cannot use the product.
- Institution settings are per-tenant (name, branding later, timezone, policies).
- Transit College is seed/demo data only.

### 5.2 Authentication and profiles

- Login, logout, password hashing, password change, password reset.
- Session management with secure cookies.
- Account activation / deactivation.
- Role and institution resolved from membership, not from the client.
- Protected routes and rate-limited auth endpoints.
- Users manage name, photo, email, optional phone, password, notification preferences.
- Role and institution membership are admin-controlled.

### 5.3 Courses and enrollment

- Courses belong to an institution.
- Courses have information, assigned lecturer(s), modules, materials, classes, recordings, and later assignments/assessments.
- Admins enroll/remove students and assign lecturers.
- Students only see enrolled courses.
- Lecturers see students in assigned courses.

### 5.4 Classes

- Lecturers schedule classes: course, title, description, date, start/end, lecturer.
- Statuses: Scheduled, Live, Completed, Cancelled.
- Starting a class opens the classroom after server-side authorization.
- Ending a class closes the session, finalizes attendance, and stops any active recording workflow.

### 5.5 Virtual classroom

- LiveKit / WebRTC for media: video, audio, screen share, participants.
- ClassBridge owns authz, membership, access tokens, recording permission, attendance, and class state.
- Lecturer can manage participants where permitted, see raised hands, chat, start/stop recording, end class.
- Student can join, use mic/camera as policy allows, chat, raise hand, leave. Student cannot start recording or end class.
- Screen share policy: lecturer by default; student screen share only if later enabled by institution/class policy.

### 5.6 Recordings

- Recording is **optional** and **explicit**. Never silently record.
- Lifecycle: Processing → Ready → Published | Unpublished | Failed | Deleted.
- Metadata in PostgreSQL; media in object storage.
- Students see published recordings only.
- Lecturer reviews before publish.

### 5.7 Attendance

- Based on actual participation (join/leave), not enrollment alone.
- Fields: student, class, join time, leave time, duration, status.
- Statuses: Present, Late, Absent, Left Early.
- Visible to lecturer and institution admin (scoped).

### 5.8 Classroom chat

- Messages tied to class, sender, timestamp.
- Distinct from private messaging.

### 5.9 Notifications

- In-app, read/unread, preference-aware.
- Examples: class starting soon, recording published, enrolled in a course, assignment due (later).

### 5.10 Learning materials

- Course files (PDF, documents, presentations, images, approved types).
- Object storage for bytes; PostgreSQL for metadata and permissions.

### 5.11 Later educational features

- **Assignments:** create, publish, due date, submit, grade, feedback.
- **Assessments:** quizzes/exams, question types, auto/manual grading, attempts, results.
- **Results:** student sees own scores/grades/feedback only.
- **Private messaging:** conversations, participants, attachments; institution rules; not mixed with class chat.
- **Analytics:** activity, attendance, course/class/recording usage, institution and platform stats.

### 5.12 Search

- Always scoped by role, permission, and institution.
- Student: courses, classes, recordings.
- Lecturer: courses, students (assigned), classes, recordings.
- Institution Admin: students, lecturers, courses, classes.
- Super Admin: institutions, users, platform activity.

### 5.13 Audit

- Log important administrative and classroom-control actions.
- Actor, institution (if any), action, resource type/id, timestamp.
- Do not store unnecessary secrets or full payloads of sensitive data.

### 5.14 Public marketing site

- Professional landing page (Platform, For Institutions / Lecturers / Students, Resources, Login, Get Started).
- No fake customer statistics.
- Login and password reset flows.

### 5.15 Mobile (later)

- React Native + Expo + TypeScript.
- Same ClassBridge backend, auth, API, database, LiveKit.

### 5.16 SaaS / subscriptions (later)

- Plans, licensing, billing, usage limits, trials, subscription status.
- Only after the education platform is stable.

---

## 6. Quality, UX, and design requirements

- Every screen answers: Where am I? What can I do? What’s next? What happened?
- Loading states (skeletons/spinners), empty states with next actions, user-friendly errors (no stack traces to users).
- Pagination for large lists.
- Responsive: desktop, laptop, tablet, mobile — designed, not merely shrunk.
- Accessibility: keyboard, focus, labels, contrast, semantic HTML, accessible dialogs/forms.
- Visual identity: professional, modern, academic. Primary `#2563EB`, dark `#0F172A`, background `#F8FAFC`. Inter or Plus Jakarta Sans.
- Must not feel like a school project, generic template, gaming/social app, or Zoom clone.

---

## 7. Success criteria for the first customer

Transit College can operate as a normal institution:

1. Super Admin creates/activates the institution and an institution admin.
2. Institution admin adds lecturers and students.
3. Courses exist; lecturers assigned; students enrolled.
4. Lecturer schedules and starts a class.
5. Enrolled students join the live classroom.
6. Optional recording can be started/stopped, processed, published.
7. Attendance reflects who actually joined.
8. Students rewatch published recordings.

No Transit-specific branches in code.

---

## 8. Traceability

Detailed screen maps: `PRODUCT_MAP.md`  
Technical architecture: `ARCHITECTURE.md`  
Data model: `DATABASE_SCHEMA.md`  
Security: `SECURITY.md`  
Phased delivery: `DEVELOPMENT_ROADMAP.md`
