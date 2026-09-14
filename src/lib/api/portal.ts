import api from './client';

export interface PortalChild {
    id: string;
    name: string;
    admissionNumber: string;
    className: string | null;
    status: string;
    /** Owed across every issued invoice. A string, like every amount. */
    outstanding: string;
}

export interface StatementEntry {
    date: string;
    description: string;
    charge: string | null;
    payment: string | null;
    balance: string;
}

export interface ChildStatement {
    student: { id: string; name: string; admissionNumber: string };
    entries: StatementEntry[];
    balance: string;
    unallocatedCredit: string;
}

export async function getMyChildren(): Promise<PortalChild[]> {
    return (await api.get('/portal/children')) as unknown as PortalChild[];
}

export async function getChildStatement(
    studentId: string,
): Promise<ChildStatement> {
    return (await api.get(
        `/portal/children/${studentId}/statement`,
    )) as unknown as ChildStatement;
}
