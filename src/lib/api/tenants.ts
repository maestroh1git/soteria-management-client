import api from './client';
import type { Tenant } from '@/lib/types/api';
import type { KybStatus } from '@/lib/types/enums';

export interface UpdateTenantProfileDto {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  cacNumber?: string;
  tinNumber?: string;
  vatNumber?: string;
  nsitfNumber?: string;
  itfNumber?: string;
  nhfNumber?: string;
  /** Free-form preferences (jsonb); shallow-merged server-side. */
  settings?: Record<string, unknown>;
}

export async function getMyTenant(): Promise<Tenant> {
  return await api.get('/tenants/me') as unknown as Tenant;
}

export async function updateMyTenant(data: UpdateTenantProfileDto): Promise<Tenant> {
  return await api.patch('/tenants/me', data) as unknown as Tenant;
}

// ── Platform / super-admin endpoints ────────────────────────
// All require systemRoles = ['super_admin']. The backend gates these on the
// canonical role string; see PLATFORM_ROADMAP.md.

/** List every tenant across the platform. */
export async function listTenants(): Promise<Tenant[]> {
  return await api.get('/tenants') as unknown as Tenant[];
}

/** Fetch a single tenant by id (platform view). */
export async function getTenant(id: string): Promise<Tenant> {
  return await api.get(`/tenants/${id}`) as unknown as Tenant;
}

/**
 * Approve / reject / change a tenant's KYB verification status.
 * `rejectionReason` is required by the backend when status is REJECTED.
 */
export async function updateTenantKybStatus(
  id: string,
  status: KybStatus,
  rejectionReason?: string,
): Promise<Tenant> {
  return await api.patch(`/tenants/${id}/kyb-status`, {
    status,
    ...(rejectionReason ? { rejectionReason } : {}),
  }) as unknown as Tenant;
}

/** Suspend (false) or reactivate (true) a tenant. Blocks/unblocks all its users. */
export async function setTenantActive(
  id: string,
  isActive: boolean,
): Promise<Tenant> {
  return await api.patch(`/tenants/${id}`, { isActive }) as unknown as Tenant;
}

/** A customer's organisation and the person who will own it (5.13). */
export interface OnboardTenantInput {
    name: string;
    organizationType: string;
    industry?: string;
    slug?: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
}

export interface OnboardedTenant {
    tenant: Tenant;
    owner: { id: string; email: string; firstName: string; lastName: string };
    /** False when mail is not configured; then `inviteUrl` is the way in. */
    emailed: boolean;
    inviteUrl?: string;
}

/** Create the organisation, its defaults, and an invite for its owner. */
export async function onboardTenant(input: OnboardTenantInput): Promise<OnboardedTenant> {
    return (await api.post('/platform/tenants', input)) as unknown as OnboardedTenant;
}
