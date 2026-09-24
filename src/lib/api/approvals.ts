import api from './client';

export type ApprovalKind = 'payRun' | 'adjustment' | 'leave' | 'expense' | 'concession' | 'loan';

export interface ApprovalItem {
    kind: ApprovalKind;
    id: string;
    title: string;
    detail: string;
    amount: string | null;
    percent: string | null;
    since: string;
    /** You raised it: somebody else must decide. */
    yours: boolean;
    href: string;
}

export interface Approvals {
    /** Items you may act on (your own are listed but not counted). */
    total: number;
    counts: Partial<Record<ApprovalKind, number>>;
    items: ApprovalItem[];
}

/** Everything waiting on a decision from you (GET /approvals). */
export async function getApprovals(): Promise<Approvals> {
    return (await api.get('/approvals')) as unknown as Approvals;
}
