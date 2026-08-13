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
