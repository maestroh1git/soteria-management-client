# Audit Logging Plan: School Payroll System Backend

## Why Audit Logging

This is a financial system. Schools need to answer questions like:
- Who approved that salary?
- Who changed the tax rate and when?
- Why did this employee's deductions change last month?
- Who disbursed this loan?

Without audit logs, there's no accountability. Auditors, school boards, and regulators will ask for this.

---

## Design: What Gets Logged

### Tier 1: Always Log (Financial Operations)
These are non-negotiable. Every one creates an audit record.

| Action | Entity | Details Captured |
|--------|--------|-----------------|
| Salary calculated | Salary | employeeId, gross, deductions, net, all detail line items |
| Salary approved | Salary | salaryId, approverId, previous status, notes |
| Salary paid | Salary | salaryId, paymentReference, previous status |
| Bulk payment | Salary[] | All salary IDs, success/fail per item |
| Payroll processed | PayPeriod | payPeriodId, employee count, error count |
| Loan applied | Loan | employeeId, amount, type, term |
| Loan approved | Loan | loanId, approverId, notes |
| Loan rejected | Loan | loanId, reason, notes |
| Loan disbursed | Loan | loanId, amount, disbursement date |
| Loan repayment | LoanRepayment | loanId, salaryId, amount, balance after |
| Tax rule created | TaxRule | all fields |
| Tax rule updated | TaxRule | old values, new values (diff) |
| Tax rule deleted | TaxRule | rule snapshot before deletion |
| Payslip generated | Payslip | salaryId, employeeId, fileName |
| Payslip emailed | Payslip | payslipId, recipient email, success/fail |

### Tier 2: Log on Change (Configuration & Employee Data)
These are logged when data is modified, not on reads.

| Action | Entity | Details Captured |
|--------|--------|-----------------|
| Employee created | Employee | all fields |
| Employee updated | Employee | changed fields only (old + new values) |
| Employee terminated | Employee | employeeId, terminationDate, reason |
| Bank details added | BankDetails | employeeId, bank, account (masked) |
| Bank details updated | BankDetails | changed fields |
| Salary component assigned | EmployeeSalaryComponent | employeeId, componentId, value |
| Salary component changed | EmployeeSalaryComponent | old value, new value, effective dates |
| Role created/updated | Role | all fields or diff |
| Department created/updated | Department | all fields or diff |
| Permission assigned to role | Role | roleId, permissionIds added/removed |
| Settings changed | PayrollSettings | key, old value, new value |

### Tier 3: Log for Security (Auth Events)
| Action | Entity | Details Captured |
|--------|--------|-----------------|
| Login success | User | userId, email, IP, user agent |
| Login failed | User | email attempted, IP, reason |
| Registration | User + Tenant | userId, tenantId, email |
| Token issued | User | userId, scopes/roles in token |
| Tenant created | Tenant | tenantId, name, created by |
| Tenant updated | Tenant | changed fields |

---

## Architecture

### Audit Log Entity

```
src/core/audit/entities/audit-log.entity.ts
```

```typescript
@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // WHO
  @Column({ nullable: true })
  userId: string;           // User who performed the action

  @Column({ nullable: true })
  userName: string;          // Denormalized — survives user deletion

  @Column({ nullable: true })
  tenantId: string;          // Which school

  // WHAT
  @Column()
  action: string;            // CREATE, UPDATE, DELETE, APPROVE, REJECT, PROCESS, LOGIN, etc.

  @Column()
  entityType: string;        // 'Salary', 'Loan', 'Employee', 'TaxRule', etc.

  @Column({ nullable: true })
  entityId: string;          // ID of the affected record

  // DETAILS
  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;   // Previous state (for updates/deletes)

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;   // New state (for creates/updates)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;    // Extra context (IP, user agent, notes, error details)

  // WHEN
  @CreateDateColumn()
  createdAt: Date;

  // SEARCHABILITY
  @Index()
  @Column({ nullable: true })
  category: string;          // 'FINANCIAL', 'EMPLOYEE', 'CONFIGURATION', 'SECURITY'
}
```

