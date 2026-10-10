# ClassBridge — Screen Map & Information Architecture

**Product:** ClassBridge  
**Scope:** Complete App Router Screen Hierarchy & UI States  

---

## 1. Application Layout Architecture

```text
src/app/
├── (public)/              # Unauthenticated Public Landing & Marketing
│   ├── page.tsx           # Home Landing Page
│   ├── for-institutions/  # SaaS Marketing Page
│   ├── for-lecturers/     # Product Value Page
│   └── for-students/      # Student Experience Page
│
├── (auth)/                # Authentication Shell
│   ├── login/             # Split-screen Login Page
│   ├── forgot-password/   # Request Password Reset
│   └── reset-password/    # Enter New Password
│
├── (super-admin)/         # Super Admin Platform App
│   ├── dashboard/         # Global Platform Overview
│   ├── institutions/      # Institution Management (List, Add, Edit, Detail)
│   ├── users/             # Platform User Search & Account Suspension
│   ├── activity/          # System Audit Feed
│   └── settings/          # Global Platform Settings
│
├── (admin)/               # Institution Admin App (Tenant Scoped)
│   ├── dashboard/         # Tenant Analytics & Quick Action Metrics
│   ├── students/          # Student Roster, Add/Edit Student, Student Profile
│   ├── lecturers/         # Lecturer Roster, Add/Edit Lecturer, Course Assignments
│   ├── courses/           # Course Catalog, Create/Edit Course, Modules, Materials
│   ├── classes/           # Scheduled Classes Overview & Class Cancellation
│   ├── recordings/        # Tenant Recording Library & Status Oversight
│   ├── attendance/        # Institution Attendance Reports & Matrix
│   ├── notifications/     # Broadcast Notifications
│   └── settings/          # Institution Profile & Policy Config
│
├── (lecturer)/            # Lecturer Workspace App
│   ├── dashboard/         # Teaching Agenda, Quick-Start Class, Schedule Action
│   ├── courses/           # Assigned Courses, Roster Inspection, Material Upload
│   ├── classes/           # Class Schedule, Schedule Class Modal, History
│   ├── recordings/        # Recording Review, Preview, Publish/Unpublish
│   ├── attendance/        # Class Attendance Records & Status Overrides
│   ├── notifications/     # System & Class Notifications
│   └── settings/          # Lecturer Profile & Preferences
│
├── (student)/             # Student Learning Workspace
│   ├── dashboard/         # Upcoming Live Class Banner, Enrolled Courses, Recent Activity
│   ├── courses/           # Enrolled Course List & Course Detail View
│   ├── classes/           # Class Calendar & Upcoming Live Session Links
│   ├── recordings/        # Published Lecture Video Library
│   ├── materials/         # Course Learning Files (PDFs, Slide Decks)
│   ├── notifications/     # Class & Enrollment Alerts
│   └── settings/          # Profile & Password Management
│
└── classroom/             # Synchronous Virtual Classroom (Role-aware)
    └── [classId]/         # LiveKit Video Stage, Controls Bar, Participant & Chat Drawer
```

---

## 2. Screen Specifications & Key UI Components

### 2.1 Public Landing Page (`/`)
- **Navbar:** Brand Logo, Navigation Links, Login CTA Button, Get Started Button.
- **Hero Section:** High-impact typography, compelling tagline, dual CTA, interactive product preview mockup.
- **Features Matrix:** Virtual Classroom, Live Classes, Recording Library, Course Management, Tenant Isolation.
- **How It Works Timeline:** Step-by-step institutional workflow.
- **Role Sections:** Tabs or cards for Institutions, Lecturers, and Students.
- **Footer:** Links, legal placeholders, accessibility badge.

### 2.2 Login Page (`/login`)
- **Split-Screen Design:** Left hero artwork & brand copy; Right structured auth form.
- **Form Controls:** Email / Student ID input, Password input with toggle visibility, "Forgot password?" link, Submit button with spinner loading state.
- **Alert States:** Destructive alert toast for invalid credentials or suspended accounts.

### 2.3 Super Admin Dashboard (`/super-admin/dashboard`)
- **Metric Cards Grid:** Total Institutions, Total Students, Total Lecturers, Active Concurrent Classes, Storage Usage.
- **Tenant Management Table:** Columns: Institution Name, Slug, Status Badge (Active/Inactive), Student Count, Lecturer Count, Created Date, Actions (View, Edit, Toggle Status).
- **Recent System Activity Log:** Stream of critical events with timestamp and actor details.

### 2.4 Institution Admin Dashboard (`/admin/dashboard`)
- **Tenant Stat Cards:** Students Enrolled, Active Lecturers, Published Courses, Scheduled Classes Today.
- **Quick Actions:** [ Add Student ], [ Add Lecturer ], [ Create Course ], [ Schedule Class ].
- **Live Class Overview Widget:** Current active classrooms in the institution with join/monitor action.

### 2.5 Lecturer Dashboard (`/lecturer/dashboard`)
- **Hero Banner:** Personal greeting, date display, next scheduled class highlight.
- **Today's Teaching Schedule:** List of classes for the day with [ Start Class ] primary button (active 15 mins prior).
- **Recent Recordings Widget:** Fast access to review and publish recent class recordings.

### 2.6 Student Dashboard (`/student/dashboard`)
- **Live Class Announcement Banner:** Prominent live banner with countdown and pulsing red `🔴 LIVE NOW` indicator with `[ Join Class ]` CTA.
- **Enrolled Courses Grid:** Progress bar, instructor name, next lesson details, quick link to course modules.
- **Recent Published Lectures:** Video thumbnail cards with duration and course badge.

### 2.7 Virtual Classroom Stage (`/classroom/[classId]`)
- **Top Header:** Class Title, Course Code, Live Indicator, Recording Status (`Recording: OFF` / `🔴 Recording`), Elapsed Timer.
- **Main Media View:** Active speaker video layout / Screen share stage with auto-adjusting participant grid.
- **Right Drawer Panel (Collapsible/Tabbed):**
  - **Tab 1: Participants List:** Lecturer tag, Student list, Raised hand indicator icons, Mute indicators.
  - **Tab 2: Class Chat:** Message feed with timestamp, sender role badge, message input form.
- **Bottom Control Bar:**
  - Mic Toggle (Mute/Unmute)
  - Camera Toggle (On/Off)
  - Screen Share Toggle (Lecturer only by default)
  - Raise Hand Toggle (Student)
  - Chat Toggle
  - **Lecturer Controls:** [ Start/Stop Recording ], [ End Class ] (Destructive action confirmation dialog)
  - **Student Controls:** [ Leave Class ]
