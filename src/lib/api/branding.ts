import api from './client';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface BrandingMeta {
    primaryColor: string | null;
    accentColor: string | null;
    hasLogo: boolean;
    hasFavicon: boolean;
    /** Paths relative to the API base; use brandingImageUrl() to resolve. */
    logoUrl: string | null;
    faviconUrl: string | null;
}

/** Resolve a branding image path (from the meta) to a full, loadable URL. */
export function brandingImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return `${API_BASE_URL}${path}`;
}

export async function getBranding(): Promise<BrandingMeta> {
    return (await api.get('/branding/me')) as unknown as BrandingMeta;
}

export async function updateBrandingColors(dto: {
    primaryColor?: string;
    accentColor?: string;
}): Promise<BrandingMeta> {
    return (await api.patch('/branding/me', dto)) as unknown as BrandingMeta;
}

// The browser must set the multipart boundary itself; the client's JSON
// Content-Type default would otherwise leave the upload unparseable and the
// server sees no file. Same override the student/employee imports use.
const multipart = { headers: { 'Content-Type': undefined as never } };

export async function uploadLogo(file: File): Promise<BrandingMeta> {
    const form = new FormData();
    form.append('file', file);
    return (await api.post(
        '/branding/me/logo',
        form,
        multipart,
    )) as unknown as BrandingMeta;
}

export async function uploadFavicon(file: File): Promise<BrandingMeta> {
    const form = new FormData();
    form.append('file', file);
    return (await api.post(
        '/branding/me/favicon',
        form,
        multipart,
    )) as unknown as BrandingMeta;
}

export async function removeLogo(): Promise<BrandingMeta> {
    return (await api.delete('/branding/me/logo')) as unknown as BrandingMeta;
}
