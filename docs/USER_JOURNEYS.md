# ClassBridge — User Journeys Blueprint

**Product:** ClassBridge  
**Scope:** Core End-to-End Persona Workflows  

---

## 1. Student User Journey

### 1.1 Discovery & Authentication
```text
Public Landing Page → Click "Login" → Login Screen → Enter Email & Password
  → Server verifies credentials & institution membership
  → Redirected to Student Dashboard ((student)/dashboard)
```

### 1.2 Daily Learning & Virtual Classroom Join
```text
Student Dashboard → View "Upcoming Class" widget
  → Class status changes to "LIVE"
  → Click [ Join Class ]
  → System validates active enrollment + session LIVE status
  → Enter Virtual Classroom (/classroom/[classId])
  → Media connects via LiveKit
  → Participate (Watch Lecturer, Mic/Cam toggles, Chat, Raise Hand)
  → Click [ Leave Class ] → Return to Student Dashboard
```

### 1.3 Post-Class Learning & Recording Rewatch
```text
Student Dashboard → Navigate to "Recordings" or "My Courses"
  → Select Course → View Published Recordings
  → Click Recording → Embedded Video Player with timestamp controls
  → Download attached Learning Materials (PDFs, docs)
```

---

## 2. Lecturer User Journey

### 2.1 Course & Class Setup
```text
Lecturer Login → Lecturer Dashboard ((lecturer)/dashboard)
  → View assigned courses under "My Courses"
  → Click [ Schedule Class ] → Modal/Form (Course, Title, Date, Start/End Time)
  → Submit → Class scheduled & notifications queued for enrolled students
```

### 2.2 Conducting a Live Virtual Class
```text
Lecturer Dashboard → View "Today's Classes"
  → Click [ Start Class ]
  → Server authorizes lecturer assignment → ClassSession becomes LIVE
  → Enter Virtual Classroom (/classroom/[classId]) with Lecturer Permissions
  → Enable Camera & Microphone → Share Screen
  → View Participant List & Raised Hands → Interact via Class Chat
  → Click [ Start Recording ] → LiveKit egress records session → UI shows 🔴 Recording
  → Click [ Stop Recording ] → Egress finalizes recording file to Object Storage
  → Click [ End Class ] → Room closes for all students, attendance calculated & saved
```

### 2.3 Recording Management & Attendance Review
```text
Lecturer Workspace → Navigate to "Recordings"
  → View newly generated recording (Status: READY / UNPUBLISHED)
  → Preview video → Click [ Publish Recording ] → Students can now access
  → Navigate to "Attendance" → Review attendance matrix (Present, Late, Absent, Left Early)
```

---

## 3. Institution Admin User Journey

### 3.1 Onboarding Staff & Students
```text
Admin Login → Institution Admin Dashboard ((admin)/dashboard)
  → Navigate to "Students" → Click [ Add Student ] → Input details & generate credentials
  → Navigate to "Lecturers" → Click [ Add Lecturer ] → Input profile & departmental assignment
```

### 3.2 Course Creation & Enrollment
```text
Admin Workspace → Navigate to "Courses" → Click [ Create Course ]
  → Fill course details (Code, Title, Description)
  → Assign Lecturer(s) to Course
  → Click [ Enroll Students ] → Select student roster → Batch enroll
```

### 3.3 Governance & Reporting
```text
Admin Workspace → Navigate to "Attendance Reports"
  → Filter by Course / Class / Date Range → Export or inspect participation trends
  → Navigate to "Institution Settings" → Configure lateness thresholds & recording policies
```

---

## 4. Super Admin User Journey

### 4.1 Tenant Onboarding & Management
```text
Super Admin Login → Super Admin Dashboard ((super-admin)/dashboard)
  → Navigate to "Institutions" → Click [ Add Institution ]
  → Input Tenant Name (e.g., Transit College), Slug, Timezone
  → Create initial Institution Admin account
  → Institution activated → System ready for tenant login
```

### 4.2 Platform Health & Monitoring
```text
Super Admin Workspace → View Platform Stats (Total Tenants, Active Users, Concurrent Live Classes)
  → Navigate to "Audit Logs" → Review system-wide administrative actions
  → Toggle Tenant Status (Activate / Suspend Institution) when required
```
