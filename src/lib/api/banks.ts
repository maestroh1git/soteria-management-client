import api from './client';

export interface Bank {
    /** NIBSS institution code — what a payment file is matched on. */
    code: string;
    name: string;
}

/**
 * Served by the backend rather than hardcoded here. A bank list that has
 * drifted between client and server is a payment addressed to an institution
 * the file cannot name.
 */
export async function getBanks(): Promise<Bank[]> {
    return (await api.get('/banks')) as unknown as Bank[];
}
