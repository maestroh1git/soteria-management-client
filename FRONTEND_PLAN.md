# Frontend Plan: School Payroll System

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui (Radix + Tailwind CSS)
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Charts**: Recharts
- **HTTP Client**: Axios with interceptors
- **Auth**: JWT stored in httpOnly cookie (via Next.js API route proxy) or secure localStorage with refresh

### Why This Stack
- Next.js gives us SSR for the login/landing pages (SEO) and CSR for the dashboard (speed)
- shadcn/ui is copy-paste components — no vendor lock-in, fully customizable, accessible out of the box
- TanStack Query handles caching, refetching, optimistic updates — critical for a data-heavy app
- Zod schemas can mirror backend DTOs exactly, giving us type-safe forms

---

## Project Structure

```
frontend/
  src/
    app/                          # Next.js App Router
      (auth)/                     # Auth layout (no sidebar)
        login/page.tsx
        register/page.tsx
      (dashboard)/                # Dashboard layout (sidebar + topbar)
        layout.tsx                # Sidebar, topbar, auth check
        page.tsx                  # Dashboard home
        employees/
          page.tsx                # Employee list
          [id]/page.tsx           # Employee detail
          new/page.tsx            # Create employee
        departments/
          page.tsx                # Department list
        roles/
          page.tsx                # Roles & permissions
        payroll/
          page.tsx                # Pay periods list + payroll overview
          [payPeriodId]/page.tsx  # Pay period detail — process, review salaries
          salaries/[id]/page.tsx  # Single salary detail
        loans/
          page.tsx                # Loan list
          [id]/page.tsx           # Loan detail + repayment history
          apply/page.tsx          # Loan application form
        tax/
          page.tsx                # Tax rules list + management
        payslips/
          page.tsx                # Payslip management
        reports/
          page.tsx                # Reports dashboard
        settings/
          page.tsx                # System settings + countries

    components/
      ui/                         # shadcn/ui primitives (button, input, dialog, etc.)
      layout/
        sidebar.tsx               # Navigation sidebar
        topbar.tsx                # Header with user menu, tenant name, notifications
        breadcrumbs.tsx
      employees/
        employee-table.tsx        # Data table with search, filter, pagination
        employee-form.tsx         # Create/edit form
        bank-details-card.tsx     # Bank details section
        salary-components-card.tsx
      payroll/
        pay-period-card.tsx       # Status badge, dates, actions
        salary-table.tsx          # Salary list with bulk actions
        salary-detail-sheet.tsx   # Slide-over with earnings/deductions breakdown
        process-payroll-dialog.tsx
        approve-dialog.tsx
        bulk-payment-dialog.tsx
      loans/
        loan-table.tsx
        loan-form.tsx
        loan-detail-card.tsx
        repayment-timeline.tsx
        advance-form.tsx
      reports/
        monthly-summary-card.tsx
        department-cost-chart.tsx
        tax-summary-chart.tsx
        loan-portfolio-chart.tsx
        export-buttons.tsx
      common/
        data-table.tsx            # Reusable table wrapper (TanStack Table + shadcn)
        stat-card.tsx             # KPI card (number + label + trend)
        status-badge.tsx          # Color-coded badges for statuses
        confirm-dialog.tsx
        empty-state.tsx
        loading-skeleton.tsx
        date-range-picker.tsx
        currency-display.tsx      # Formats numbers as currency (KES 50,000.00)

    lib/
      api/
        client.ts                 # Axios instance with base URL, auth interceptor, error handling
        auth.ts                   # login(), register(), logout(), getCurrentUser()
        employees.ts              # All employee API calls
        departments.ts
        roles.ts
        payroll.ts
        loans.ts
        tax.ts
        payslips.ts
        reports.ts
        settings.ts
        countries.ts
        tenants.ts
      hooks/
        use-auth.ts               # Auth context + hook
        use-employees.ts          # TanStack Query hooks for employees
        use-payroll.ts
        use-loans.ts
        use-reports.ts
        use-debounce.ts
      utils/
        currency.ts               # Format money values
        dates.ts                  # Date formatting helpers
        permissions.ts            # hasRole(), hasPermission() checks
        validation.ts             # Zod schemas matching backend DTOs
      types/
        api.ts                    # Response types matching backend entities
        enums.ts                  # All enums from backend
        auth.ts                   # JWT payload, user types

    stores/
      auth-store.ts               # Zustand: user, token, tenant, roles
      ui-store.ts                 # Zustand: sidebar collapsed, theme, active filters
```

---

## Pages & Features

