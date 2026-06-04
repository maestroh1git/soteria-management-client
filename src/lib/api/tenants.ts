import api from './client';
import type { Tenant } from '@/lib/types/api';

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
}

export async function getMyTenant(): Promise<Tenant> {
  return await api.get('/tenants/me') as unknown as Tenant;
}

export async function updateMyTenant(data: UpdateTenantProfileDto): Promise<Tenant> {
  return await api.patch('/tenants/me', data) as unknown as Tenant;
}
