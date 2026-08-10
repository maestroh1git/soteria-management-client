import api from './client';
import type { LeaveBalance, LeaveRequest, Loan, YtdTotals } from '@/lib/types/api';

/** Projection returned by /me/employee — not the full employee entity. */
export interface MyEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  joinDate: string;
  status: string;
  role: string | null;
  department: string | null;
  grade: { code: string; name: string } | null;
}

/** Payslip list entry — deliberately without the PDF bytes. */
export interface MyPayslip {
  id: string;
  fileName: string;
  status: string;
  generatedAt: string;
  payPeriod: string | null;
  netSalary: string | number | null;
  reference: string | null;
}

export interface RequestOwnLeaveDto {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}

export async function getMyEmployee(): Promise<MyEmployee> {
  return (await api.get('/me/employee')) as unknown as MyEmployee;
}

export async function getMyPayslips(): Promise<MyPayslip[]> {
  return (await api.get('/me/payslips')) as unknown as MyPayslip[];
}

/**
 * Fetched as a blob rather than a URL: the endpoint requires the bearer token,
 * so a plain link or window.open would be unauthenticated and 401.
 */
export async function downloadMyPayslip(
  id: string,
  fileName: string,
): Promise<void> {
  const response = await api.get(`/me/payslips/${id}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([response as unknown as BlobPart], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getMyYtd(year?: number): Promise<YtdTotals> {
  const query = year ? `?year=${year}` : '';
  return (await api.get(`/me/ytd${query}`)) as unknown as YtdTotals;
}

export async function getMyLeaveBalances(
  year?: number,
): Promise<LeaveBalance[]> {
  const query = year ? `?year=${year}` : '';
  return (await api.get(
    `/me/leave/balances${query}`,
  )) as unknown as LeaveBalance[];
}

export async function getMyLeaveRequests(): Promise<LeaveRequest[]> {
  return (await api.get('/me/leave/requests')) as unknown as LeaveRequest[];
}

export async function requestOwnLeave(
  dto: RequestOwnLeaveDto,
): Promise<LeaveRequest> {
  return (await api.post('/me/leave/requests', dto)) as unknown as LeaveRequest;
}

export async function cancelOwnLeave(id: string): Promise<LeaveRequest> {
  return (await api.post(
    `/me/leave/requests/${id}/cancel`,
  )) as unknown as LeaveRequest;
}

export async function getMyLoans(): Promise<Loan[]> {
  return (await api.get('/me/loans')) as unknown as Loan[];
}
