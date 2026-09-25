import api from './client';

/** One thing waiting on the caller (GET /home). */
export interface HomeItem {
    key:
        | 'approvals'
        | 'myRegisters'
        | 'registers'
        | 'applications'
        | 'sittingsToday'
        | 'payRuns'
        | 'unreconciled'
        | 'overdueInvoices'
        | 'myRequests';
    count: number;
    amount?: string;
    href: string;
}

export async function getHome(): Promise<{ items: HomeItem[] }> {
    return (await api.get('/home')) as unknown as { items: HomeItem[] };
}
