# Task Execution Checklist — School Payroll Frontend

## Phase 0 — Project Scaffolding & Design System ✅
- [x] Initialize Next.js project (v16.1.6) with TypeScript, Tailwind, ESLint, App Router
- [x] Install core dependencies (TanStack Query, Zustand, Axios, Zod, React Hook Form, Recharts, date-fns, lucide-react)
- [x] Initialize shadcn/ui with 22 base components
- [x] Create `globals.css` with design tokens (colors, typography, light/dark mode)
- [x] Create `lib/types/enums.ts` — all backend enums mirrored
- [x] Create `lib/types/api.ts` — TypeScript interfaces for all entities
- [x] Create `lib/utils/currency.ts` — money formatting helpers
- [x] Create `lib/utils/dates.ts` — date formatting helpers
- [x] Create common UI components: StatusBadge, StatCard, CurrencyDisplay, ConfirmDialog, EmptyState, LoadingSkeleton, DataTable
- [x] Verify: `npm run build` passes clean

## Phase 1 — Auth & App Shell
- [x] Create `lib/api/client.ts` — Axios instance with interceptors
- [x] Create `lib/api/auth.ts` — login, register, getCurrentUser
- [x] Create `stores/auth-store.ts` — Zustand auth store
- [x] Create `lib/hooks/use-auth.ts` — auth hook
- [x] Create `middleware.ts` — route protection
- [x] Create `(auth)/layout.tsx` — centered card layout
- [x] Create `(auth)/login/page.tsx` — login form
- [x] Create `(auth)/register/page.tsx` — registration form
- [x] Create `(dashboard)/layout.tsx` — sidebar + topbar shell
- [x] Create `components/layout/sidebar.tsx` — role-filtered navigation
- [x] Create `components/layout/topbar.tsx` — header with user menu
- [x] Create `stores/ui-store.ts` — sidebar/theme state
- [x] Verify: login/register works, sidebar renders, route protection active

## Phase 2 — Employee Management
- [x] Create `lib/api/employees.ts` — employee CRUD API calls
- [x] Create `lib/api/departments.ts` — department CRUD
- [x] Create `lib/api/roles.ts` — roles + permissions CRUD
- [x] Create `lib/api/salary-components.ts` — salary component CRUD
- [x] Create `lib/hooks/use-employees.ts` — TanStack Query hooks
- [x] Create `lib/utils/validation.ts` — Zod schemas for employee DTOs
- [x] Create `employees/page.tsx` — employee list with DataTable
- [x] Create `employees/[id]/page.tsx` — employee detail (tabbed)
- [x] Create `employees/new/page.tsx` — create employee form
- [x] Create `departments/page.tsx` — department management
- [x] Create `roles/page.tsx` — role & permission management
- [x] Verify: full employee CRUD works, filters/search functional

## Phase 3 — Payroll Processing
- [x] Create `lib/api/payroll.ts` — payroll API calls
- [x] Create `lib/hooks/use-payroll.ts` — TanStack Query hooks
- [x] Create `payroll/page.tsx` — pay period list
- [x] Create `payroll/[payPeriodId]/page.tsx` — payroll workspace
- [x] Create `components/payroll/process-payroll-dialog.tsx` — process wizard
- [x] Create `components/payroll/salary-detail-sheet.tsx` — salary slide-over
- [ ] Verify: full payroll cycle (create → process → approve → pay)

## Phase 4 — Loans & Tax
- [x] Create `lib/api/loans.ts` — loan API calls
- [x] Create `lib/api/tax.ts` — tax rule API calls
- [x] Create `lib/hooks/use-loans.ts` — TanStack Query hooks
- [x] Create `loans/page.tsx` — loan list
- [x] Create `loans/[id]/page.tsx` — loan detail + repayment history
- [x] Create `loans/apply/page.tsx` — loan application with live math
- [x] Create `tax/page.tsx` — tax rule management with bracket editor
- [ ] Verify: loan lifecycle works, tax rules with progressive brackets

## Phase 5 — Payslips & Reports
- [x] Create `lib/api/payslips.ts` — payslip API calls
- [x] Create `lib/api/reports.ts` — report API calls
- [x] Create `lib/hooks/use-reports.ts` — TanStack Query hooks
- [x] Create `payslips/page.tsx` — payslip management
- [x] Create `reports/page.tsx` — reports dashboard with charts
- [ ] Verify: payslip generation/download works, reports render with charts

## Phase 6 — Settings, Polish & Error Handling
- [x] Create `settings/page.tsx` — settings + countries management
- [x] Create `lib/api/settings.ts` + `lib/api/countries.ts`
- [x] Add `error.tsx` boundaries to all route segments
- [x] Add `loading.tsx` skeletons to all route groups
- [x] Responsive pass (mobile tables, sidebar collapse)
- [x] Dark mode toggle
- [x] Keyboard shortcuts (Cmd+K, Esc)
- [x] Performance optimization (lazy loading, code splitting)
- [ ] Final build verification: `npm run build` passes clean
