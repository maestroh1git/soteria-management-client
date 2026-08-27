import api from './client';

export interface Bank {
    /** NIBSS institution code — what a payment file is matched on. */
    code: string;
    name: string;
    /** True for banks this tenant added; those carry an id and can be edited. */
    custom?: boolean;
    id?: string;
}

export interface CustomBankDto {
    name: string;
    code: string;
}

/**
 * Served by the backend rather than hardcoded here. A bank list that has
 * drifted between client and server is a payment addressed to an institution
 * the file cannot name. Returns the standard list plus this tenant's additions.
 */
export async function getBanks(): Promise<Bank[]> {
    return (await api.get('/banks')) as unknown as Bank[];
}

export async function createBank(dto: CustomBankDto): Promise<Bank> {
    return (await api.post('/banks', dto)) as unknown as Bank;
}

export async function updateBank(
    id: string,
    dto: Partial<CustomBankDto>,
): Promise<Bank> {
    return (await api.patch(`/banks/${id}`, dto)) as unknown as Bank;
}

export async function deleteBank(id: string): Promise<void> {
    await api.delete(`/banks/${id}`);
}
