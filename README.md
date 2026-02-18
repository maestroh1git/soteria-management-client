# School Payroll System — Frontend

Next.js 15 dashboard for the school payroll management system. Provides role-based access to employee management, payroll processing, loans, tax rules, payslips, reports, and system settings.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| State Management | Zustand (persisted auth store) |
| Data Fetching | TanStack React Query |
| Forms | React Hook Form + Zod validation |
| HTTP Client | Axios |
| Notifications | Sonner (toast) |

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local → set NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth route group (no dashboard layout)
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   └── change-password/ # Force password change page
│   ├── (dashboard)/         # Dashboard route group (sidebar layout)
│   │   ├── employees/       # Employee list, detail, create
│   │   ├── departments/     # Department management
│   │   ├── roles/           # Role management
│   │   ├── payroll/         # Payroll processing, salaries
│   │   ├── salary-components/
│   │   ├── loans/           # Loan management
│   │   ├── tax-rules/       # Tax rule configuration
│   │   ├── payslips/        # Payslip management
│   │   ├── reports/         # Financial reports
│   │   └── settings/        # Team management, countries, payroll settings
│   └── layout.tsx           # Root layout (providers)
├── components/
│   ├── layout/              # Sidebar, MobileSidebar, Header
│   ├── ui/                  # shadcn/ui primitives
│   └── common/              # LoadingSkeleton, EmptyState
├── lib/
│   ├── api/                 # API call functions (one per module)
│   ├── hooks/               # React Query hooks (one per module)
│   └── types/               # TypeScript interfaces and enums
├── stores/
│   ├── auth-store.ts        # Authentication state (Zustand + persist)
│   └── ui-store.ts          # UI state (sidebar collapsed, etc.)
└── middleware.ts             # Auth + role-based route guards
```

## Role-Based Access Control

The sidebar and route access are filtered by user roles. The middleware reads a `user-roles` cookie (set at login) and blocks unauthorized route access.

| Route | Allowed Roles |
|-------|---------------|
| `/` (Dashboard) | All authenticated users |
| `/employees` | tenant_owner, ADMIN, PAYROLL_OFFICER, VIEWER |
| `/roles`, `/departments` | tenant_owner, ADMIN |
| `/payroll`, `/loans` | tenant_owner, ADMIN, PAYROLL_OFFICER, FINANCE_ADMIN, APPROVER |
| `/salary-components` | tenant_owner, ADMIN, PAYROLL_OFFICER |
| `/tax-rules` | tenant_owner, ADMIN, FINANCE_ADMIN |
| `/payslips` | tenant_owner, ADMIN, PAYROLL_OFFICER |
| `/reports` | tenant_owner, ADMIN, FINANCE_ADMIN, VIEWER |
| `/settings` | tenant_owner, ADMIN |

## Force Password Change

When an admin creates a user account with a temporary password, the user is flagged with `mustChangePassword: true`. On login:

1. A `must-change-password` cookie is set
2. Middleware redirects all dashboard routes to `/change-password`
3. After successful password change, the cookie is cleared and the user proceeds to the dashboard

## Team Management

Available under **Settings > Team** tab (visible to tenant_owner and ADMIN roles):

- View all user accounts for the tenant
- Create new user accounts linked to employee records
- Assign and edit system roles
- Activate/deactivate user accounts
