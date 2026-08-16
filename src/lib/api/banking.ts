import api from './client';

export type StatementStatus = 'OPEN' | 'COMPLETED';

export interface StatementSummary {
    id: string;
    periodStart: string;
    periodEnd: string;
    openingBalance: string;
    closingBalance: string;
    status: StatementStatus;
    reference: string | null;
    accountCode: string;
    accountName: string;
    lineCount: number;
    unmatchedCount: number;
}

export interface StatementLine {
    id: string;
    lineNumber: number;
    valueDate: string;
    description: string;
    reference: string | null;
    moneyIn: string;
    moneyOut: string;
    matchGroupId: string | null;
}

export interface StatementDetail {
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    status: StatementStatus;
    periodStart: string;
    periodEnd: string;
    openingBalance: string;
    closingBalance: string;
    reference: string | null;
    notes: string | null;
    lines: StatementLine[];
}

export interface ReconciliationReport {
    statement: {
        id: string;
        accountCode: string;
        accountName: string;
        periodStart: string;
        periodEnd: string;
        openingBalance: string;
        closingBalance: string;
        status: StatementStatus;
    };
    bookBalance: string;
    statementBalance: string;
    difference: string;
    /** On the statement, missing from the books. Errors — these must be posted. */
    unrecorded: Array<{
        id: string;
        lineNumber: number;
        valueDate: string;
        description: string;
        reference: string | null;
        moneyIn: string;
        moneyOut: string;
    }>;
    /** In the books, not yet seen by the bank. Legitimate timing. */
    inTransit: Array<{
        journalLineId: string;
        entryDate: string;
        description: string;
        sourceType: string;
        memo: string | null;
        debit: string;
        credit: string;
    }>;
    adjustedBook: string;
    adjustedBank: string;
    unexplained: string;
    balances: boolean;
    reconciled: boolean;
    note: string;
}

export async function getStatements(): Promise<StatementSummary[]> {
    return (await api.get('/banking/statements')) as unknown as StatementSummary[];
}

export async function getStatement(id: string): Promise<StatementDetail> {
    return (await api.get(`/banking/statements/${id}`)) as unknown as StatementDetail;
}

export async function getReconciliationReport(
    id: string,
): Promise<ReconciliationReport> {
    return (await api.get(
        `/banking/statements/${id}/report`,
    )) as unknown as ReconciliationReport;
}

export async function createStatement(data: {
    accountId: string;
    periodStart: string;
    periodEnd: string;
    openingBalance: number;
    closingBalance: number;
    reference?: string;
    lines: Array<{
        lineNumber: number;
        valueDate: string;
        description: string;
        reference?: string;
        moneyIn?: number;
        moneyOut?: number;
    }>;
}): Promise<StatementDetail> {
    return (await api.post('/banking/statements', data)) as unknown as StatementDetail;
}

export async function matchLines(
    statementId: string,
    data: { statementLineIds: string[]; journalLineIds: string[] },
): Promise<{ groupId: string }> {
    return (await api.post(
        `/banking/statements/${statementId}/match`,
        data,
    )) as unknown as { groupId: string };
}

export async function unmatchGroup(
    statementId: string,
    groupId: string,
): Promise<void> {
    await api.delete(`/banking/statements/${statementId}/match/${groupId}`);
}

export async function autoMatch(
    statementId: string,
): Promise<{ matched: number; ambiguous: number }> {
    return (await api.post(
        `/banking/statements/${statementId}/auto-match`,
        {},
    )) as unknown as { matched: number; ambiguous: number };
}

export async function postStatementLine(
    statementId: string,
    lineId: string,
    data: { accountId: string; description?: string },
): Promise<{ groupId: string }> {
    return (await api.post(
        `/banking/statements/${statementId}/lines/${lineId}/post`,
        data,
    )) as unknown as { groupId: string };
}

export async function completeStatement(
    statementId: string,
): Promise<ReconciliationReport> {
    return (await api.post(
        `/banking/statements/${statementId}/complete`,
        {},
    )) as unknown as ReconciliationReport;
}
