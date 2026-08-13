import api from './client';

/**
 * Money, read from the ledger.
 *
 * Every amount here is a STRING, all the way from Postgres `numeric`. It is
 * formatted for display and never parsed into a float — a ledger that loses a
 * kobo somewhere between the database and a bursar's screen is worse than one
 * that shows nothing.
 */

// REVENUE, not INCOME. This said 'INCOME' until fees arrived and nothing
// caught it, because the backend had never once produced a revenue account —
// the string was wrong from the day it was written and unreachable until now.
export type AccountType =
    | 'ASSET'
    | 'LIABILITY'
    | 'EQUITY'
    | 'REVENUE'
    | 'EXPENSE';

export interface AccountBalance {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    debits: string;
    credits: string;
    balance: string;
}

export interface TrialBalance {
    asOf: string;
    rows: AccountBalance[];
    totalDebits: string;
    totalCredits: string;
    difference: string;
    /** The only number that matters on this screen. */
    balanced: boolean;
}

export interface JournalEntrySummary {
    id: string;
    entry_date: string;
    source_type: string;
    source_id: string | null;
    description: string;
    reverses_entry_id: string | null;
    total: string;
}

export interface JournalLine {
    id: string;
    debit: string;
    credit: string;
    memo: string | null;
    account_code: string;
    account_name: string;
    account_type: AccountType;
}

export interface JournalEntryDetail extends JournalEntrySummary {
    lines: JournalLine[];
}

export interface PayrollLedgerCheck {
    payPeriod: { id: string; name: string };
    payrollGross: string;
    payrollNet: string;
    payrollDeductions: string;
    postedDebits: string;
    postedCredits: string;
    entries: number;
    difference: string;
    agrees: boolean;
    note: string;
}

export async function getAccounts(asOf?: string): Promise<AccountBalance[]> {
    const qs = asOf ? `?asOf=${asOf}` : '';
    return (await api.get(`/ledger/accounts${qs}`)) as unknown as AccountBalance[];
}

export async function getTrialBalance(asOf?: string): Promise<TrialBalance> {
    const qs = asOf ? `?asOf=${asOf}` : '';
    return (await api.get(`/ledger/trial-balance${qs}`)) as unknown as TrialBalance;
}

export async function getJournalEntries(filters?: {
    from?: string;
    to?: string;
    sourceType?: string;
    accountId?: string;
}): Promise<JournalEntrySummary[]> {
    const q = new URLSearchParams();
    if (filters?.from) q.set('from', filters.from);
    if (filters?.to) q.set('to', filters.to);
    if (filters?.sourceType && filters.sourceType !== 'all')
        q.set('sourceType', filters.sourceType);
    if (filters?.accountId) q.set('accountId', filters.accountId);
    const qs = q.toString();
    return (await api.get(
        `/ledger/entries${qs ? `?${qs}` : ''}`,
    )) as unknown as JournalEntrySummary[];
}

export async function getJournalEntry(
    id: string,
): Promise<JournalEntryDetail> {
    return (await api.get(
        `/ledger/entries/${id}`,
    )) as unknown as JournalEntryDetail;
}

export async function getPayrollCheck(
    payPeriodId: string,
): Promise<PayrollLedgerCheck> {
    return (await api.get(
        `/ledger/payroll-check/${payPeriodId}`,
    )) as unknown as PayrollLedgerCheck;
}

// ── Expenses ────────────────────────────────────────────────────────────────

export type ExpenseStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'PAID'
    | 'REJECTED'
    | 'CANCELLED';

export interface Expense {
    id: string;
    expenseNumber: string;
    description: string;
    amount: string;
    expenseDate: string;
    status: ExpenseStatus;
    /** What the server says may happen next. The UI renders from this. */
    allowedTransitions: ExpenseStatus[];
    accountId: string;
    departmentId: string | null;
    vendor: string | null;
    requestedBy: string | null;
    approvedBy: string | null;
    paidAt: string | null;
    paymentReference: string | null;
    notes: string | null;
    account?: { id: string; code: string; name: string };
    department?: { id: string; name: string } | null;
}

export async function getExpenses(status?: string): Promise<Expense[]> {
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    return (await api.get(`/expenses${qs}`)) as unknown as Expense[];
}

export async function getExpense(id: string): Promise<Expense> {
    return (await api.get(`/expenses/${id}`)) as unknown as Expense;
}

export async function createExpense(dto: {
    description: string;
    amount: number;
    expenseDate: string;
    accountId: string;
    departmentId?: string;
    vendor?: string;
    notes?: string;
}): Promise<Expense> {
    return (await api.post('/expenses', dto)) as unknown as Expense;
}

export async function expenseAction(
    id: string,
    action: 'submit' | 'approve' | 'reject' | 'cancel' | 'reopen',
    body?: Record<string, unknown>,
): Promise<Expense> {
    return (await api.post(
        `/expenses/${id}/${action}`,
        body ?? {},
    )) as unknown as Expense;
}

export async function payExpense(
    id: string,
    dto: {
        paymentAccountId: string;
        paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
        paymentReference?: string;
        paidOn?: string;
    },
): Promise<Expense> {
    return (await api.post(`/expenses/${id}/pay`, dto)) as unknown as Expense;
}

export async function getSpendByAccount(
    from?: string,
    to?: string,
): Promise<Array<{ code: string; name: string; total: string }>> {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const qs = q.toString();
    return (await api.get(
        `/expenses/by-account${qs ? `?${qs}` : ''}`,
    )) as unknown as Array<{ code: string; name: string; total: string }>;
}

// ── Budgets ─────────────────────────────────────────────────────────────────

export interface Budget {
    id: string;
    accountId: string;
    departmentId: string | null;
    periodStart: string;
    periodEnd: string;
    amount: string;
    notes: string | null;
    account?: { code: string; name: string };
    department?: { name: string } | null;
}

export interface BudgetVariance {
    budgetId: string;
    accountCode: string;
    accountName: string;
    department: string | null;
    periodStart: string;
    periodEnd: string;
    budgeted: string;
    actual: string;
    remaining: string;
    usedPercent: number | null;
    overBudget: boolean;
}

export async function getBudgets(): Promise<Budget[]> {
    return (await api.get('/budgets')) as unknown as Budget[];
}

export async function getBudgetVariance(filters?: {
    on?: string;
    departmentId?: string;
}): Promise<BudgetVariance[]> {
    const q = new URLSearchParams();
    if (filters?.on) q.set('on', filters.on);
    if (filters?.departmentId) q.set('departmentId', filters.departmentId);
    const qs = q.toString();
    return (await api.get(
        `/budgets/variance${qs ? `?${qs}` : ''}`,
    )) as unknown as BudgetVariance[];
}

export async function createBudget(dto: {
    accountId: string;
    departmentId?: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
    notes?: string;
}): Promise<Budget> {
    return (await api.post('/budgets', dto)) as unknown as Budget;
}

export async function deleteBudget(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
}
