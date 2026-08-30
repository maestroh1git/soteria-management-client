import axios from 'axios';

/**
 * The public application form talks to the API WITHOUT the authenticated
 * client.
 *
 * `api` attaches a bearer token and, on a 401, bounces to the login page. A
 * parent has neither a token nor any business being sent to a login screen, so
 * these routes use a plain axios instance. It is a small duplication that
 * keeps an unauthenticated visitor out of the authenticated app's plumbing.
 */
const base = process.env.NEXT_PUBLIC_API_URL || '/api';
const publicApi = axios.create({ baseURL: base });

export interface PublicSchool {
    name: string;
    slug: string;
    levels: Array<{ id: string; name: string }>;
    sessionId: string | null;
    sessionName: string | null;
}

export interface PublicApplicationStatus {
    applicationNumber: string;
    childFirstName: string;
    status: string;
    submittedAt: string;
    offerExpiresAt: string | null;
    schoolName: string;
}

export interface ApplyPayload {
    classLevelId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    previousSchool?: string;
    guardianFirstName: string;
    guardianLastName: string;
    guardianPhone: string;
    guardianEmail?: string;
    guardianRelationship: string;
}

function message(e: unknown, fallback: string): string {
    const body = (e as any)?.response?.data;
    return body?.error?.message ?? body?.message ?? fallback;
}

export async function getPublicSchool(slug: string): Promise<PublicSchool> {
    try {
        const res = await publicApi.get(`/public/schools/${slug}`);
        return res.data;
    } catch (e) {
        throw new Error(message(e, 'We could not find that school'));
    }
}

export async function submitApplication(
    slug: string,
    payload: ApplyPayload,
): Promise<{ applicationNumber: string; accessToken: string }> {
    try {
        const res = await publicApi.post(
            `/public/schools/${slug}/applications`,
            payload,
        );
        return res.data;
    } catch (e) {
        throw new Error(message(e, 'We could not submit your application'));
    }
}

export async function getApplicationStatus(
    token: string,
): Promise<PublicApplicationStatus> {
    try {
        const res = await publicApi.get(`/public/applications/${token}`);
        return res.data;
    } catch (e) {
        throw new Error(message(e, 'We could not find that application'));
    }
}
