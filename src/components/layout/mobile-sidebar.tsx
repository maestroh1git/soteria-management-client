'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useUIStore } from '@/stores/ui-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { filterNavigation } from './nav-config';
import { NavGroups } from './nav-groups';
import { useLearnerTerm } from '@/lib/hooks/use-learner-term';

export function MobileSidebar() {
    const { mayReach, tenantOrgType } = useAuth();
    const { word: learnerWord } = useLearnerTerm();
    const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

    // The same list and the same filter as the desktop rail — see nav-config.
    const filteredNavigation = filterNavigation(mayReach, tenantOrgType, learnerWord({ plural: true, capital: true }));

    return (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72">
                <SheetHeader className="px-4 pt-4 pb-2">
                    <SheetTitle className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span>Soteria Payroll</span>
                    </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 min-h-0 overflow-hidden px-3 py-4">
                    <NavGroups
                        groups={filteredNavigation}
                        onNavigate={() => setMobileSidebarOpen(false)}
                    />
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
