import axios from 'axios';

/**
 * A parent's bill, fetched WITHOUT the authenticated client.
 *
 * Same reasoning as the public application form: `api` attaches a bearer token
 * and bounces to the login page on a 401. A parent has neither a token nor any
 * business being sent to a login screen.
 */
const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const publicApi = axios.create({ baseURL: base });

export interface PublicInvoice {
    organisationName: string;
    invoiceNumber: string | null;
    status: string;
    issueDate: string | null;
    dueDate: string | null;
    studentName: string;
    admissionNumber: string;
    className: string;
    termName: string;
    lines: Array<{ description: string; kind: string; amount: string }>;
    charges: string;
    discounts: string;
    total: string;
    paid: string;
    outstanding: string;
    payments: Array<{ receiptNumber: string; paidOn: string; amount: string }>;
}

export async function getPublicInvoice(
    accessToken: string,
): Promise<PublicInvoice> {
    const { data } = await publicApi.get(`/invoice/${accessToken}`);
    return data;
}
