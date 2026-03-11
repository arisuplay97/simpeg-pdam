# PDAM Tirta Ardhia Rinjani - Sistem Kepegawaian

## Overview
Web-based HR and operations management system for PDAM Tirta Ardhia Rinjani (regional water utility company). Modern SaaS-style enterprise dashboard with comprehensive employee management, attendance tracking, payroll with detailed deduction breakdown, Excel export, performance evaluation, rank promotion workflow, and salary increase management.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: express-session + bcryptjs + connect-pg-simple
- **Charts**: Recharts
- **Routing**: wouter
- **State Management**: TanStack Query v5
- **Excel**: xlsx (SheetJS) for Excel export

## Authentication
- Session-based auth using express-session with PostgreSQL session store
- Passwords hashed with bcryptjs
- Three roles: `admin` (full access), `direktur` (Direktur Utama, approval authority), `pegawai` (employee access)
- All API routes protected with `requireAuth` middleware
- `requireDirektur` middleware for approval endpoints (allows admin + direktur)
- Auth routes: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- Default accounts: admin/admin123, direktur/direktur123, doni.alga/pegawai123, siti.rahayu/pegawai123, bambang.purnomo/pegawai123

## Key Features
1. **Login Page** - Company logo image, 3 demo account buttons (Admin/Direktur/Pegawai), 350+ Pegawai stat
2. **Dashboard** - Statistics cards, attendance charts, salary charts, department distribution, notifications, approval section for Direktur
3. **Employee Management** - Full CRUD, search/filter, employee detail with tabs
4. **Attendance** - Daily tracking, check-in/out, lateness monitoring
5. **Leave Management** - Request creation, approval workflow
6. **Payroll** - Expandable salary breakdown with detailed deduction items, custom deduction support, Excel export with filters (period/dept/status), distribution charts
7. **Performance** - KPI scoring, progress bars
8. **Mutations** - Transfer, promotion, demotion management
9. **Kenaikan Pangkat** - 4-year rank promotion cycle with multi-step approval workflow
10. **Kenaikan Gaji** - 2-year salary increase cycle with performance-based calculation, approval workflow
11. **Training** - Training program management
12. **Documents** - Digital document management
13. **Reports** - Consolidated reports
14. **Dark/Light Mode** - Full theme support

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
  login.tsx                - Login page with company logo
  dashboard.tsx            - Main dashboard with approval section
  employees.tsx            - Employee list
  employee-detail.tsx      - Employee detail with tabs
  attendance.tsx           - Attendance management
  leave.tsx                - Leave/permission management
  payroll.tsx              - Payroll with expandable deduction breakdown + Excel export
  performance.tsx          - Performance reviews
  mutations.tsx            - Mutations/promotions
  rank-promotions.tsx      - Kenaikan pangkat (4yr cycle, multi-step approval)
  salary-increases.tsx     - Kenaikan gaji (2yr cycle, performance-based)
  trainings.tsx            - Training programs
  documents.tsx            - Document management
  reports.tsx              - Reports
```

## Database Tables
departments, positions, employees, attendance, leave_requests, payroll, payroll_deductions, performance_reviews, mutations, trainings, documents, notifications, users, rank_promotions, salary_increases, payslip_logs, approval_logs, export_logs

## Payroll Deduction System
- **payroll** table has individual deduction columns: bpjs_kesehatan_deduction (1%), bpjs_ketenagakerjaan_deduction (2%), pph21_deduction, pension_deduction (1%), loan_deduction, cooperative_deduction, discipline_deduction
- **payroll_deductions** table stores individual deduction line items per payroll record with type, label, amount, description
- Types: bpjs_kesehatan, bpjs_ketenagakerjaan, pph21, iuran_pensiun, pinjaman, koperasi, disiplin, custom
- Admin/HRD can add custom deductions per employee per period
- API: GET /api/payroll/:id/deductions, POST /api/payroll/:id/deductions, DELETE /api/payroll-deductions/:id

## Payroll Excel Export
- ExportExcelDialog in payroll.tsx with period/department/status filters
- Uses xlsx (SheetJS) library for client-side Excel generation
- Formatted output: title header, color-coded columns (green=earnings, red=deductions, yellow=net salary), totals row
- Only accessible by admin and direktur roles (requireDirektur middleware)
- All exports logged in export_logs table via POST /api/export-logs

## Slip Gaji (Payslip) Feature
- **PayslipModal** component (`client/src/components/payslip-modal.tsx`) renders via React Portal on document.body
- A5 landscape format with PDAM branding, RAHASIA watermark, slip code, Direktur signature
- 3 action buttons: Cetak (window.print in new window), Download PDF (jsPDF, dynamic import), Kirim Email (simulated)
- **payslip_logs** table tracks all print/download/email actions with payrollId, employeeId, action, performedBy, ipAddress
- Backend: POST /api/payroll/:id/log-action (owner or admin/direktur access)
- Escape key closes modal
- jsPDF dynamically imported to avoid bundle bloat

## Rank Promotion & Salary Increase
- **rank_promotions**: Multi-step approval (diajukan→review_hrd→review_kabag→approval_direktur→approved)
- **salary_increases**: Performance-based salary increase with approval workflow
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
- Company logo used for branding (Logo_Tirta_1773201248263.png with transparent background)
