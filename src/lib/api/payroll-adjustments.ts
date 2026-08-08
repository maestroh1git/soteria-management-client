import api from './client';
import type { PayrollAdjustment } from '@/lib/types/api';

export type AdjustmentType = 'EARNING' | 'DEDUCTION' | 'WAIVER';

export interface CreatePayrollAdjustmentDto {
  employeeId: string;
  payPeriodId: string;
  type: AdjustmentType;
  /** Required when type is WAIVER — the standing component to suppress. */
  componentId?: string;
  label: string;
  /** Omitted for WAIVER, which removes an amount rather than adding one. */
  amount?: number;
  reason?: string;
}

export interface UpdatePayrollAdjustmentDto {
  label?: string;
  amount?: number;
  reason?: string;
}

export async function getAdjustments(
  payPeriodId: string,
  employeeId?: string,
): Promise<PayrollAdjustment[]> {
  const params = new URLSearchParams({ payPeriodId });
  if (employeeId) params.set('employeeId', employeeId);
  return (await api.get(
    `/payroll-adjustments?${params}`,
  )) as unknown as PayrollAdjustment[];
}

export async function createAdjustment(
  dto: CreatePayrollAdjustmentDto,
): Promise<PayrollAdjustment> {
  return (await api.post(
    '/payroll-adjustments',
    dto,
  )) as unknown as PayrollAdjustment;
}

export async function updateAdjustment(
  id: string,
  dto: UpdatePayrollAdjustmentDto,
): Promise<PayrollAdjustment> {
  return (await api.patch(
    `/payroll-adjustments/${id}`,
    dto,
  )) as unknown as PayrollAdjustment;
}

export async function approveAdjustment(
  id: string,
): Promise<PayrollAdjustment> {
  return (await api.post(
    `/payroll-adjustments/${id}/approve`,
  )) as unknown as PayrollAdjustment;
}

export async function rejectAdjustment(
  id: string,
): Promise<PayrollAdjustment> {
  return (await api.post(
    `/payroll-adjustments/${id}/reject`,
  )) as unknown as PayrollAdjustment;
}

export async function deleteAdjustment(id: string): Promise<void> {
  await api.delete(`/payroll-adjustments/${id}`);
}
