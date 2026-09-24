import { z } from 'zod';

/** The department form. Beside the feature, not in a shared validation file. */
export const departmentSchema = z.object({
  name: z.string().trim().min(1, 'Give the department a name.').max(100),
  description: z.string().trim().max(500).optional(),
  /** The member of staff who heads it (an employee id), or '' for nobody. */
  headOfDepartment: z.string().optional(),
  /** The department it sits under, or '' for the top level. */
  parentDepartmentId: z.string().optional(),
});

export type DepartmentValues = z.infer<typeof departmentSchema>;
