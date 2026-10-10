# ClassBridge — Product UX Strategy & Principles

**Product:** ClassBridge  
**Tagline:** Connect. Learn. Teach.  
**Scope:** Phase 0 UI/UX Experience Blueprint  

---

## 1. User Experience Philosophy

ClassBridge is a commercial EdTech SaaS platform designed to feel modern, academic, trustworthy, and sleek. It balances educational clarity with state-of-the-art SaaS application standards.

Every screen in ClassBridge must adhere to the 4 UX Golden Questions:
1. **Where am I?** Clear page titles, breadcrumbs, and active navigation indicators.
2. **What can I do?** Primary and secondary call-to-actions clearly prioritized visually.
3. **What happened?** Clear, immediate feedback via toasts, dynamic status updates, and contextual state indicators.
4. **What should I do next?** Logical next steps, clear empty states with actionable prompts, and guided workflows.

---

## 2. Core UX Pillars

### 2.1 Role-Tailored Interfaces
ClassBridge serves four distinct user personas. Each role gets a dedicated visual layout and information density optimized for their tasks:
- **Super Admin:** High-level platform metrics, tenant management, activity auditing, system configuration.
- **Institution Admin:** Multi-department governance, enrollment matrices, course allocation, staff overview, attendance reports.
- **Lecturer:** Focus on teaching velocity — quick-start classes, course content authoring, participant monitoring, recording publishing.
- **Student:** Focus on learning retention — upcoming class reminders, progress tracking, seamless virtual classroom joining, rewatching published lectures.

### 2.2 Contextual & Purposeful Hierarchy
- Primary actions (`#2563EB` solid buttons) are reserved for key workflows (e.g., *Start Class*, *Schedule Class*, *Enroll Student*, *Publish Recording*).
- Secondary actions use outline or subtle ghost styles.
- Destructive actions (*Delete Course*, *Deactivate User*, *Unpublish*) use distinct warning/danger visual treatments with confirmation dialogs.

### 2.3 Resilient Feedback & State Design
Every asynchronous interaction must explicitly handle all 4 UX states:
1. **Default/Populated State:** Crisp table/card/list layout with paginated controls.
2. **Loading State:** Skeleton loaders matching exact component shapes to prevent layout shifts.
3. **Empty State:** Custom illustrations or clean icon callouts with helpful descriptions and actionable buttons (e.g., "No upcoming classes scheduled. [ Schedule a Class ]").
4. **Error State:** Friendly, non-technical error messages with retry options (no raw stack traces exposed to users).

---

## 3. Responsive Strategy

ClassBridge is built to be responsive across 4 breakpoint tiers:
- **Desktop (1920px+):** Full multi-column layout with expanded persistent sidebar, detailed data tables, and side-by-side video grid + drawer panels.
- **Laptop (1366px - 1440px):** Standard 12-column layout with collapsible sidebar.
- **Tablet (768px - 1024px):** Adaptive grid layout, off-canvas navigation drawer, stacked tables/cards.
- **Mobile (375px - 767px):** Mobile-first bottom navigation or hamburger menu, touch-friendly touch targets (min 44px), single-column card feeds instead of dense tables.

---

## 4. Accessibility & Inclusive Design (WCAG 2.1 AA)

- **Keyboard Navigation:** Full tab order, logical focus trap inside dialogs, visual ring indicators (`ring-2 ring-blue-500`).
- **Color Contrast:** Minimum 4.5:1 text-to-background contrast ratio for standard text and 3:1 for large display headers.
- **Screen Reader Support:** Semantic HTML5 tags (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`), appropriate `aria-live` regions for classroom status changes, screen-reader labels on icon-only buttons.
- **Motion & Reduced Motion:** Respect `prefers-reduced-motion` for dynamic UI transitions.