**Indexes**: `entityType + entityId` (composite), `userId`, `tenantId`, `createdAt`, `category`, `action`.

### Migration

```
src/migrations/XXXXXXXXX-CreateAuditLogsTable.ts
```

Creates `audit_logs` table in the **public schema** (not per-tenant). This is deliberate — audit logs should not be deletable by tenant admins. The `tenantId` column scopes queries.

### Audit Service

```
src/core/audit/services/audit.service.ts
```

```typescript
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  async log(entry: {
    userId?: string;
    userName?: string;
    tenantId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    category: 'FINANCIAL' | 'EMPLOYEE' | 'CONFIGURATION' | 'SECURITY';
  }): Promise<void> {
    // Fire-and-forget — audit logging should never block the main operation
    this.auditRepo.save(this.auditRepo.create(entry)).catch((err) => {
      // Log to console as fallback — never throw
      console.error('[AuditService] Failed to write audit log:', err);
    });
  }

  async query(filters: AuditQueryDto): Promise<PaginatedResponse<AuditLogEntity>> {
    // Supports filtering by: entityType, entityId, userId, action, category, dateRange
    // Supports pagination
    // Ordered by createdAt DESC (most recent first)
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLogEntity[]> {
    // Get full audit trail for a specific record
  }
}
```

Key design decisions:
1. **Fire-and-forget**: `log()` does not await the save and catches errors. Audit logging must never slow down or break the main operation.
2. **Denormalized userName**: If a user is deleted, we still know who performed the action.
3. **Public schema**: Tenant admins cannot tamper with their own audit trail.

### Audit Module

```
src/core/audit/audit.module.ts
```

```typescript
@Global()   // Available everywhere without importing
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```

`@Global()` so every service can inject `AuditService` without modifying their module's imports.

### Audit Interceptor (Automatic Logging for CUD Operations)

```
src/core/audit/interceptors/audit.interceptor.ts
```