### 1. Authentication

#### Login Page (`/login`)
- Email + password form
- "Register your school" link
- Error handling (invalid credentials, account locked)
- Redirect to dashboard on success

#### Register Page (`/register`)
- School name, admin name, email, password
- Creates tenant + first admin user
- Auto-login after registration
- Welcome wizard after first login (optional phase 2)

---

### 2. Dashboard Home (`/`)

The landing page after login. At-a-glance overview of the school's payroll status.

**Layout**: 4 stat cards on top, 2 charts below, recent activity feed on the right.

**Stat Cards**:
| Card | Data Source | Description |
|------|-------------|-------------|
| Total Employees | `GET /employees` count | Active employees |
| Current Pay Period | `GET /pay-periods/current` | Name + status badge |
| Monthly Payroll Cost | `GET /reports/monthly-summary` | Total net for current month |
| Active Loans | `GET /reports/loan-portfolio` | Count + outstanding balance |

**Charts**:
- **Payroll Trend** (line chart): Last 6 months gross vs net salary from monthly summaries
- **Department Cost** (bar chart): Current month cost per department

**Quick Actions** (buttons):
- Process Payroll
- Add Employee
- View Reports

---

### 3. Employees (`/employees`)

#### Employee List
- **Table columns**: Employee #, Name, Department, Role, Status, Join Date, Actions
- **Filters**: Status dropdown, Department dropdown, search by name/number
- **Actions**: View, Edit, Deactivate
- **Bulk actions**: None initially (phase 2: bulk import from Excel)

#### Employee Detail (`/employees/[id]`)
Tabbed layout:
- **Overview**: Personal info, role, department, status, join date
- **Salary Components**: Table of assigned components (name, type, calculation, value, effective dates). Add/edit/deactivate buttons.
- **Bank Details**: List of bank accounts with default indicator. Add/edit/remove.
- **Payroll History**: Table of past salaries for this employee (links to salary detail)
- **Loans**: Active and past loans for this employee
- **Payslips**: List of generated payslips with download links

#### Create/Edit Employee (`/employees/new`, `/employees/[id]` edit mode)
- Form sections: Personal Info, Employment Info (role, department, join date), Contact
- Role dropdown populated from `GET /roles`
- Country dropdown from `GET /countries`
- Validation matches backend DTOs

---

### 4. Organization Setup

#### Departments (`/departments`)
- Simple CRUD table
- Columns: Name, Description, Head, Status, Actions
- Inline activate/deactivate toggle
- Modal for create/edit (not a separate page — too simple)

#### Roles & Permissions (`/roles`)
- Roles table with expandable rows showing assigned permissions
- Create role dialog: name, department, role type, salary range, permission checkboxes
- Permission management tab (admin only)

---

### 5. Payroll (`/payroll`)

This is the most complex page. It's the primary workflow.

#### Pay Periods List
- **Table**: Name, Start Date, End Date, Payment Date, Status, Actions
- **Status badges**: OPEN (blue), PROCESSING (yellow), CLOSED (green)
- **Actions per row**:
  - OPEN: "Process Payroll" button
  - PROCESSING/CLOSED: "View Salaries" link
- **Create Pay Period** button opens a dialog

#### Pay Period Detail (`/payroll/[payPeriodId]`)
This is the payroll processing workspace.

**Top section**: Period info card with status, dates, action buttons

**Main section**: Salary table for this period
- **Columns**: Employee #, Name, Gross, Deductions, Net, Status, Actions
- **Status badges**: DRAFT (gray), APPROVED (blue), PAID (green)
- **Row click**: Opens salary detail sheet (slide-over panel)
- **Bulk actions toolbar** (appears when rows selected):
  - Approve Selected
  - Mark Selected as Paid
- **Buttons**:
  - "Process Payroll" (if period is OPEN — calls `POST /payroll/process`)
  - "Approve All" (changes all DRAFT to APPROVED)
  - "Bulk Payment" (dialog to enter payment references)
  - "Generate Payslips" (calls bulk generate)
  - "Email Payslips" (calls bulk send)

**Process Payroll Flow** (dialog):
1. Confirm dialog: "Process payroll for [period name]? This will calculate salaries for all active employees."
2. Option: "Dry run" checkbox
3. Progress indicator while processing
4. Result: "X salaries processed, Y errors" with error details expandable

