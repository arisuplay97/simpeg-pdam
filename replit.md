# PDAM Tirta Ardhia Rinjani - Sistem Kepegawaian

## Overview
Web-based HR and operations management system for PDAM Tirta Ardhia Rinjani (regional water utility company). Modern SaaS-style enterprise dashboard with comprehensive employee management, attendance tracking, payroll, finance, and performance evaluation.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: express-session + bcryptjs + connect-pg-simple
- **Charts**: Recharts
- **Routing**: wouter
- **State Management**: TanStack Query v5

## Authentication
- Session-based auth using express-session with PostgreSQL session store
- Passwords hashed with bcryptjs
- Two roles: `admin` (full access) and `pegawai` (employee access)
- All API routes protected with `requireAuth` middleware
- Auth routes: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- Default accounts seeded: admin/admin123, ahmad.suryadi/pegawai123, siti.rahayu/pegawai123, bambang.purnomo/pegawai123
- Company logo: attached_assets/27d50813-7865-448b-a7d3-4c81691cfe9c_1773141880415.jpeg (also at client/public/images/logo.png with transparent bg)

## Key Features
1. **Login Page** - Company branded login with logo, demo account buttons, password visibility toggle
2. **Dashboard** - Statistics cards, attendance charts, salary charts, department distribution, notifications
3. **Employee Management** - Full CRUD, search/filter, employee detail with tabs (attendance, payroll, performance, leave)
4. **Attendance** - Daily tracking, check-in/out, lateness monitoring, trend charts
5. **Leave Management** - Request creation, approval workflow (approve/reject), status tracking
6. **Payroll** - Salary breakdown, distribution charts, period-based listing
7. **Finance** - Cash flow dashboard, income/expense tracking, category charts
8. **Performance** - KPI scoring, progress bars, comparison charts
9. **Mutations** - Transfer, promotion, demotion management
10. **Training** - Training program management with scheduling
11. **Documents** - Digital document management with categories
12. **Reports** - Consolidated reports with charts and statistics
13. **Dark/Light Mode** - Full theme support
14. **Logout** - Session cleanup with redirect to login

## File Structure
```
shared/schema.ts          - Database schemas (Drizzle) and types
server/db.ts              - Database connection
server/auth.ts            - Auth helpers (hash, compare, middleware)
server/storage.ts         - Data access layer (all CRUD operations)
server/routes.ts          - API routes (auth + protected endpoints)
server/seed.ts            - Seed data (15 employees, users, attendance, payroll, etc.)
client/src/App.tsx         - Main app with auth routing
client/src/lib/auth.tsx    - Auth context provider + useAuth hook
client/src/lib/theme-provider.tsx - Dark/light theme
client/src/components/layout/app-layout.tsx - Sidebar + topbar layout
client/src/pages/
  login.tsx                - Login page with company branding
  dashboard.tsx            - Main dashboard
  employees.tsx            - Employee list
  employee-detail.tsx      - Employee detail with tabs
  attendance.tsx           - Attendance management
  leave.tsx                - Leave/permission management
  payroll.tsx              - Payroll/salary
  finance.tsx              - Financial transactions
  performance.tsx          - Performance reviews
  mutations.tsx            - Mutations/promotions
  trainings.tsx            - Training programs
  documents.tsx            - Document management
  reports.tsx              - Reports
```

## Database Tables
departments, positions, employees, attendance, leave_requests, payroll, finance_transactions, performance_reviews, mutations, trainings, documents, notifications, users

## Running
`npm run dev` starts Express backend + Vite frontend on port 5000

## Design
- Font: Inter
- Colors: Blue primary (#0284c7), turquoise accents, clean layout
- Dark mode supported via CSS class toggle
- Mobile responsive sidebar
- Company logo used in sidebar header and login page
