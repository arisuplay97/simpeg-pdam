# PDAM Tirta Ardhia Rinjani - Sistem Kepegawaian

## Overview
Web-based HR and operations management system for PDAM Tirta Ardhia Rinjani (regional water utility company). Modern SaaS-style enterprise dashboard with comprehensive employee management, attendance tracking, payroll, finance, performance evaluation, rank promotion workflow, and salary increase management.

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
- Three roles: `admin` (full access), `direktur` (Direktur Utama, approval authority), `pegawai` (employee access)
- All API routes protected with `requireAuth` middleware
- `requireDirektur` middleware for approval endpoints (allows admin + direktur)
- Auth routes: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- Default accounts: admin/admin123, direktur/direktur123, doni.alga/pegawai123, siti.rahayu/pegawai123, bambang.purnomo/pegawai123

## Key Features
1. **Login Page** - Droplets icon branding, 3 demo account buttons (Admin/Direktur/Pegawai)
2. **Dashboard** - Statistics cards, attendance charts, salary charts, department distribution, notifications, approval section for Direktur
3. **Employee Management** - Full CRUD, search/filter, employee detail with tabs
4. **Attendance** - Daily tracking, check-in/out, lateness monitoring
5. **Leave Management** - Request creation, approval workflow
6. **Payroll** - Salary breakdown, distribution charts
7. **Finance** - Cash flow dashboard, income/expense tracking
8. **Performance** - KPI scoring, progress bars
9. **Mutations** - Transfer, promotion, demotion management
10. **Kenaikan Pangkat** - 4-year rank promotion cycle with multi-step approval workflow (Diajukan→Review HRD→Review Kabag→Approval Direktur→Berlaku), eligible employee detection
11. **Kenaikan Gaji** - 2-year salary increase cycle with performance-based calculation, approval workflow
12. **Training** - Training program management
13. **Documents** - Digital document management
14. **Reports** - Consolidated reports
15. **Dark/Light Mode** - Full theme support

## File Structure
```
shared/schema.ts          - Database schemas (Drizzle) and types
server/db.ts              - Database connection
server/auth.ts            - Auth helpers (hash, compare, requireAuth, requireDirektur)
server/storage.ts         - Data access layer (all CRUD operations)
server/routes.ts          - API routes (auth + protected endpoints)
server/seed.ts            - Seed data (16 employees incl Direktur, users, attendance, payroll, etc.)
client/src/App.tsx         - Main app with auth routing
client/src/lib/auth.tsx    - Auth context provider + useAuth hook
client/src/lib/theme-provider.tsx - Dark/light theme
client/src/components/layout/app-layout.tsx - Sidebar + topbar layout
client/src/pages/
  login.tsx                - Login page with Droplets icon branding
  dashboard.tsx            - Main dashboard with approval section
  employees.tsx            - Employee list
  employee-detail.tsx      - Employee detail with tabs
  attendance.tsx           - Attendance management
  leave.tsx                - Leave/permission management
  payroll.tsx              - Payroll/salary
  finance.tsx              - Financial transactions
  performance.tsx          - Performance reviews
  mutations.tsx            - Mutations/promotions
  rank-promotions.tsx      - Kenaikan pangkat (4yr cycle, multi-step approval)
  salary-increases.tsx     - Kenaikan gaji (2yr cycle, performance-based)
  trainings.tsx            - Training programs
  documents.tsx            - Document management
  reports.tsx              - Reports
```

## Database Tables
departments, positions, employees, attendance, leave_requests, payroll, finance_transactions, performance_reviews, mutations, trainings, documents, notifications, users, rank_promotions, salary_increases, approval_logs

## New Tables
- **rank_promotions**: Tracks rank promotion requests with multi-step approval (diajukan→review_hrd→review_kabag→approval_direktur→approved)
- **salary_increases**: Tracks salary increase requests with performance scoring
- **approval_logs**: Audit trail for all approval actions

## Employee Fields Added
- lastPromotionDate: Date of last rank promotion
- lastSalaryIncreaseDate: Date of last salary increase
- probationEndDate: End of probation period

## Running
`npm run dev` starts Express backend + Vite frontend on port 5000

## Design
- Font: Inter
- Colors: Blue primary (#0284c7), turquoise accents, clean layout
- Dark mode supported via CSS class toggle
- Mobile responsive sidebar
- Droplets icon used for branding (no logo image)
