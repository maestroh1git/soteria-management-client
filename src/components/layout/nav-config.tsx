import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  School,
  BadgeDollarSign,
  ReceiptText,
  HandCoins,
  TrendingDown,
  Landmark,
  Scale,
  PiggyBank,
  Briefcase,
  Building2,
  Layers,
  CalendarDays,
  CalendarClock,
  Wallet,
  Calculator,
  CreditCard,
  Receipt,
  FileText,
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
  Percent,
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
    label: "My Account",
    items: [
      // A form teacher's landing page. Beside My Pay rather than in the
      // admin sidebar: before this, a teacher signing in got the payroll
      // dashboard, which is nobody's idea of a teacher's home page.
      //
      // Deliberately ungated, like the rest of this group. Being an
      // Educator is a job role on the employee record and does not grant
      // the `academic.teacher` system role, so gating on that hid a
      // teacher's own class from them until somebody remembered a second,
      // invisible step. The page resolves from the account and says
      // plainly when you are not a form teacher.
      {
        title: "My Classes",
        href: "/me/classes",
        icon: Presentation,
        orgTypes: ["SCHOOL"],
      },
      { title: "My Pay", href: "/me", icon: Banknote },
      { title: "My Leave", href: "/me/leave", icon: TreePalm },
      { title: "My Profile", href: "/me/profile", icon: UserCircle },
    ],
  },
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "School",
    items: [
      {
        title: "Students",
    // "Pupils" in a school that says so (D7); see filterNavigation.
    learnerTerm: true,
        href: "/students",
        icon: GraduationCap,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Admissions",
        href: "/admissions",
        icon: ClipboardList,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Question Sets",
        href: "/admissions/question-sets",
        icon: ListChecks,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Classes",
        href: "/classes",
        icon: School,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Register",
        href: "/attendance",
        icon: CalendarCheck,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "The Gate",
        href: "/attendance/gate",
        icon: DoorOpen,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Follow Up",
        href: "/attendance/at-risk",
        icon: AlertTriangle,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Awards",
        href: "/awards",
        icon: Trophy,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "School Calendar",
        href: "/attendance/calendar",
        icon: CalendarRange,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Fees",
        href: "/fees",
        icon: BadgeDollarSign,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Invoices",
        href: "/fees/invoices",
        icon: ReceiptText,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Receipts",
        href: "/fees/payments",
        icon: HandCoins,
        orgTypes: ["SCHOOL"],
      },
      {
        title: "Arrears",
        href: "/fees/arrears",
        icon: TrendingDown,
        orgTypes: ["SCHOOL"],
      },
    ],
  },
  {
    label: "Staff",
    items: [
      { title: "Employees", href: "/employees", icon: Users },
      { title: "Positions", href: "/roles", icon: Briefcase },
      { title: "Departments", href: "/departments", icon: Building2 },
      { title: "Grades", href: "/grades", icon: Layers },
      { title: "Leave", href: "/leave", icon: CalendarDays },
      { title: "Events", href: "/events", icon: CalendarClock },
      {
        title: "Salary Components",
        href: "/salary-components",
        icon: CreditCard,
      },
      { title: "Bank list", href: "/banks", icon: Landmark },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payroll", href: "/payroll", icon: Calculator },
      { title: "Ledger", href: "/ledger", icon: Scale },
      { title: "Expenses", href: "/expenses", icon: Wallet },
      { title: "Budgets", href: "/budgets", icon: PiggyBank },
      { title: "Bank reconciliation", href: "/banking", icon: ArrowLeftRight },
      { title: "Loans", href: "/loans", icon: Receipt },
      { title: "Tax Rules", href: "/tax-rules", icon: Percent },
    ],
  },
  {
    label: "Reporting",
    items: [
      { title: "Payslips", href: "/payslips", icon: FileText },
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Audit Logs", href: "/audit-logs", icon: Shield },
    ],
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
