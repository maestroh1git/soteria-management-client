import api from './client';

export interface PayrollSetting {
  id: string;
  key: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  countryId: string | null;
}

export interface UpsertSettingDto {
  key: string;
  value: string;
  dataType: string;
  description: string;
  countryId?: string;
}

// ── API calls ───────────────────────────────────────────────

export async function getSettings(): Promise<PayrollSetting[]> {
  return await api.get('/settings') as unknown as PayrollSetting[];
}

export async function getSettingByKey(key: string): Promise<PayrollSetting> {
  return await api.get(`/settings/${key}`) as unknown as PayrollSetting;
}

export async function upsertSetting(data: UpsertSettingDto): Promise<PayrollSetting> {
  return await api.post('/settings', data) as unknown as PayrollSetting;
}

export async function deleteSetting(id: string): Promise<void> {
  await api.delete(`/settings/${id}`);
}
