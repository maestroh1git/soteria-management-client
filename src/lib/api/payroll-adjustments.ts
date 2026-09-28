import api from './client';
import type { PayrollAdjustment } from '@/lib/types/api';
import type { StaffTarget, TargetedStaff } from './staff-target';

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

export interface BulkPayrollAdjustmentDto {
  payPeriodId: string;
  type: 'EARNING' | 'DEDUCTION';
  label: string;
  /** FIXED: the same amount each; PERCENT_OF_BASIC: 100 is a month's basic. */
  amountMode: 'FIXED' | 'PERCENT_OF_BASIC';
  amount: number;
  reason?: string;
  target: StaffTarget;
  dryRun?: boolean;
}

export interface BulkAdjustmentResult {
  dryRun: boolean;
  matched: number;
  total: number;
  created: Array<TargetedStaff & { amount: number }>;
  skipped: Array<TargetedStaff & { reason: string }>;
}

export async function createAdjustmentsForMany(
  dto: BulkPayrollAdjustmentDto,
): Promise<BulkAdjustmentResult> {
  return (await api.post(
    '/payroll-adjustments/bulk',
    dto,
  )) as unknown as BulkAdjustmentResult;
}

export async function approveManyAdjustments(
  ids: string[],
): Promise<{ approved: number }> {
  return (await api.post('/payroll-adjustments/approve-many', {
    ids,
  })) as unknown as { approved: number };
}
