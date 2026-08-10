import api from './client';
import type { LeaveBalance, LeaveRequest, LeaveType } from '@/lib/types/api';

export interface CreateLeaveTypeDto {
  name: string;
  description?: string;
  /** Days granted per leave year. 0 means uncapped. */
  daysPerYear?: number;
  /** Whether the employee is paid. The only field payroll consults. */
  paid?: boolean;
  carriesOver?: boolean;
  active?: boolean;
}

export type UpdateLeaveTypeDto = Partial<CreateLeaveTypeDto>;

export interface CreateLeaveRequestDto {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  /** Inclusive. */
  endDate: string;
  /** Days claimed — sent as entered, since half-days exist. */
  days: number;
  reason?: string;
}

export async function getLeaveTypes(
  includeInactive = false,
): Promise<LeaveType[]> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return (await api.get(`/leave/types${query}`)) as unknown as LeaveType[];
}

export async function createLeaveType(
  dto: CreateLeaveTypeDto,
): Promise<LeaveType> {
  return (await api.post('/leave/types', dto)) as unknown as LeaveType;
}

export async function updateLeaveType(
  id: string,
  dto: UpdateLeaveTypeDto,
): Promise<LeaveType> {
  return (await api.patch(`/leave/types/${id}`, dto)) as unknown as LeaveType;
}

export async function getLeaveRequests(filters?: {
  employeeId?: string;
  status?: string;
}): Promise<LeaveRequest[]> {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.set('employeeId', filters.employeeId);
  if (filters?.status) params.set('status', filters.status);
  const query = params.toString() ? `?${params}` : '';
  return (await api.get(`/leave/requests${query}`)) as unknown as LeaveRequest[];
}

export async function createLeaveRequest(
  dto: CreateLeaveRequestDto,
): Promise<LeaveRequest> {
  return (await api.post('/leave/requests', dto)) as unknown as LeaveRequest;
}

export async function approveLeaveRequest(
  id: string,
  note?: string,
): Promise<LeaveRequest> {
  return (await api.post(`/leave/requests/${id}/approve`, {
    note,
  })) as unknown as LeaveRequest;
}

export async function rejectLeaveRequest(
  id: string,
  note?: string,
): Promise<LeaveRequest> {
  return (await api.post(`/leave/requests/${id}/reject`, {
    note,
  })) as unknown as LeaveRequest;
}

export async function cancelLeaveRequest(
  id: string,
  note?: string,
): Promise<LeaveRequest> {
  return (await api.post(`/leave/requests/${id}/cancel`, {
    note,
  })) as unknown as LeaveRequest;
}

export async function getLeaveBalances(
  employeeId: string,
  year?: number,
): Promise<LeaveBalance[]> {
  const query = year ? `?year=${year}` : '';
  return (await api.get(
    `/leave/balances/${employeeId}${query}`,
  )) as unknown as LeaveBalance[];
}
