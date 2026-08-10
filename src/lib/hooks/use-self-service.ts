import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getMyEmployee,
  getMyPayslips,
  downloadMyPayslip,
  getMyYtd,
  getMyLeaveBalances,
  getMyLeaveRequests,
  requestOwnLeave,
  cancelOwnLeave,
  getMyLoans,
  type RequestOwnLeaveDto,
} from '@/lib/api/self-service';

/**
 * `retry: false` throughout.
 *
 * The expected failures here are permanent for the session — an account with
 * no linked employee record, or a non-staff principal. Retrying three times
 * before showing the explanation just delays it.
 */
export function useMyEmployee() {
  return useQuery({
    queryKey: ['me', 'employee'],
    queryFn: getMyEmployee,
    retry: false,
  });
}

export function useMyPayslips() {
  return useQuery({
    queryKey: ['me', 'payslips'],
    queryFn: getMyPayslips,
    retry: false,
  });
}

export function useMyYtd(year?: number) {
  return useQuery({
    queryKey: ['me', 'ytd', year],
    queryFn: () => getMyYtd(year),
    retry: false,
  });
}

export function useMyLeaveBalances(year?: number) {
  return useQuery({
    queryKey: ['me', 'leave-balances', year],
    queryFn: () => getMyLeaveBalances(year),
    retry: false,
  });
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: ['me', 'leave-requests'],
    queryFn: getMyLeaveRequests,
    retry: false,
  });
}

export function useMyLoans() {
  return useQuery({
    queryKey: ['me', 'loans'],
    queryFn: getMyLoans,
    retry: false,
  });
}

export function useDownloadMyPayslip() {
  return useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName: string }) =>
      downloadMyPayslip(id, fileName),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelOwnLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelOwnLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'leave-requests'] });
      qc.invalidateQueries({ queryKey: ['me', 'leave-balances'] });
      // Removes it from the approver's queue too.
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request withdrawn');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRequestOwnLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RequestOwnLeaveDto) => requestOwnLeave(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'leave-requests'] });
      qc.invalidateQueries({ queryKey: ['me', 'leave-balances'] });
      // The approver's queue lives under a different key.
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave requested — pending approval');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
