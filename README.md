# Exora — Exit Exam Preparation Platform

A full-stack web application that helps Ethiopian university students prepare for national exit exams. Students practice MCQ questions, take mock exams, and unlock department access through a payment system. Admins manage all content, users, and approvals from a dedicated dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Payment Flow](#payment-flow)
- [Notification System](#notification-system)
- [Deployment](#deployment)
- [Database Setup](#database-setup)

---

## Features

### Admin Panel
- Dashboard with live stats (users, courses, questions, pending payments)
- Manage departments, courses (regular / mock / exit types), and questions
- Bulk upload questions via JSON file
- Review and approve / decline student payment receipts
  - **Department-scoped approval** — unlock only the paid department
  - **Full access approval** — unlock all courses across all departments
- Send notifications to individual students or broadcast to all students / admins
- Lock / unlock courses per student or all-at-once
- User management (create, edit, delete, role assignment)
- Real-time notification bell with unread count

### Student Portal
- Browse departments and courses by type (Practice / Mock Exam / Exit Exam)
- **Practice Mode** — instant answer reveal with explanation after every selection
- **Mock Exam Mode** — timed test with section navigation, flag questions, submit for scoring
- **Exit Exam** — department-level exam with course sections, practice or timed test
- Upload payment receipts to request department access
- View payment history with status tracking
- Profile management with academic info
- In-app notifications with real-time unread counter
- Help & support with FAQ and ticket submission
- Offline support with local question caching in practice mode

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + custom JWT |
| Storage | Supabase Storage (payment receipts) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Real-time | Firebase Realtime Database (unread counts) |
| Hosting — Backend | Render |
| Hosting — Frontend | Netlify / Vercel |

---

## Project Structure

```
Exora-app-Admin-Dashboard/
├── backend/                  # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts          # App entry point
│   │   ├── supabase.ts       # Supabase client
│   │   ├── firebase.ts       # Firebase Admin SDK
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.ts       # Login, register, password reset
│   │       ├── users.ts      # User CRUD
│   │       ├── departments.ts
│   │       ├── courses.ts    # Courses + lock/unlock
│   │       ├── questions.ts  # Questions + bulk upload
│   │       ├── payments.ts   # Admin payment approval
│   │       ├── student.ts    # Student-specific endpoints
│   │       ├── notifications.ts
│   │       ├── devices.ts    # FCM device token registration
│   │       ├── stats.ts      # Dashboard statistics
│   │       └── unlock-requests.ts
│   ├── db/migrations/        # SQL migration files
│   └── tsconfig.json
│
└── exora-admin/              # React frontend (admin + student)
    ├── public/
    │   └── firebase-messaging-sw.js   # FCM service worker
    └── src/
        ├── api/axios.js      # Axios instance with auth interceptor
        ├── utils/auth.js     # Session helpers
        ├── components/
        │   ├── Layout.jsx         # Admin layout with notification bell
        │   ├── StudentLayout.jsx  # Student layout
        │   ├── Sidebar.jsx
        │   ├── NotificationBell.jsx
        │   └── PrivateRoute.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx        # Admin dashboard
        │   ├── Users.jsx
        │   ├── Departments.jsx
        │   ├── Courses.jsx
        │   ├── Questions.jsx
        │   ├── Payments.jsx         # Admin payment review
        │   ├── Notifications.jsx    # Shared (admin + student)
        │   ├── StudentDashboard.jsx
        │   ├── StudentDepartments.jsx
        │   ├── StudentDepartmentCourses.jsx
        │   ├── StudentPracticeMode.jsx
        │   ├── StudentMockExam.jsx
        │   ├── StudentExitExam.jsx
        │   ├── StudentPayments.jsx
        │   ├── StudentProfile.jsx
        │   └── StudentHelpSupport.jsx
        ├── firebase-database.js    # Realtime DB listener
        └── firebase-messaging.js  # FCM push registration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Firebase](https://console.firebase.google.com) project (for push notifications)

### 1. Clone the repository

```bash
git clone https://github.com/sam-nexus/Exora-app-Admin-Dashboard.git
cd Exora-app-Admin-Dashboard
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../exora-admin
npm install
```

### 4. Set up environment variables

See [Environment Variables](#environment-variables) below.

### 5. Run locally

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd exora-admin
npm run dev
```

The frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`.

---

## Environment Variables

### Backend — `backend/.env`

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret_min_32_chars

# Email (for password reset codes)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Firebase Admin SDK — use one of:
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=base64_encoded_service_account_json
# or
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# or
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
```

### Frontend — `exora-admin/.env`

```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api

# Firebase Web App config (from Firebase console → Project settings → Your apps)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_FIREBASE_DATABASE_URL=
```

---

## API Overview

**Base URL:** `https://your-backend.onrender.com/api`

All endpoints (except login/register) require:
```
Authorization: Bearer <jwt_token>
```

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login (any role) |
| POST | `/auth/register` | Student self-registration |
| POST | `/auth/mobile/forgot-password` | Send 6-digit reset code |
| POST | `/auth/mobile/verify-reset-code` | Verify the code |
| POST | `/auth/mobile/reset-password` | Reset with verified code |

### Departments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/departments` | List all departments |
| POST | `/departments` | Create (admin) |
| PUT | `/departments/:id` | Update (admin) |
| DELETE | `/departments/:id` | Delete (admin) |

### Courses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/courses?department_id=&type=` | List courses |
| POST | `/courses` | Create (admin) |
| GET | `/courses/user/:userId` | User's courses with lock status |
| POST | `/courses/toggle-all/:userId` | Toggle all locks for a user |
| POST | `/courses/lock-all-users` | Lock all courses for everyone |

### Questions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/questions?course_id=` | List questions |
| POST | `/questions` | Add single question (admin) |
| POST | `/questions/bulk` | Bulk upload via JSON file (admin) |
| PUT | `/questions/:id` | Update (admin) |
| DELETE | `/questions/:id` | Delete (admin) |

### Payments (Admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/payments?status=all` | All receipts |
| PATCH | `/payments/:id/approve` | Approve — body: `{ scope: 'department' \| 'all' }` |
| PATCH | `/payments/:id/decline` | Decline |

### Student Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/student/payments` | Student's payment history |
| GET | `/student/locked-departments` | Departments still locked for student |
| POST | `/student/payments/upload-receipt` | Upload receipt (form-data) |
| POST | `/student/courses/:id/mock-exam/start` | Start mock exam |
| POST | `/student/mock-exam/submit` | Submit mock exam |
| POST | `/student/departments/:id/exit-exam/start` | Start exit exam |
| POST | `/student/exit-exam/submit` | Submit exit exam |
| GET | `/student/profile` | Get extra profile fields |
| GET | `/student/stats` | Study stats |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | Get own notifications |
| POST | `/notifications` | Send notification (admin) |
| POST | `/notifications/mark-all-read` | Mark all as read |
| PATCH | `/notifications/:id/read` | Mark one as read |

---

## Payment Flow

```
Student                         Admin
  │                               │
  ├─ Goes to Payments page        │
  ├─ Selects locked department    │
  ├─ Uploads receipt image/PDF    │
  │   POST /student/payments/     │
  │       upload-receipt          │
  │                               │
  │   ── notification sent ──►   │
  │                               ├─ Reviews receipt on /payments
  │                               ├─ Clicks "Dept" to unlock one dept
  │                               │   or "All" for full access
  │                               │   PATCH /payments/:id/approve
  │                               │   body: { scope: 'department'|'all' }
  │                               │
  │   ◄── notification sent ──   │
  ├─ Courses unlocked             │
  └─ Can now practice / take exams│
```

---

## Notification System

Notifications are stored in Supabase and delivered in two ways:

**In-app** — stored in `notifications` table, fetched on page load. Bell icon shows unread count via Firebase Realtime Database listener (falls back to polling every 5 seconds if Firebase is not configured).

**Push (FCM)** — sent to registered device tokens when:
- Student registers → all admins notified
- Student uploads payment receipt → all admins notified
- Admin approves payment → student notified
- Admin declines payment → student notified
- Student submits unlock request → all admins notified
- Admin approves/rejects unlock → student notified
- Admin manually sends notification

---

## Deployment

### Backend — Render

1. Create a new **Web Service** on Render
2. Connect to this repository
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install && npm run build`
5. Set **Start Command** to `npm start`
6. Set **Branch** to `main` (or your deploy branch)
7. Add all environment variables from the Backend `.env` section above

### Frontend — Netlify

1. Create a new site on Netlify
2. Connect this repository
3. Set **Base directory** to `exora-admin`
4. Set **Build command** to `npm run build`
5. Set **Publish directory** to `exora-admin/dist`
6. Add all `VITE_*` environment variables

---

## Database Setup

Run these SQL statements in your Supabase SQL editor:

```sql
-- Add course type column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS valid_course_type 
  CHECK (type IN ('regular', 'mock', 'exit'));

-- Add department_id to payment receipts
ALTER TABLE payment_receipts 
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Unlock requests table
CREATE TABLE IF NOT EXISTS unlock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support tickets table (optional)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Course Types

| Type | Description | Student Access |
|---|---|---|
| `regular` | Practice questions | Practice Mode |
| `mock` | Timed mock exam | Practice Mode + Test Mode |
| `exit` | Final department exam | Practice Mode + Test Mode |

---

## License

MIT
