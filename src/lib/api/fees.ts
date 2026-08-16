import api from './client';

export type FeeCategory =
    | 'TUITION'
    | 'BOARDING'
    | 'TRANSPORT'
    | 'LEVY'
    | 'MATERIALS'
    | 'OTHER';

export type FeeAppliesTo = 'ALL' | 'NEW_STUDENTS';

export interface FeeItem {
    id: string;
    code: string;
    name: string;
    category: FeeCategory;
    revenueAccountId: string;
    appliesTo: FeeAppliesTo;
    isOptional: boolean;
    active: boolean;
    description: string | null;
    revenueAccount?: { id: string; code: string; name: string };
}

/**
 * The price list, returned as axes plus a flat list of prices so the grid is
 * assembled client-side from one round trip.
 *
 * Amounts are strings — `numeric` is exact in Postgres and parsing it into a
 * float on the way through is how a price list loses a kobo.
 */
export interface PriceList {
    session: { id: string; name: string };
    terms: Array<{ id: string; name: string; sortOrder: number }>;
    levels: Array<{
        id: string;
        name: string;
        code: string | null;
        sortOrder: number;
    }>;
    items: Array<{
        id: string;
        code: string;
        name: string;
        category: FeeCategory;
        isOptional: boolean;
        appliesTo: FeeAppliesTo;
    }>;
    prices: Array<{
        id: string;
        termId: string;
        classLevelId: string;
        feeItemId: string;
        amount: string;
    }>;
}

export interface FeeProjection {
    session: { id: string; name: string };
    terms: Array<{
        termId: string;
        termName: string;
        levels: Array<{
            levelId: string;
            levelName: string;
            students: number;
            perStudent: string;
            projected: string;
        }>;
        projected: string;
    }>;
    projectedTotal: string;
    excludes: string;
}

export interface CreateFeeItemRequest {
    code: string;
    name: string;
    category?: FeeCategory;
    revenueAccountId: string;
    appliesTo?: FeeAppliesTo;
    isOptional?: boolean;
    description?: string;
}

export async function getFeeItems(includeInactive = false): Promise<FeeItem[]> {
    return (await api.get('/fees/items', {
        params: includeInactive ? { includeInactive: 'true' } : {},
    })) as unknown as FeeItem[];
}

export async function createFeeItem(
    data: CreateFeeItemRequest,
): Promise<FeeItem> {
    return (await api.post('/fees/items', data)) as unknown as FeeItem;
}

export async function updateFeeItem(
    id: string,
    data: Partial<CreateFeeItemRequest> & { active?: boolean },
): Promise<FeeItem> {
    return (await api.patch(`/fees/items/${id}`, data)) as unknown as FeeItem;
}

export async function removeFeeItem(
    id: string,
): Promise<{ deactivated: boolean }> {
    return (await api.delete(`/fees/items/${id}`)) as unknown as {
        deactivated: boolean;
    };
}

export async function getPriceList(sessionId: string): Promise<PriceList> {
    return (await api.get('/fees/structure', {
        params: { sessionId },
    })) as unknown as PriceList;
}

export async function setFeePrice(data: {
    termId: string;
    classLevelId: string;
    feeItemId: string;
    amount: number;
}): Promise<{ id: string; amount: string }> {
    return (await api.post('/fees/structure', data)) as unknown as {
        id: string;
        amount: string;
    };
}

export async function removeFeePrice(id: string): Promise<void> {
    await api.delete(`/fees/structure/${id}`);
}

export async function copyTermPrices(data: {
    fromTermId: string;
    toTermId: string;
    overwrite?: boolean;
}): Promise<{ copied: number; skipped: number; overwritten: number }> {
    return (await api.post('/fees/structure/copy', data)) as unknown as {
        copied: number;
        skipped: number;
        overwritten: number;
    };
}

export async function getFeeProjection(
    sessionId: string,
): Promise<FeeProjection> {
    return (await api.get('/fees/projection', {
        params: { sessionId },
    })) as unknown as FeeProjection;
}

// ── S2: invoicing ────────────────────────────────────────────────────────

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export interface InvoiceSummary {
    id: string;
    invoiceNumber: string | null;
    status: InvoiceStatus;
    origin: 'STRUCTURE' | 'MANUAL';
    issueDate: string | null;
    dueDate: string | null;
    admissionNumber: string;
    studentName: string;
    classLevel: string;
    termName: string;
    charges: string;
    discounts: string;
    total: string;
}