#### Salary Detail (`/payroll/salaries/[id]`)
Full page or slide-over showing:
- Employee info header
- **Earnings table**: Component name, calculation note, amount
- **Deductions table**: Tax, loans, statutory — component name, amount
- **Summary**: Gross, Total Deductions, Net (large numbers)
- **Actions**: Approve (if DRAFT), Mark as Paid (if APPROVED)
- **Approval info**: Who approved, when, notes
- **Payment info**: Reference number, date

---

### 6. Loans (`/loans`)

#### Loan List
- **Table**: Employee, Type, Amount, Outstanding, Monthly Payment, Status, Applied Date
- **Filters**: Status, Type, Employee search
- **Status badges**: PENDING (gray), APPROVED (blue), ACTIVE (green), FULLY_PAID (dark green), REJECTED (red)

#### Loan Detail (`/loans/[id]`)
- **Loan info card**: Type, amount, interest rate, term, total repayable, outstanding balance, status
- **Progress bar**: Amount repaid vs total
- **Action buttons**: Approve/Reject (if PENDING), Disburse (if APPROVED)
- **Repayment history table**: Date, Amount, Principal, Interest, Balance After, Status
- **Repayment timeline**: Visual timeline of scheduled vs paid repayments

#### Apply for Loan (`/loans/apply`)
- **Form**: Employee dropdown, Loan Type toggle (Standard / Salary Advance)
- Standard Loan fields: Amount, Interest Rate, Term (months), Reason
- Salary Advance fields: Amount, Reason (simplified)
- **Live calculation preview**: Shows monthly repayment and total repayable as user types
- Submit creates loan in PENDING status

---

### 7. Tax (`/tax`)

#### Tax Rules
- **Table**: Name, Type, Rate/Value, Effective From/To, Default, Actions
- **Create/Edit dialog**: Name, Type (Flat Rate / Progressive), Value (for flat rate), Effective dates, Default toggle
- **Progressive tax brackets**: Inline editable table within the form (min amount, max amount, rate, fixed amount) — add/remove rows
- Only ADMIN can modify

---

### 8. Payslips (`/payslips`)

#### Payslip Management
- **Filter by**: Pay Period dropdown, Employee search
- **Table**: Employee, Pay Period, Status, Generated At, Sent At, Actions
- **Actions**: Download PDF, Send Email, View
- **Bulk actions**: Generate All (for a period), Email All
- **Status badges**: GENERATED (gray), SENT (blue), VIEWED (green), FAILED (red)

---

### 9. Reports (`/reports`)

Dashboard-style page with report cards. Each card has a title, preview chart/number, and "View Full Report" / "Export" buttons.

#### Report Cards
1. **Monthly Summary**
   - Date picker (month/year)
   - Stat cards: Total Employees, Gross, Deductions, Net, Tax
   - Employee breakdown table
   - Export: CSV, Excel

2. **Tax Summary**
   - Year picker
   - Bar chart: Monthly tax collected
   - Total annual tax
   - Export: CSV, Excel

3. **Loan Portfolio**
   - Pie chart: Loans by status
   - Bar chart: Loans by type
   - KPI: Active count, Outstanding balance, Total disbursed
   - Export: CSV

4. **Department Cost**
   - Month/Year picker
   - Horizontal bar chart: Cost per department
   - Table: Department, Employees, Gross, Net, Avg Salary
   - Export: CSV, Excel

5. **Year-End Report**
   - Year picker
   - Combined view of all above for the full year
   - 12-month trend line chart
   - Export: Excel (comprehensive workbook)

---

### 10. Settings (`/settings`)

#### System Settings Tab
- Key-value table with inline editing
- Add new setting button
- Data type indicator (string, number, boolean, json)

#### Countries Tab
- Simple CRUD table: Name, Code, Currency Code, Currency Symbol, Active
- Create/edit dialog

---

## Shared Patterns

### Data Table Pattern
Every list page uses the same reusable `<DataTable>` component:
```
- Column definitions (sortable, filterable)
- Server-side pagination (page, limit, totalPages from API)
- Search input with debounce (300ms)
- Filter dropdowns
- Row selection with checkbox column
- Bulk action toolbar
- Loading skeleton
- Empty state
```

### Form Pattern
Every create/edit form uses:
```
- React Hook Form for state management
- Zod schema for validation (mirrors backend DTO)
- shadcn/ui form components (FormField, FormItem, FormLabel, FormMessage)
- Toast notifications on success/error
- Optimistic updates via TanStack Query mutation
```

### Status Badge Pattern
Consistent color coding across all entities:
```
Gray:   DRAFT, PENDING, GENERATED, INACTIVE, SCHEDULED
Blue:   OPEN, APPROVED, SENT, PROCESSING
Green:  ACTIVE, PAID, FULLY_PAID, VIEWED, CLOSED
Red:    REJECTED, FAILED, DEFAULTED, TERMINATED
Yellow: PROCESSING (payroll), PARTIAL
```

