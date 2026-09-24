import {
  Hourglass,
  KeyRound,
  Briefcase,
  Building,
  Building2,
  CalendarClock,
  CalendarRange,
  CreditCard,
  Landmark,
  Layers,
  Percent,
  School,
  type LucideIcon,
} from 'lucide-react';

/**
 * What lives under Setup (ROADMAP-EXECUTION.md, C4.2): everything set once
 * and changed rarely. Each entry is a page with its own route and its own
 * entry in the route manifest; the hub shows the ones this person may open.
 */
export interface SetupLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  orgTypes?: string[];
}

export interface SetupSection {
  title: string;
  links: SetupLink[];
}

export const SETUP_SECTIONS: SetupSection[] = [
  {
    title: 'Organisation',
    links: [
      {
        title: 'Organisation',
        description: 'Profile, compliance numbers, branding and shared reference data.',
        href: '/setup/organisation',
        icon: Building,
      },
      {
        title: 'Team & access',
        description: 'Who can sign in, what each may do, and invites still waiting.',
        href: '/setup/team',
        icon: KeyRound,
      },
      {
        title: 'Events',
        description: 'What the whole organisation sees on the dashboard. Birthdays add themselves.',
        href: '/setup/events',
        icon: CalendarClock,
      },
    ],
  },
  {
    title: 'Structure',
    links: [
      {
        title: 'Departments',
        description: 'The units staff belong to, who heads each, and what sits under what.',
        href: '/setup/departments',
        icon: Building2,
      },
      {
        title: 'Positions',
        description: 'The jobs people are hired into, and who reports to whom.',
        href: '/setup/positions',
        icon: Briefcase,
      },
      {
        title: 'Grades',
        description: 'Pay bands; exemptions and contributions are set per grade.',
        href: '/setup/grades',
        icon: Layers,
      },
    ],
  },
  {
    title: 'Pay rules',
    links: [
      {
        title: 'Salary components',
        description: 'Earnings and deductions, and who each applies to.',
        href: '/setup/salary-components',
        icon: CreditCard,
      },
      {
        title: 'Tax rules',
        description: 'The flat-rate and progressive rules the pay run applies.',
        href: '/setup/tax-rules',
        icon: Percent,
      },
      {
        title: 'Bank list',
        description: 'The banks staff are paid into, and their codes.',
        href: '/setup/bank-list',
        icon: Landmark,
      },
    ],
  },
  {
    title: 'School year',
    links: [
      {
        title: 'Sessions & terms',
        description: 'The academic calendar everything else is counted in.',
        href: '/classes?tab=session',
        icon: Hourglass,
        orgTypes: ['SCHOOL'],
      },
      {
        title: 'Classes',
        description: 'Levels, arms, capacity and each class’s form teacher.',
        href: '/classes',
        icon: School,
        orgTypes: ['SCHOOL'],
      },
      {
        title: 'School calendar',
        description: 'Teaching days, holidays and closures for the register.',
        href: '/attendance/calendar',
        icon: CalendarRange,
        orgTypes: ['SCHOOL'],
      },
    ],
  },
];
