/**
 * Who a bulk pay action is for, as the API resolves it: active staff only,
 * everyone or those in chosen departments, positions, or a list of people.
 */
export type StaffScope = 'ALL' | 'DEPARTMENTS' | 'POSITIONS' | 'EMPLOYEES';

export interface StaffTarget {
  scope: StaffScope;
  /** Department, position or employee ids; left out for ALL. */
  ids?: string[];
}

/** A person as a bulk preview lists them. */
export interface TargetedStaff {
  id: string;
  employeeNumber: string;
  name: string;
}
