/**
 * Every status the product shows, what it is called and what colour it is —
 * in one place (ROADMAP-EXECUTION.md, C3.6).
 *
 * Fourteen screens carried their own map, and they disagreed: "Pending" was
 * grey on loans, amber on KYB and a secondary badge on leave; an approved
 * expense was amber and an approved loan was the primary colour; the KYB badge
 * said "Awaiting Review" in the console and "Submitted" in Settings.
 *
 * The colours now mean one thing each, across the product:
 *
 *   neutral   nothing is happening yet, or it stopped (draft, cancelled)
 *   waiting   someone has to decide — whose move it is (submitted, pending)
 *   active    in progress or open, nothing wrong (issued, approved, scheduled)
 *   done      finished well (paid, verified, enrolled)
 *   problem   refused or went wrong (rejected, failed, defaulted)
 */

export type Tone = 'neutral' | 'waiting' | 'active' | 'done' | 'problem';

export const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  waiting: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  problem: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

type Entry = { label: string; tone: Tone };
const e = (label: string, tone: Tone): Entry => ({ label, tone });

export const STATUSES = {
  /** Anything simply switched on or off: a department, a position. */
  active: {
    ACTIVE: e('Active', 'done'),
    INACTIVE: e('Inactive', 'neutral'),
  },
  /** A login: signed in before, invited and waiting, or switched off. */
  account: {
    ACTIVE: e('Active', 'done'),
    INVITED: e('Invite sent', 'waiting'),
    INACTIVE: e('Deactivated', 'neutral'),
  },
  employee: {
    ACTIVE: e('Active', 'done'),
    INACTIVE: e('Inactive', 'neutral'),
    TERMINATED: e('Terminated', 'neutral'),
  },
  salary: {
    DRAFT: e('Draft', 'neutral'),
    APPROVED: e('Approved', 'active'),
    PAID: e('Paid', 'done'),
    CANCELLED: e('Cancelled', 'problem'),
  },
  payPeriod: {
    OPEN: e('Open', 'active'),
    PROCESSING: e('Processing', 'waiting'),
    CLOSED: e('Closed', 'done'),
  },
  loan: {
    PENDING: e('Awaiting approval', 'waiting'),
    APPROVED: e('Approved', 'active'),
    REJECTED: e('Rejected', 'problem'),
    ACTIVE: e('Active', 'active'),
    FULLY_PAID: e('Fully paid', 'done'),
    DEFAULTED: e('Defaulted', 'problem'),
    CANCELLED: e('Cancelled', 'neutral'),
  },
  leave: {
    PENDING: e('Awaiting approval', 'waiting'),
    APPROVED: e('Approved', 'done'),
    REJECTED: e('Rejected', 'problem'),
    CANCELLED: e('Cancelled', 'neutral'),
  },
  adjustment: {
    PENDING: e('Awaiting approval', 'waiting'),
    APPROVED: e('Approved', 'done'),
    REJECTED: e('Rejected', 'problem'),
  },
  payslip: {
    GENERATED: e('Generated', 'neutral'),
    SENT: e('Sent', 'active'),
    VIEWED: e('Viewed', 'done'),
    FAILED: e('Failed', 'problem'),
  },
  invoice: {
    DRAFT: e('Draft', 'neutral'),
    ISSUED: e('Issued', 'active'),
    CANCELLED: e('Cancelled', 'problem'),
  },
  receipt: {
    RECEIVED: e('Received', 'done'),
    VOIDED: e('Voided', 'problem'),
  },
  concession: {
    PENDING: e('Awaiting approval', 'waiting'),
    APPROVED: e('Approved', 'done'),
    REJECTED: e('Rejected', 'problem'),
  },
  application: {
    APPLIED: e('Applied', 'waiting'),
    ASSESSMENT_SCHEDULED: e('Assessment booked', 'active'),
    ASSESSED: e('Assessed', 'waiting'),
    OFFERED: e('Offered', 'active'),
    ACCEPTED: e('Accepted', 'done'),
    ENROLLED: e('Enrolled', 'done'),
    REJECTED: e('Rejected', 'problem'),
    WAITLISTED: e('Waitlisted', 'neutral'),
    OFFER_DECLINED: e('Offer declined', 'neutral'),
    OFFER_EXPIRED: e('Offer expired', 'neutral'),
    WITHDRAWN: e('Withdrawn', 'neutral'),
  },
  assessment: {
    SCHEDULED: e('Scheduled', 'active'),
    COMPLETED: e('Completed', 'done'),
    NO_SHOW: e('No show', 'problem'),
    CANCELLED: e('Cancelled', 'neutral'),
  },
  expense: {
    DRAFT: e('Draft', 'neutral'),
    SUBMITTED: e('Awaiting approval', 'waiting'),
    APPROVED: e('Approved, to pay', 'active'),
    PAID: e('Paid', 'done'),
    REJECTED: e('Rejected', 'problem'),
    CANCELLED: e('Cancelled', 'neutral'),
  },
  statement: {
    OPEN: e('Reconciling', 'active'),
    COMPLETED: e('Reconciled', 'done'),
  },
  kyb: {
    PENDING: e('Not submitted', 'neutral'),
    SUBMITTED: e('Awaiting review', 'waiting'),
    VERIFIED: e('Verified', 'done'),
    REJECTED: e('Rejected', 'problem'),
  },
  attendance: {
    PRESENT: e('Present', 'done'),
    LATE: e('Late', 'waiting'),
    ABSENT: e('Absent', 'problem'),
    EXCUSED: e('Excused', 'neutral'),
  },
  student: {
    ACTIVE: e('Active', 'done'),
    GRADUATED: e('Graduated', 'neutral'),
    WITHDRAWN: e('Withdrawn', 'neutral'),
    TRANSFERRED: e('Transferred', 'neutral'),
  },
} satisfies Record<string, Record<string, Entry>>;

export type StatusKind = keyof typeof STATUSES;

/** The label and tone for a status; an unknown one is spelled out, neutral. */
export function statusOf(kind: StatusKind, status: string): Entry {
  const known = (STATUSES[kind] as Record<string, Entry>)[status];
  return (
    known ??
    e(
      status
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase()),
      'neutral',
    )
  );
}

/** Every status of a kind, for a filter: `[{ value: 'PAID', label: 'Paid' }]`. */
export function statusOptions(kind: StatusKind): { value: string; label: string }[] {
  return Object.entries(STATUSES[kind] as Record<string, Entry>).map(
    ([value, { label }]) => ({ value, label }),
  );
}
