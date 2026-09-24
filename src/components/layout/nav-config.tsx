import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  School,
  BadgeDollarSign,
  Scale,
  PiggyBank,
  CalendarDays,
  Wallet,
  Calculator,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  UserCircle,
  CalendarCheck,
  DoorOpen,
  CalendarRange,
  AlertTriangle,
  Trophy,
  ListChecks,
  type LucideIcon,
  Presentation,
  Banknote,
  TreePalm,
  ArrowLeftRight,
  Inbox,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /**
   * Organisation types this belongs to. Absent means every tenant.
   *
   * Students and Admissions do not apply to a hospital, and showing them
   * there would tell a hospital administrator the product was not built for
   * them.
   */
  orgTypes?: string[];
  /** Titled with the school's word for its learners (lib/copy/glossary). */
  learnerTerm?: boolean;
  /** Show a live count beside the title. */
  count?: "approvals";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The single source of truth for the sidebar, used by both the desktop rail and
 * the mobile drawer. It used to be defined twice — the mobile copy drifted, lost
 * "My Account" entirely, and so a plain employee (who matches none of the admin
 * roles) opened the menu to nothing but Dashboard. One list, filtered the same
 * way in both places, is what stops that happening again.
 */
export const navigation: NavGroup[] = [
  {
    // Deliberately unrestricted. Everyone with an account is also an
    // employee, including administrators, and the API resolves the subject
    // from the token — there is nothing here to gate.
    label: "Me",
    items: [
      // A form teacher's landing page. Ungated like the rest of this group:
      // being an Educator is a job on the employee record, not the
      // `academic.teacher` access, and gating on that hid a teacher's own
      // class from them. The page says plainly when you have no class.
      { title: "My Classes", href: "/me/classes", icon: Presentation, orgTypes: ["SCHOOL"] },
      { title: "My Pay", href: "/me", icon: Banknote },
      { title: "My Leave", href: "/me/leave", icon: TreePalm },
      { title: "My Profile", href: "/me/profile", icon: UserCircle },
    ],
  },
  {
    label: "Home",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      // One queue for every decision (C4.9), with how many wait on you.
      { title: "Approvals", href: "/approvals", icon: Inbox, count: "approvals" },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Staff", href: "/employees", icon: Users },
      {
        title: "Students",
        // "Pupils" in a school that says so (D7); see filterNavigation.
        learnerTerm: true,
        href: "/students",
        icon: GraduationCap,
        orgTypes: ["SCHOOL"],
      },
    ],
  },
  {
    label: "Admissions",
    items: [
      { title: "Applications", href: "/admissions", icon: ClipboardList, orgTypes: ["SCHOOL"] },
      { title: "Question sets", href: "/admissions/question-sets", icon: ListChecks, orgTypes: ["SCHOOL"] },
    ],
  },
  {
    label: "School day",
    items: [
      { title: "Classes", href: "/classes", icon: School, orgTypes: ["SCHOOL"] },
      { title: "Register", href: "/attendance", icon: CalendarCheck, orgTypes: ["SCHOOL"] },
      { title: "The Gate", href: "/attendance/gate", icon: DoorOpen, orgTypes: ["SCHOOL"] },
      { title: "Follow up", href: "/attendance/at-risk", icon: AlertTriangle, orgTypes: ["SCHOOL"] },
      { title: "Awards", href: "/awards", icon: Trophy, orgTypes: ["SCHOOL"] },
      { title: "School calendar", href: "/attendance/calendar", icon: CalendarRange, orgTypes: ["SCHOOL"] },
    ],
  },
  {
    label: "Pay",
    items: [
      // Salaries, adjustments, payslips, the bank file, the ledger check and
      // the variance are tabs of each run now (C4.6).
      { title: "Pay runs", href: "/payroll", icon: Calculator },
      { title: "Loans & advances", href: "/loans", icon: Receipt },
      { title: "Leave", href: "/leave", icon: CalendarDays },
    ],
  },
  {
    label: "Money",
    items: [
      // Prices, invoices, receipts, concessions, optional fees and arrears
      // are tabs of one hub now (C4.7).
      { title: "Fees", href: "/fees", icon: BadgeDollarSign, orgTypes: ["SCHOOL"] },
      { title: "Expenses", href: "/expenses", icon: Wallet },
      { title: "Budgets", href: "/budgets", icon: PiggyBank },
      { title: "Bank reconciliation", href: "/banking", icon: ArrowLeftRight },
      { title: "Ledger", href: "/ledger", icon: Scale },
    ],
  },
  {
    label: "Insight",
    items: [
      { title: "Reports", href: "/reports", icon: BarChart3 },
      { title: "Audit log", href: "/audit-logs", icon: Shield },
    ],
  },
  {
    // One door to everything that is set once and changed rarely: the
    // organisation, its structure, pay rules and the school year. Eight
    // sidebar entries became one (ROADMAP-EXECUTION.md, C4.1–C4.2).
    label: "Setup",
    items: [{ title: "Setup", href: "/setup", icon: Settings }],
  },
];

/** The filter both sidebars share: role gate, then org-type gate (fail closed). */
export function filterNavigation(
  mayReach: (href: string) => boolean,
  tenantOrgType: string | null,
  learners = "Students",
): NavGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => (item.learnerTerm ? { ...item, title: learners } : item))
        .filter(
        (item) =>
          // Roles come from ROUTE_ROLES, the same map the middleware
          // reads. Two copies drifted into 15 sidebar routes the
          // middleware had never heard of.
          mayReach(item.href) &&
          (!item.orgTypes ||
            (tenantOrgType !== null && item.orgTypes.includes(tenantOrgType))),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * The sidebar entry a path lives under — the longest href that is a prefix of
 * it. Breadcrumbs start here, so a record's trail names the section the way
 * the sidebar does.
 */
export function sectionFor(pathname: string): NavItem | null {
  let best: NavItem | null = null;
  for (const group of navigation) {
    for (const item of group.items) {
      const match =
        pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(item.href + "/"));
      if (match && (!best || item.href.length > best.href.length)) best = item;
    }
  }
  return best;
}
