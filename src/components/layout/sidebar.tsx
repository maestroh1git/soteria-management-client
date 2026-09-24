'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { useBranding } from '@/lib/hooks/use-branding';
import { brandingImageUrl } from '@/lib/api/branding';
import { useUIStore } from '@/stores/ui-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { filterNavigation } from './nav-config';
import { NavGroups } from './nav-groups';
import { useLearnerTerm } from '@/lib/hooks/use-learner-term';


const ORG_TYPE_LABEL: Record<string, string> = {
    SCHOOL: 'School Payroll',
    HOSPITAL: 'Hospital Payroll',
    CORPORATE: 'Corporate Payroll',
    NGO: 'NGO Payroll',
    GOVERNMENT: 'Government Payroll',
    NONPROFIT: 'Nonprofit Payroll',
    HOSPITALITY: 'Hospitality Payroll',
    OTHER: 'Payroll System',
};

export function Sidebar() {
    const { tenantName, tenantOrgType, mayReach } = useAuth();
    const { word: learnerWord } = useLearnerTerm();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { data: branding } = useBranding();
    const logoUrl = brandingImageUrl(branding?.logoUrl);
    const brandColor = branding?.primaryColor ?? null;

    const orgSubtitle = tenantOrgType ? (ORG_TYPE_LABEL[tenantOrgType] ?? 'Payroll System') : 'Payroll System';

    const filteredNavigation = filterNavigation(mayReach, tenantOrgType, learnerWord({ plural: true, capital: true }));

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-r bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'w-[68px]' : 'w-64',
            )}
        >
            {/* Logo area */}
            <div
                className={cn(
                    'flex items-center h-16 px-4 border-b',
                    sidebarCollapsed ? 'justify-center' : 'gap-3',
                )}
            >
                {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={logoUrl}
                        alt={tenantName ?? 'Logo'}
                        className="flex-shrink-0 h-9 w-9 rounded-xl object-contain bg-white"
                    />
                ) : (
                    <div
                        className={cn(
                            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
                            !brandColor &&
                                'bg-gradient-to-br from-blue-600 to-indigo-600',
                        )}
                        style={brandColor ? { backgroundColor: brandColor } : undefined}
                    >
                        <span className="text-white font-bold text-sm">
                            {(tenantName?.[0] ?? 'S').toUpperCase()}
                        </span>
                    </div>
                )}
                {!sidebarCollapsed && (
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{tenantName}</p>
                        <p className="text-xs text-muted-foreground">{orgSubtitle}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 min-h-0 overflow-hidden px-3 py-4">
                <NavGroups groups={filteredNavigation} rail={sidebarCollapsed} />
            </ScrollArea>

            {/* Collapse toggle */}
            <div className="border-t p-3">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
