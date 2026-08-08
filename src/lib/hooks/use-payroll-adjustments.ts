import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAdjustments,
  createAdjustment,
  updateAdjustment,
  approveAdjustment,
  rejectAdjustment,
  deleteAdjustment,
  type CreatePayrollAdjustmentDto,
  type UpdatePayrollAdjustmentDto,
} from '@/lib/api/payroll-adjustments';

const key = (payPeriodId: string, employeeId?: string) =>
  ['payroll-adjustments', payPeriodId, employeeId ?? 'all'] as const;

export function useAdjustments(payPeriodId: string, employeeId?: string) {
  return useQuery({
    queryKey: key(payPeriodId, employeeId),
    queryFn: () => getAdjustments(payPeriodId, employeeId),
    enabled: !!payPeriodId,
  });
}

/**
 * Adjustments change what a payroll run produces, so every mutation also
 * invalidates salaries — otherwise the figures on screen would silently
 * disagree with the adjustments listed beside them.
 */
function useAdjustmentMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  successMessage: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-adjustments'] });
      qc.invalidateQueries({ queryKey: ['salaries'] });
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateAdjustment() {
  return useAdjustmentMutation(
    (dto: CreatePayrollAdjustmentDto) => createAdjustment(dto),
    'Adjustment raised — pending approval',
  );
}

export function useUpdateAdjustment() {
  return useAdjustmentMutation(
    ({ id, dto }: { id: string; dto: UpdatePayrollAdjustmentDto }) =>
      updateAdjustment(id, dto),
    'Adjustment updated',
  );
}

export function useApproveAdjustment() {
  return useAdjustmentMutation(
    (id: string) => approveAdjustment(id),
    'Adjustment approved — it will apply on the next run',
  );
}

export function useRejectAdjustment() {
  return useAdjustmentMutation(
    (id: string) => rejectAdjustment(id),
    'Adjustment rejected',
  );
}

export function useDeleteAdjustment() {
  return useAdjustmentMutation(
    (id: string) => deleteAdjustment(id),
    'Adjustment deleted',
  );
}