export interface InvoiceLine {
    id: string;
    kind: 'CHARGE' | 'DISCOUNT';
    description: string;
    amount: string;
    feeItemId: string | null;
    concessionId: string | null;
    sortOrder: number;
}

export interface InvoiceDetail {
    id: string;
    invoiceNumber: string | null;
    status: InvoiceStatus;
    issueDate: string | null;
    dueDate: string | null;
    notes: string | null;
    cancellationReason: string | null;
    lines: InvoiceLine[];
    charges: string;
    discounts: string;
    total: string;
    /** What the server says may happen next. The screen renders from this. */
    allowedTransitions: InvoiceStatus[];
    student?: { id: string; firstName: string; lastName: string; admissionNumber: string };
    term?: { id: string; name: string };
    classLevel?: { id: string; name: string };
}

export interface RunPreview {
    term: { id: string; name: string; sessionId: string };
    willBill: Array<{
        studentId: string;
        admissionNumber: string;
        studentName: string;
        classLevel: string;
        charges: string;
        discounts: string;
        total: string;
        warnings: string[];
    }>;
    skipped: Array<{
        studentId: string;
        admissionNumber: string;
        studentName: string;
        reason: string;
    }>;
    totalCharges: string;
    totalDiscounts: string;
    total: string;
    pendingConcessions: Array<{ studentName: string; reason: string }>;
}

export interface Concession {
    id: string;
    kind: 'PERCENTAGE' | 'FIXED';
    value: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedBy: string | null;
    approvedBy: string | null;
    studentId: string;
    admissionNumber: string;
    studentName: string;
    feeItemId: string | null;
    feeName: string | null;
    termId: string | null;
    termName: string | null;
}

export async function getInvoiceRunPreview(termId: string): Promise<RunPreview> {
    return (await api.get('/fees/invoices/preview', {
        params: { termId },
    })) as unknown as RunPreview;
}

export async function generateInvoices(data: {
    termId: string;
    dueDate?: string;
}): Promise<{ created: number; skipped: number }> {
    return (await api.post('/fees/invoices/generate', data)) as unknown as {
        created: number;
        skipped: number;
    };
}

export async function issueTermInvoices(termId: string): Promise<{
    issued: number;
    failed: Array<{ studentId: string; reason: string }>;
}> {
    return (await api.post(`/fees/invoices/issue-term/${termId}`, {})) as unknown as {
        issued: number;
        failed: Array<{ studentId: string; reason: string }>;
    };
}

export async function issueInvoice(id: string): Promise<InvoiceDetail> {
    return (await api.post(`/fees/invoices/${id}/issue`, {})) as unknown as InvoiceDetail;
}

export async function cancelInvoice(
    id: string,
    reason: string,
): Promise<{ cancelled: boolean; deleted: boolean }> {
    return (await api.post(`/fees/invoices/${id}/cancel`, { reason })) as unknown as {
        cancelled: boolean;
        deleted: boolean;
    };
}

export async function getInvoices(filters?: {
    termId?: string;
    studentId?: string;
    status?: InvoiceStatus;
}): Promise<InvoiceSummary[]> {
    return (await api.get('/fees/invoices', {
        params: filters ?? {},
    })) as unknown as InvoiceSummary[];
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
    return (await api.get(`/fees/invoices/${id}`)) as unknown as InvoiceDetail;
}

export async function getConcessions(filters?: {
    studentId?: string;
    sessionId?: string;
    status?: string;
}): Promise<Concession[]> {
    return (await api.get('/fees/concessions', {
        params: filters ?? {},
    })) as unknown as Concession[];
}

export async function createConcession(data: {
    studentId: string;
    sessionId: string;
    feeItemId?: string;
    termId?: string;
    kind: 'PERCENTAGE' | 'FIXED';
    value: number;
    reason: string;
}): Promise<Concession> {
    return (await api.post('/fees/concessions', data)) as unknown as Concession;
}

export async function approveConcession(id: string): Promise<Concession> {
    return (await api.post(`/fees/concessions/${id}/approve`, {})) as unknown as Concession;
}

export async function rejectConcession(id: string): Promise<Concession> {
    return (await api.post(`/fees/concessions/${id}/reject`, {})) as unknown as Concession;
}

export async function getSubscriptions(filters?: {
    studentId?: string;
    sessionId?: string;
}): Promise<
    Array<{
        id: string;
        studentId: string;
        studentName: string;
        admissionNumber: string;
        feeItemId: string;
        feeName: string;
        amount: string | null;
        active: boolean;
        notes: string | null;
    }>
> {
    return (await api.get('/fees/subscriptions', {
        params: filters ?? {},
    })) as unknown as any;
}

