# PDAM Tirta Ardhia Rinjani - Sistem Kepegawaian

## Overview
Web-based HR and operations management system for PDAM Tirta Ardhia Rinjani (regional water utility company). Modern SaaS-style enterprise dashboard with comprehensive employee management, attendance tracking, payroll, finance, and performance evaluation.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Charts**: Recharts
- **Routing**: wouter
- **State Management**: TanStack Query v5

## Key Features
1. **Dashboard** - Statistics cards, attendance charts, salary charts, department distribution, notifications
2. **Employee Management** - Full CRUD, search/filter, employee detail with tabs (attendance, payroll, performance, leave)
3. **Attendance** - Daily tracking, check-in/out, lateness monitoring, trend charts
4. **Leave Management** - Request creation, approval workflow (approve/reject), status tracking
5. **Payroll** - Salary breakdown, distribution charts, period-based listing
6. **Finance** - Cash flow dashboard, income/expense tracking, category charts
7. **Performance** - KPI scoring, progress bars, comparison charts
8. **Mutations** - Transfer, promotion, demotion management
9. **Training** - Training program management with scheduling
10. **Documents** - Digital document management with categories
11. **Reports** - Consolidated reports with charts and statistics
12. **Dark/Light Mode** - Full theme support

## File Structure
```
shared/schema.ts          - Database schemas (Drizzle) and types
server/db.ts              - Database connection
server/storage.ts         - Data access layer (all CRUD operations)
server/routes.ts          - API routes
server/seed.ts            - Seed data (15 employees, attendance, payroll, etc.)
client/src/App.tsx         - Main app with routing
client/src/lib/theme-provider.tsx - Dark/light theme
client/src/components/layout/app-layout.tsx - Sidebar + topbar layout
client/src/pages/
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
