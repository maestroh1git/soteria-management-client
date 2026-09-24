import api from './client';
import type {
  EmployeeCompleteness,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  Loan,
  YtdTotals,
} from '@/lib/types/api';

/** Projection returned by /me/employee — not the full employee entity. */
export interface MyEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  // The person's own statutory numbers. Shown here and nowhere else in the
  // employee-facing app: a form that asks somebody for their TIN has to be
  // able to show them the one already on file.
  nin: string | null;
  bvn: string | null;
  tin: string | null;
  taxState: string | null;
  lasrraId: string | null;
  rsaPin: string | null;
  pfaName: string | null;
  nhfNumber: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinRelationship: string | null;
  joinDate: string;
  status: string;
  role: string | null;
  department: string | null;
  grade: { code: string; name: string } | null;
}

/**
 * What an employee may change about themselves.
 *
 * Mirrors the server's allowlist exactly. Anything else — bank details, name,
 * role, grade, pay — is rejected by the API rather than ignored, so sending a
 * field that is not here produces an error the person can see, not a silent
 * no-op.
 */
export interface UpdateMyDetailsDto {
  phone?: string;
  address?: string;
  nin?: string;
  bvn?: string;
  tin?: string;
  taxState?: string;
  lasrraId?: string;
  rsaPin?: string;
  pfaName?: string;
  nhfNumber?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
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

export async function updateMyDetails(
  dto: UpdateMyDetailsDto,
): Promise<MyEmployee> {
  return (await api.patch('/me/employee', dto)) as unknown as MyEmployee;
}

/** The same assessment HR sees, asked for the employee's own audience: only
 *  the gaps they can close, worded as their own business. */
export async function getMyCompleteness(): Promise<EmployeeCompleteness> {
  return (await api.get('/me/completeness')) as unknown as EmployeeCompleteness;
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

/**
 * The leave I can ask for. Not `/leave/types`: that is the leave office's
 * endpoint, and it refused everyone outside payroll — an Educator opened My
 * Leave to a 403 and could not request leave at all.
 */
export async function getMyLeaveTypes(): Promise<LeaveType[]> {
  return (await api.get('/me/leave/types')) as unknown as LeaveType[];
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