export async function subscribeStudentFee(data: {
    studentId: string;
    feeItemId: string;
    sessionId: string;
    amount?: number;
    notes?: string;
}): Promise<{ id: string; amount: string | null }> {
    return (await api.post('/fees/subscriptions', data)) as unknown as {
        id: string;
        amount: string | null;
    };
}

// ── S3: receipts and allocation ──────────────────────────────────────────

export interface OutstandingInvoice {
    invoiceId: string;
    invoiceNumber: string | null;
    studentId: string;
    studentName: string;
    admissionNumber: string;
    termName: string;
    issueDate: string | null;
    dueDate: string | null;
    total: string;
    paid: string;
    outstanding: string;
}

export interface Receipt {
    id: string;
    receiptNumber: string;
    amount: string;
    method: string;
    paidOn: string;
    reference: string | null;
    status: 'RECEIVED' | 'VOIDED';
    payerName: string | null;
    admissionNumber: string;
    studentName: string;
    allocated: string;
    unallocated: string;
}

export interface Statement {
    student: { id: string; name: string; admissionNumber: string };
    entries: Array<{
        date: string;
        description: string;
        charge: string | null;
        payment: string | null;
        balance: string;
    }>;
    balance: string;
    unallocatedCredit: string;
}

export async function getOutstanding(filters?: {
    studentId?: string;
    guardianOf?: string;
    termId?: string;
}): Promise<OutstandingInvoice[]> {
    return (await api.get('/fees/outstanding', {
        params: filters ?? {},
    })) as unknown as OutstandingInvoice[];
}

export async function recordPayment(data: {
    studentId: string;
    amount: number;
    method: string;
    paidOn: string;
    depositAccountId: string;
    reference?: string;
    payerName?: string;
    allocations?: Array<{ invoiceId: string; amount: number }>;
    notes?: string;
}): Promise<Receipt> {
    return (await api.post('/fees/payments', data)) as unknown as Receipt;
}

export async function allocatePayment(
    id: string,
    allocations: Array<{ invoiceId: string; amount: number }>,
): Promise<Receipt> {
    return (await api.post(`/fees/payments/${id}/allocate`, {
        allocations,
    })) as unknown as Receipt;
}

export async function voidPayment(id: string, reason: string): Promise<Receipt> {
    return (await api.post(`/fees/payments/${id}/void`, {
        reason,
    })) as unknown as Receipt;
}

export async function getPayments(filters?: {
    studentId?: string;
    from?: string;
    to?: string;
}): Promise<Receipt[]> {
    return (await api.get('/fees/payments', {
        params: filters ?? {},
    })) as unknown as Receipt[];
}

export async function getStatement(studentId: string): Promise<Statement> {
    return (await api.get(`/fees/statement/${studentId}`)) as unknown as Statement;
}

// ── S4: arrears and collection ───────────────────────────────────────────

export interface DebtorRow {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    classLevel: string;
    guardianName: string | null;
    guardianPhone: string | null;
    current: string;
    days30: string;
    days60: string;
    days90: string;
    days90Plus: string;
    total: string;
    credit: string;
    netOwed: string;
}

export interface DebtorsReport {
    asOf: string;
    rows: DebtorRow[];
    totals: Omit<DebtorRow, 'studentId' | 'admissionNumber' | 'studentName' | 'classLevel' | 'guardianName' | 'guardianPhone'>;
}

export interface TermCollection {
    termId: string;
    termName: string;
    sessionName: string;
    sortOrder: number;
    billed: string;
    collected: string;
    outstanding: string;
    collectionRate: number | null;
    studentsOwing: number;
}

export interface FeeSummary {
    term: { id: string; name: string } | null;
    billed: string;
    collected: string;
    outstanding: string;
    collectionRate: number | null;
    studentsOwing: number;
    unallocatedCredit: string;
}

export async function getDebtors(asOf?: string): Promise<DebtorsReport> {
    return (await api.get('/fees/debtors', {
        params: asOf ? { asOf } : {},
    })) as unknown as DebtorsReport;
}

export async function getCollectionByTerm(
    sessionId?: string,
): Promise<TermCollection[]> {
    return (await api.get('/fees/collection/by-term', {
        params: sessionId ? { sessionId } : {},
    })) as unknown as TermCollection[];
}

export async function getFeeSummary(termId?: string): Promise<FeeSummary> {
    return (await api.get('/fees/summary', {
        params: termId ? { termId } : {},
    })) as unknown as FeeSummary;
}
