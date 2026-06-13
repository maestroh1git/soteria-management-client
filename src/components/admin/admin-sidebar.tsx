'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Exact-match only (don't highlight for nested routes). */
  exact?: boolean;
}

const NAV: NavItem[] = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Tenants', href: '/admin/tenants', icon: Building2 },
  { title: 'KYB Review', href: '/admin/kyb', icon: ShieldCheck },
  { title: 'Audit Log', href: '/admin/audit', icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b',
          sidebarCollapsed ? 'justify-center' : 'gap-3',
        )}
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Platform Admin</p>
            <p className="text-xs text-muted-foreground">Super-Admin Console</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden px-3 py-4">
        <nav className="space-y-1">
          {NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900',
                  sidebarCollapsed && 'justify-center px-2',
                )}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t p-3">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full rounded-lg py-2 text-sm text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
