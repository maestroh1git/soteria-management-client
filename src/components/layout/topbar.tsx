'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUIStore } from '@/stores/ui-store';

import { ModeToggle } from '@/components/common/mode-toggle';

export function Topbar() {
    const router = useRouter();
    const { fullName, initials, user, logout } = useAuth();
    const { setMobileSidebarOpen } = useUIStore();

    function handleLogout() {
        // Remove the middleware cookie
        document.cookie = 'auth-token=; path=/; max-age=0';
        logout();
        router.push('/login');
    }

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
            {/* Left: mobile menu + page context */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setMobileSidebarOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Right: notifications + user menu */}
            <div className="flex items-center gap-2">
                <ModeToggle />
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative flex items-center gap-2 pl-2 pr-3"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                                {fullName}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">{fullName}</p>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/settings')}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-red-600 dark:text-red-400"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
