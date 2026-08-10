import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveBalances,
  type CreateLeaveTypeDto,
  type UpdateLeaveTypeDto,
  type CreateLeaveRequestDto,
} from '@/lib/api/leave';

export function useLeaveTypes(includeInactive = false) {
  return useQuery({
    queryKey: ['leave-types', { includeInactive }],
    queryFn: () => getLeaveTypes(includeInactive),
  });
}

export function useLeaveRequests(filters?: {
  employeeId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['leave-requests', filters],
    queryFn: () => getLeaveRequests(filters),
  });
}

export function useLeaveBalances(employeeId: string, year?: number) {
  return useQuery({
    queryKey: ['leave-balances', employeeId, year],
    queryFn: () => getLeaveBalances(employeeId, year),
    enabled: !!employeeId,
  });
}

/**
 * Approving unpaid leave changes what payroll will deduct, so every request
 * mutation also invalidates balances and salaries — otherwise the figures on
 * screen would silently disagree with the decision just made.
 */
function useRequestMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  successMessage: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      qc.invalidateQueries({ queryKey: ['salaries'] });
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateLeaveRequest() {
  return useRequestMutation(
    (dto: CreateLeaveRequestDto) => createLeaveRequest(dto),
    'Leave requested — pending approval',
  );
}

export function useApproveLeaveRequest() {
  return useRequestMutation(
    ({ id, note }: { id: string; note?: string }) =>
      approveLeaveRequest(id, note),
    'Leave approved',
  );
}

export function useRejectLeaveRequest() {
  return useRequestMutation(
    ({ id, note }: { id: string; note?: string }) => rejectLeaveRequest(id, note),
    'Leave rejected',
  );
}

export function useCancelLeaveRequest() {
  return useRequestMutation(
    ({ id, note }: { id: string; note?: string }) => cancelLeaveRequest(id, note),
    'Leave request cancelled',
  );
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeaveTypeDto) => createLeaveType(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave type created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeaveTypeDto }) =>
      updateLeaveType(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave type updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