A NestJS interceptor that automatically logs CREATE, UPDATE, DELETE operations based on the HTTP method and route:

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const user = request.user;

    // Only log mutating requests
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap((responseData) => {
          // Log after successful response
          this.auditService.log({
            userId: user?.sub,
            userName: `${user?.firstName} ${user?.lastName}`,
            tenantId: user?.tenantId,
            action: this.methodToAction(method),
            entityType: this.extractEntityType(request.route.path),
            entityId: request.params?.id || responseData?.id,
            newValues: method === 'DELETE' ? null : request.body,
            metadata: {
              ip: request.ip,
              userAgent: request.headers['user-agent'],
              path: request.path,
            },
            category: this.categorize(request.route.path),
          });
        }),
      );
    }

    return next.handle();
  }
}
```

This provides baseline coverage. Services add explicit `auditService.log()` calls for richer context (old values, diffs, financial details).

### Audit Decorator (For Explicit Logging in Services)

```
src/core/audit/decorators/auditable.decorator.ts
```

For critical operations where we need old + new values:

```typescript
// Usage in PayrollService:
async approveSalary(id: string, dto: SalaryApprovalDto): Promise<SalaryEntity> {
  const salary = await this.findById(id);
  const oldStatus = salary.status;

  // ... approval logic ...

  await this.auditService.log({
    userId: dto.approverId,
    action: 'APPROVE',
    entityType: 'Salary',
    entityId: id,
    oldValues: { status: oldStatus },
    newValues: { status: 'APPROVED', approverId: dto.approverId },
    metadata: { notes: dto.notes, employeeId: salary.employeeId },
    category: 'FINANCIAL',
  });

  return updatedSalary;
}
```

---

## Integration Points

### Services That Need Explicit Audit Calls

These services handle the Tier 1 (financial) operations and need explicit `auditService.log()` calls with full context:

**PayrollService** (`payroll.service.ts`):
- `processPayPeriod()` — log start/end with summary
- `approveSalary()` — log with old/new status, approverId
- `markAsPaid()` — log with payment reference
- `processBulkPayment()` — log each payment result

**LoanManagementService** (`loan-management.service.ts`):
- `applyForLoan()` — log application details
- `applyForAdvance()` — log advance details
- `approveLoan()` — log with approverId
- `rejectLoan()` — log with reason
- `disburseLoan()` — log disbursement
- `recordSalaryRepayments()` — log each repayment

**TaxCalculationService / TaxController**:
- Tax rule CRUD — log old/new values on update, snapshot on delete

**AuthService** (`auth.service.ts`):
- `login()` — log success/failure with IP
- `register()` — log user + tenant creation

**SalaryCalculationService** (`salary-calculation.service.ts`):
- `calculateSalary()` — log the full calculation result (this is the financial record of what was computed and why)

### The Interceptor Handles

Everything else (employee CRUD, department CRUD, settings changes, role changes) gets baseline coverage from the interceptor — no code changes needed in those services.

---

## Audit Log API (For Frontend)

### Controller

```
src/core/audit/controllers/audit.controller.ts
```

Endpoints:
- `GET /audit-logs` — List with filters (ADMIN only)
  - Query: `entityType`, `entityId`, `userId`, `action`, `category`, `fromDate`, `toDate`, `page`, `limit`
- `GET /audit-logs/entity/:entityType/:entityId` — Full history of a specific record
- `GET /audit-logs/user/:userId` — All actions by a specific user
- `GET /audit-logs/summary` — Aggregated stats (actions per day, top actors, most modified entities)

Roles: `ADMIN`, `FINANCE_ADMIN` only. Regular users should not access audit logs.

---

## Frontend Integration

### Audit Trail Panel
Every detail page (Employee, Salary, Loan, Tax Rule) gets an "Activity" or "History" tab:
- Timeline of changes: "John Doe approved this salary on Feb 15, 2025"
- Expandable entries showing old/new values as a diff
- Fetched from `GET /audit-logs/entity/:type/:id`

### Admin Audit Dashboard
A dedicated `/audit` page in the admin section:
- Search across all audit logs
- Filter by category, action, user, date range
- Export to CSV for external auditors
- Activity chart showing volume over time

---

## Data Retention

- Audit logs are **never deleted** by application code
- Implement a configurable retention policy (default: 7 years for financial, 2 years for others)
- Retention is handled at the database level (partitioning by month, dropping old partitions)
- For large tenants: consider archiving to cold storage (S3 + Parquet) after retention period

---

## Implementation Order

### Step 1: Core Infrastructure
1. Create `AuditLogEntity` and migration
2. Create `AuditService` with `log()` and `query()` methods
3. Create `AuditModule` as `@Global()`
4. Register in `AppModule`
5. Write unit tests for AuditService

### Step 2: Financial Operations (Highest Priority)
6. Add explicit audit calls to `PayrollService` (process, approve, pay)
7. Add explicit audit calls to `LoanManagementService` (apply, approve, disburse, repay)
8. Add explicit audit calls to `AuthService` (login, register)
9. Add explicit audit calls to salary calculation

### Step 3: Automatic Coverage
10. Implement `AuditInterceptor`
11. Apply globally or to specific controllers
12. This covers all remaining CRUD operations

### Step 4: API & Frontend
13. Create `AuditController` with query endpoints
14. Add "History" tabs to frontend detail pages
15. Build admin audit dashboard

---

## What This Gives the School

1. **Accountability**: Every financial decision is traced to a person
2. **Compliance**: Auditors can verify the payroll process was followed correctly
3. **Debugging**: When numbers don't add up, trace back through the calculation history
4. **Security**: Failed login attempts and unauthorized access attempts are visible
5. **Trust**: Board members and regulators can verify the system is being used properly
