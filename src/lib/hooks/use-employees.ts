import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getBankDetails,
  addBankDetails,
  updateBankDetails,
  deleteBankDetails,
  getEmployeeSalaryComponents,
  addEmployeeSalaryComponent,
  updateEmployeeSalaryComponent,
  deactivateEmployeeSalaryComponent,
  getBirthdaysThisMonth,
  getEmployeeCompleteness,
  getCompletenessSummary,
  getTaxStates,
  type CreateEmployeeDto,
  type UpdateEmployeeDto,
  type CreateBankDetailsDto,
  type EmployeeSalaryComponentDto,
} from '@/lib/api/employees';
import { toast } from 'sonner';

// ── Employee list & detail ──────────────────────────────────
export function useEmployees(
  filters?: {
    status?: string;
    roleId?: string;
    search?: string;
  },
  /** Off for anyone who may not read the staff list, so it never 403s. */
  enabled = true,
) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => getEmployees(filters),
    enabled,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
}

// ── Record completeness ─────────────────────────────────────
/**
 * What one record is still missing. Separate from useEmployee so the panel
 * refreshes on its own after an edit without refetching the whole employee,
 * and so a 403 on it never blanks the profile page.
 */
export function useEmployeeCompleteness(id: string, enabled = true) {
  return useQuery({
    queryKey: ['employees', id, 'completeness'],
    queryFn: () => getEmployeeCompleteness(id),
    enabled: !!id && enabled,
  });
}

/** The same assessment across the organisation — what an owner sees. */
export function useCompletenessSummary(enabled = true) {
  return useQuery({
    queryKey: ['employees', 'completeness', 'summary'],
    queryFn: getCompletenessSummary,
    enabled,
  });
}

/** States PAYE can be remitted to. Static reference data: cached for the session. */
export function useTaxStates() {
  return useQuery({
    queryKey: ['reference', 'tax-states'],
    queryFn: getTaxStates,
    staleTime: Infinity,
  });
}

/**
 * Anything that changes a bank account or a salary line changes what the
 * record is missing — an account arriving clears a CRITICAL gap, and a pension
 * deduction being assigned creates one. Without this the panel keeps showing
 * the problem the user just fixed, which is how people learn to distrust it.
 */
function invalidateCompleteness(
  qc: ReturnType<typeof useQueryClient>,
  employeeId: string,
) {
  qc.invalidateQueries({ queryKey: ['employees', employeeId, 'completeness'] });
  qc.invalidateQueries({ queryKey: ['employees', 'completeness', 'summary'] });
}

// ── Employee mutations ──────────────────────────────────────
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEmployeeDto) => createEmployee(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeDto }) =>
      updateEmployee(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee');
    },
  });
}

// ── Bank details ────────────────────────────────────────────
// `enabled` lets callers skip the request for roles the backend forbids
// (VIEWER is 403 on bank-details, S13) to avoid a guaranteed error.
export function useBankDetails(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: ['employees', employeeId, 'bank-details'],
    queryFn: () => getBankDetails(employeeId),
    enabled: !!employeeId && enabled,
  });
}

export function useAddBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBankDetailsDto) => addBankDetails(dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['employees', variables.employeeId, 'bank-details'] });
      invalidateCompleteness(qc, variables.employeeId);
      toast.success('Bank details added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add bank details');
    },
  });
}

export function useUpdateBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      employeeId: string;
      dto: Partial<CreateBankDetailsDto>;
    }) => updateBankDetails(id, dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['employees', variables.employeeId, 'bank-details'] });
      invalidateCompleteness(qc, variables.employeeId);
      toast.success('Bank details updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update bank details');
    },
  });
}

export function useDeleteBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; employeeId: string }) =>
      deleteBankDetails(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['employees', variables.employeeId, 'bank-details'] });
      invalidateCompleteness(qc, variables.employeeId);
      toast.success('Bank details removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete bank details');
    },
  });
}

// ── Employee salary components ──────────────────────────────
// `enabled` lets callers skip the request for roles the backend forbids
// (VIEWER is 403 on salary-components, S13).
export function useEmployeeSalaryComponents(
  employeeId: string,
  includeInactive?: boolean,
  enabled = true,
) {
  return useQuery({
    queryKey: ['employees', employeeId, 'salary-components', { includeInactive }],
    queryFn: () => getEmployeeSalaryComponents(employeeId, includeInactive),
    enabled: !!employeeId && enabled,
  });
}

export function useAddEmployeeSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: EmployeeSalaryComponentDto) => addEmployeeSalaryComponent(dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['employees', variables.employeeId, 'salary-components'],
      });
      invalidateCompleteness(qc, variables.employeeId);
      toast.success('Salary component assigned');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign salary component');
    },
  });
}

export function useUpdateEmployeeSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      employeeId: string;
      dto: Partial<EmployeeSalaryComponentDto>;
    }) => updateEmployeeSalaryComponent(id, dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['employees', variables.employeeId, 'salary-components'],
      });
      invalidateCompleteness(qc, variables.employeeId);
      toast.success('Salary component updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update salary component');
    },
  });
}

export function useDeactivateEmployeeSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, effectiveDate }: { id: string; employeeId: string; effectiveDate: string }) =>
      deactivateEmployeeSalaryComponent(id, effectiveDate),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['employees', variables.employeeId, 'salary-components'],
      });
      invalidateCompleteness(qc, variables.employeeId);
      toast.success('Salary component deactivated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate salary component');
    },
  });
}

// ── Birthday queries ────────────────────────────────────────
export function useBirthdaysThisMonth() {
  return useQuery({
    queryKey: ['employees', 'birthdays', 'this-month'],
    queryFn: getBirthdaysThisMonth,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
