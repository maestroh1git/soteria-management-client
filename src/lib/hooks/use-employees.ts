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
  type CreateEmployeeDto,
  type UpdateEmployeeDto,
  type CreateBankDetailsDto,
  type EmployeeSalaryComponentDto,
} from '@/lib/api/employees';
import { toast } from 'sonner';

// ── Employee list & detail ──────────────────────────────────
export function useEmployees(filters?: {
  status?: string;
  roleId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => getEmployees(filters),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
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
export function useBankDetails(employeeId: string) {
  return useQuery({
    queryKey: ['employees', employeeId, 'bank-details'],
    queryFn: () => getBankDetails(employeeId),
    enabled: !!employeeId,
  });
}

export function useAddBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBankDetailsDto) => addBankDetails(dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['employees', variables.employeeId, 'bank-details'] });
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
      toast.success('Bank details removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete bank details');
    },
  });
}

// ── Employee salary components ──────────────────────────────
export function useEmployeeSalaryComponents(employeeId: string, includeInactive?: boolean) {
  return useQuery({
    queryKey: ['employees', employeeId, 'salary-components', { includeInactive }],
    queryFn: () => getEmployeeSalaryComponents(employeeId, includeInactive),
    enabled: !!employeeId,
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
      toast.success('Salary component deactivated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate salary component');
    },
  });
}
