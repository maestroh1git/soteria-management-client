import api from './client';
import type { PayPeriod, PayPeriodFilters } from '@/lib/types/api';

export interface CreatePayPeriodDto {
  name: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
}

export async function getPayPeriods(filters?: PayPeriodFilters): Promise<PayPeriod[]> {
  return await api.get('/pay-periods', { params: filters }) as unknown as PayPeriod[];
}

export async function getPayPeriod(id: string): Promise<PayPeriod> {
  return await api.get(`/pay-periods/${id}`) as unknown as PayPeriod;
}

export async function getCurrentPayPeriod(): Promise<PayPeriod> {
  return await api.get('/pay-periods/current') as unknown as PayPeriod;
}

export async function createPayPeriod(dto: CreatePayPeriodDto): Promise<PayPeriod> {
  return await api.post('/pay-periods', dto) as unknown as PayPeriod;
}