### Currency Display
All monetary values displayed as: `KES 50,000.00`
- Currency symbol from tenant/country settings
- Thousands separator
- 2 decimal places
- Negative values in red with parentheses: `(KES 1,000.00)`

### Responsive Design
- Sidebar collapses to icon-only on tablet, hidden on mobile (hamburger menu)
- Tables become card-based on mobile (stacked layout)
- Dialogs become full-screen sheets on mobile
- Minimum supported: 375px width (iPhone SE)

---

## Auth & Permission Handling

### Route Protection
```typescript
// middleware.ts — runs on every request
// Checks for valid JWT, redirects to /login if missing/expired
// Passes user info to layout via headers or cookie
```

### Role-Based UI
Components conditionally render based on user roles:
```typescript
// Example: Only ADMIN and PAYROLL_OFFICER see "Process Payroll" button
{hasRole(['ADMIN', 'PAYROLL_OFFICER']) && (
  <Button onClick={processPayroll}>Process Payroll</Button>
)}
```

### Navigation Visibility
Sidebar items filtered by role:
| Menu Item | Visible To |
|-----------|-----------|
| Dashboard | All |
| Employees | ADMIN, PAYROLL_OFFICER, VIEWER |
| Departments | ADMIN |
| Roles | ADMIN |
| Payroll | ADMIN, PAYROLL_OFFICER, APPROVER, VIEWER |
| Loans | ADMIN, PAYROLL_OFFICER, VIEWER |
| Tax | ADMIN |
| Payslips | ADMIN, PAYROLL_OFFICER |
| Reports | ADMIN, PAYROLL_OFFICER, FINANCE_ADMIN |
| Settings | ADMIN |

---

## API Integration Layer

### Axios Client Setup
```typescript
// lib/api/client.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 (redirect to login), format errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) redirectToLogin();
    throw formatApiError(error);
  }
);
```

### TanStack Query Hooks Pattern
```typescript
// lib/hooks/use-employees.ts
export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeesApi.list(filters),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created');
    },
  });
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Next.js project setup with TypeScript, Tailwind, shadcn/ui
- Auth pages (login, register)
- Dashboard layout (sidebar, topbar)
- API client with interceptors
- Auth store (Zustand)
- Route protection middleware
- Dashboard home page with stat cards (mock data initially)

### Phase 2: Core CRUD (Week 2)
- Employee list, detail, create/edit pages
- Department management (dialog-based)
- Role & permission management
- Salary component setup
- Reusable DataTable component
- Country management in settings

### Phase 3: Payroll Workflow (Week 3)
- Pay period list and create
- Payroll processing flow (process, review, approve, pay)
- Salary detail view with earnings/deductions breakdown
- Bulk payment dialog
- This is the most critical feature — needs extra testing

### Phase 4: Loans & Tax (Week 4)
- Loan list and detail pages
- Loan application form with live calculation
- Loan approval/rejection/disbursement flow
- Repayment history view
- Tax rule management with bracket editor

### Phase 5: Payslips & Reports (Week 5)
- Payslip management page
- PDF generation triggers and download
- Email sending triggers
- Reports dashboard with all 5 report types
- Charts (Recharts)
- CSV/Excel export buttons

### Phase 6: Polish (Week 6)
- Mobile responsive pass
- Loading states and skeletons everywhere
- Error boundaries and fallback UI
- Empty states with helpful CTAs
- Keyboard shortcuts (Cmd+K search, Esc to close dialogs)
- Dark mode toggle
- Performance optimization (lazy loading, code splitting)

---

## Key UX Decisions

1. **Payroll processing is a wizard, not a single button.** The user needs to see what's about to happen, confirm, watch progress, then review results. This is a financial operation — no surprises.

2. **Salary details are a slide-over, not a new page.** Reviewers need to quickly check multiple salaries in sequence without losing context of the list.

3. **Loan applications show live math.** As the user types amount/rate/term, the monthly repayment and total updates in real-time. Reduces errors.

4. **Reports are visual first, table second.** Charts grab attention, tables provide detail. Export buttons are always visible — accountants will use them constantly.

5. **Toast notifications for mutations, not page redirects.** Create employee -> toast "Employee created" + stay on form (create another) or redirect to list. User chooses.

6. **Status transitions are confirmed with dialogs.** "Approve this salary?" with details visible. No accidental approvals.
