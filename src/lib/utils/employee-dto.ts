import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '@/lib/api/employees';
import type { CreateEmployeeValues } from '@/lib/utils/validation';

/**
 * Form values → API payload, in one place for both the create and the edit
 * page.
 *
 * It lives here because the two pages used to build the payload independently,
 * each listing the fields by hand. That is a silent failure waiting to happen:
 * a field added to the form reaches the create page, the edit page keeps its
 * own older list, and editing an employee quietly drops whatever the newer
 * field held. With thirteen statutory and next-of-kin fields added at once,
 * "quietly drops" would have meant losing somebody's RSA PIN on an unrelated
 * edit.
 *
 * The two branches genuinely differ, and that is the whole reason this takes a
 * mode rather than being one function:
 *
 *   create — a blank optional field is omitted. The server then applies its own
 *            default, and in the case of employeeNumber allocates the next one
 *            in the tenant's sequence, which sending '' would prevent.
 *   update — a blank optional field is sent as null, which clears it. Omitting
 *            it would mean "leave as it was", so a TIN typed in error could
 *            never be removed. Required fields are never nulled.
 */

/** Optional fields that may be cleared back to empty on an edit. */
const CLEARABLE = [
  'middleName',
  'address',
  'nin',
  'bvn',
  'tin',
  'taxState',
  'lasrraId',
  'rsaPin',
  'pfaName',
  'nhfNumber',
  'employmentType',
  'contractEndDate',
  'nextOfKinName',
  'nextOfKinPhone',
  'nextOfKinRelationship',
  'gradeId',
  'countryId',
] as const satisfies readonly (keyof CreateEmployeeValues)[];

const trimmed = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const clean = value.trim();
  return clean === '' ? undefined : clean;
};

export function toCreateEmployeeDto(
  values: CreateEmployeeValues,
): CreateEmployeeDto {
  const dto: CreateEmployeeDto = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    joinDate: values.joinDate,
    roleId: values.roleId,
    // Omitted rather than '' so the server allocates the next number in the
    // tenant's sequence.
    employeeNumber: trimmed(values.employeeNumber),
  };

  const writable = dto as unknown as Record<string, unknown>;
  for (const field of CLEARABLE) {
    const value = trimmed(values[field]);
    if (value !== undefined) writable[field] = value;
  }

  return dto;
}

export function toUpdateEmployeeDto(
  values: CreateEmployeeValues,
): UpdateEmployeeDto {
  // employeeNumber is fixed once assigned and the server's update DTO omits it.
  const dto: UpdateEmployeeDto = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    joinDate: values.joinDate,
    roleId: values.roleId,
  };

  const writable = dto as unknown as Record<string, unknown>;
  for (const field of CLEARABLE) {
    // null, not undefined: emptying a field the user has just cleared has to
    // reach the server as an instruction, not as an absence.
    writable[field] = trimmed(values[field]) ?? null;
  }

  // Exit fields. A record with no termination date is an employee who has not
  // left, so the reason and last working day are cleared with it rather than
  // being left behind pointing at nothing.
  const terminationDate = trimmed(values.terminationDate);
  dto.terminationDate = terminationDate ?? null;
  dto.terminationReason = terminationDate
    ? (trimmed(values.terminationReason) ?? null)
    : null;
  dto.lastWorkingDay = terminationDate
    ? (trimmed(values.lastWorkingDay) ?? null)
    : null;

  if (values.status) dto.status = values.status;

  return dto;
}
