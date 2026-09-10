'use client';

import Link from 'next/link';
import {
    Cake,
    CalendarDays,
    Users,
    Megaphone,
    AlarmClock,
    Palmtree,
    ArrowRight,
    type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpcomingFeed } from '@/lib/hooks/use-events';
import { useAuth } from '@/lib/hooks/use-auth';
import type { EventType, FeedItem } from '@/lib/api/events';

const MANAGE_ROLES = ['tenant_owner', 'ADMIN'];
const VISIBLE = 8;

// One visual identity per row type. Birthdays keep the amber cake the old
// widget used, so a colleague scanning the dashboard sees the same thing in a
// new place rather than something unfamiliar.
const EVENT_STYLE: Record<EventType, { icon: LucideIcon; tint: string }> = {
    GENERAL: { icon: CalendarDays, tint: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800' },
    MEETING: { icon: Users, tint: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
    HOLIDAY: { icon: Palmtree, tint: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
    DEADLINE: { icon: AlarmClock, tint: 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30' },
    ANNOUNCEMENT: { icon: Megaphone, tint: 'text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30' },
};
const BIRTHDAY_STYLE = {
    icon: Cake,
    tint: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM-DD' → 'Sep 20', parsed by parts so no timezone slips the day. */
function dayLabel(date: string): string {
    const [, mm, dd] = date.split('-').map(Number);
    if (!mm || !dd) return date;
    return `${MONTHS[mm - 1]} ${dd}`;
}

/** '14:30' → '2:30 PM'. Returns null for all-day rows. */
function timeLabel(time: string | null): string | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h)) return null;
    const period = h < 12 ? 'AM' : 'PM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function iconFor(item: FeedItem) {
    return item.kind === 'BIRTHDAY'
        ? BIRTHDAY_STYLE
        : EVENT_STYLE[item.type ?? 'GENERAL'];
}

function FeedRow({ item }: { item: FeedItem }) {
    const { icon: Icon, tint } = iconFor(item);
    const time = timeLabel(item.time);
    const meta = [item.subtitle, time].filter(Boolean).join(' · ');

    return (
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tint}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                    {item.kind === 'BIRTHDAY' ? `${item.title}’s birthday` : item.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {dayLabel(item.date)}
                    {meta ? ` · ${meta}` : ''}
                </p>
            </div>
            {item.isToday && (
                <Badge
                    variant="outline"
                    className="text-xs border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 flex-shrink-0"
                >
                    Today
                </Badge>
            )}
        </div>
    );
}

export function EventsWidget() {
    const { data: feed = [], isLoading } = useUpcomingFeed();
    const { hasRole } = useAuth();
    const canManage = hasRole(MANAGE_ROLES);

    const visible = feed.slice(0, VISIBLE);
    const hidden = feed.length - visible.length;

    return (
        <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-500" />
                    Upcoming
                </CardTitle>
                {canManage && (
                    <Link
                        href="/events"
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-0.5"
                    >
                        Manage <ArrowRight className="h-3 w-3" />
                    </Link>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                                    <div className="h-2 w-20 rounded bg-muted animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">Nothing coming up</p>
                        {canManage && (
                            <Link
                                href="/events"
                                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 mt-1 inline-block"
                            >
                                Create an event
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map((item) => (
                            <FeedRow key={item.id} item={item} />
                        ))}
                        {hidden > 0 && (
                            <p className="text-xs text-muted-foreground text-center pt-1">
                                +{hidden} more in the next 30 days
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
