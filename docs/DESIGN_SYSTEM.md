# ClassBridge — Design System Specification

**Product:** ClassBridge  
**Scope:** Reusable Visual Tokens, Layout Systems & UI Component Specifications  

---

## 1. Brand Palette & Color Tokens

ClassBridge uses a refined, academic blue color system paired with high-contrast slate neutrals and clear functional semantic colors.

### 1.1 Core Colors
- **Primary Brand:** `#0066FF` / `#2563EB` (Electric Blue) — Used for primary buttons, active nav tabs, key focus rings, and active state highlights.
- **Primary Dark Navy:** `#002B66` / `#0B192C` (Deep Navy) — Logo typography, navigation sidebar background, security widget container background.
- **Light Surface Background:** `#F8FAFC` (Tailwind `slate-50`) — App surface background color for main dashboard and management areas.
- **Card Background:** `#FFFFFF` (White) — Card containers, dropdown menus, table rows, modal content panels with border `border-slate-200/80` and subtle shadow `shadow-sm`.

### 1.2 Semantic Status Colors
- **Success / Live:** `#10B981` (Emerald Green) — Used for `LIVE` class status, `Active` institution badges (`bg-emerald-100 text-emerald-700`), positive growth trend indicators (`↑ 86`).
- **Warning:** `#F59E0B` (Amber) — Used for `Pending` status badges (`bg-amber-100 text-amber-700`), processing recordings.
- **Danger / Destructive:** `#DC2626` (Red) — Used for `CANCELLED` status, `TRASHED` status, stop recording, end class, delete actions.
- **Info / Neutral Badge:** `#94A3B8` / `#64748B` (Slate) — Scheduled status, draft status, meta tags.

---

## 2. Typography Scale

Primary Font Family: `Inter` or `Plus Jakarta Sans` (sans-serif).

| Token | Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- |
| `display` | 36px (2.25rem) | 2.5rem | 700 (Bold) | Landing page hero titles |
| `h1` | 30px (1.875rem) | 2.25rem | 700 (Bold) | Dashboard main titles |
| `h2` | 24px (1.5rem) | 2rem | 600 (SemiBold) | Section headings, modal titles |
| `h3` | 20px (1.25rem) | 1.75rem | 600 (SemiBold) | Card titles, widget headers |
| `body-lg` | 16px (1rem) | 1.5rem | 400 / 500 | Main body paragraphs, table content |
| `body-sm` | 14px (0.875rem) | 1.25rem | 400 / 500 | Form labels, table headers, metadata |
| `caption` | 12px (0.75rem) | 1rem | 500 (Medium) | Badges, timestamps, subtle captions |

---

## 3. Super Admin UI Components Catalog

### 3.1 Sidebar Navigation (`SuperAdminSidebar`)
- **Dark Sidebar Container:** Width 64 (`w-64`), background `#0B192C`, text `#F8FAFC`.
- **Active Navigation Link:** Rounded pill (`rounded-xl`), background `#0066FF`, text `#FFFFFF`, icon with hover scaling.
- **Campus Graphic Banner Widget:** Gradient background (`from-[#0A2540] via-[#0B192C] to-[#0D2A4A]`), SVG campus art overlay, title *"Stronger Institutions, Better Education, A Brighter Future"*, copyright footer `© 2025 CLASSBRIDGE`.

### 3.2 Top Header (`SuperAdminHeader`)
- **Global Search Input:** Rounded pill (`rounded-full`), background `bg-[#F1F6FB]`, search icon placeholder "Search institutions, users, or anything...".
- **Notification Bell Badge:** Bell icon with absolute positioned red badge count (`3`).
- **User Profile Dropdown:** Avatar circle with user initial, full name, role label "Super Admin", chevron indicator.

### 3.3 Institutions Management View (`InstitutionsClientView`)
- **5 Top Stat Cards Grid:**
  - Total Institutions (`#0066FF` blue icon box)
  - Total Students (`#10B981` emerald green icon box)
  - Total Lecturers (`#9333EA` purple icon box)
  - Total Programs (`#F59E0B` amber icon box)
  - Institution Admins (`#14B8A6` teal icon box)
- **Institutions Overview Chart:** Vector SVG line chart with dual series (Total Institutions in blue, Active Institutions in green) with gradient fill under curves.
- **Institutions by Type Donut Chart:** Interactive SVG donut chart with center count (`8 Institutions`) and color-coded type legend (University 25%, College 38%, Technical College 12%, Training Institute 12%, Others 12%).
- **Quick Actions Grid:** Add Institution, Manage Institutions, Manage Admins, View Reports.
- **Institutions List Table:** Data grid with search input, active/inactive/all tab filters, status badges (`Active` green, `Pending` amber), view, edit, trash, and restore modal actions.
- **Empowering Banner:** Gradient banner (`from-[#0B2545] to-[#0066FF]`) with graduation cap icon and call-to-action.
