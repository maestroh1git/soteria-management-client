/**
 * The product's words (ROADMAP-EXECUTION.md §7, docs/COPY.md). Screens that
 * name one of these things take the word from here, so it is the same on every
 * screen and changes in one place.
 */

export const TERMS = {
  /** The staff list in the sidebar; "employee" is the record. */
  staff: 'Staff',
  /** A job in the organisation. The API calls it a role (/roles). */
  position: 'Position',
  positions: 'Positions',
  /** What someone may do in the software (Admin, Approver…). */
  access: 'Access',
  /** The school's word for a teaching job; stored as `academic.teacher`. */
  educator: 'Educator',
  /** Money received for fees; the route is /fees/payments. */
  receipt: 'Receipt',
  receipts: 'Receipts',
  /** Matching the bank statement to the books (/banking). */
  bankReconciliation: 'Bank reconciliation',
  /** The banks staff are paid into (/banks). */
  bankList: 'Bank list',
  /** One period's payroll; "Payroll" is the whole area. */
  payRun: 'Pay run',
} as const;

/**
 * D7: a primary school has pupils, a secondary school students. Each school
 * says which in Setup > Organisation (tenant.settings.learnerTerm); one word per screen,
 * and "student" when unset, because it is the API's word.
 */
export type LearnerTerm = 'pupil' | 'student';

export function learnerWord(
  term: LearnerTerm,
  { plural = false, capital = false }: { plural?: boolean; capital?: boolean } = {},
): string {
  const word = plural ? `${term}s` : term;
  return capital ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}
