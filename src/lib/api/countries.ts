import api from './client';
import type { Country } from '@/lib/types/api';

export interface CreateCountryDto {
  name: string;
  code: string;
  currencyCode: string;
  currencySymbol: string;
  active?: boolean;
}

export type UpdateCountryDto = Partial<CreateCountryDto>;

// ── API calls ───────────────────────────────────────────────

export async function getCountries(): Promise<Country[]> {
  return await api.get('/countries') as unknown as Country[];
}

export async function createCountry(data: CreateCountryDto): Promise<Country> {
  return await api.post('/countries', data) as unknown as Country;
}

export async function updateCountry(id: string, data: UpdateCountryDto): Promise<Country> {
  return await api.patch(`/countries/${id}`, data) as unknown as Country;
}

export async function deleteCountry(id: string): Promise<void> {
  await api.delete(`/countries/${id}`);
}
