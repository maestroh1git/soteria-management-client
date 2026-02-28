'use client';

import { Cake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBirthdaysThisMonth } from '@/lib/hooks/use-employees';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function AvatarInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{initials}</span>
    </div>
  );
}

export function BirthdaysWidget() {
  const { data: employees = [], isLoading } = useBirthdaysThisMonth();

  const todayBirthdays = employees.filter((e) => e.isToday);
  const upcomingBirthdays = employees.filter((e) => !e.isToday);
  const sorted = [...todayBirthdays, ...upcomingBirthdays];
  const visible = sorted.slice(0, 8);
  const hasMore = sorted.length > 8;

  const currentMonth = new Date().getMonth();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cake className="h-4 w-4 text-amber-500" />
          Birthdays This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                  <div className="h-2 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No birthdays this month
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((employee) => {
              const dob = new Date(employee.dateOfBirth);
              const dateLabel = `${MONTH_NAMES[currentMonth]} ${employee.dayOfBirth}`;

              return (
                <div key={employee.id} className="flex items-center gap-3">
                  <AvatarInitials
                    firstName={employee.firstName}
                    lastName={employee.lastName}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {employee.roleName ?? 'Employee'} · {dateLabel}
                    </p>
                  </div>
                  {employee.isToday && (
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 flex-shrink-0"
                    >
                      Today
                    </Badge>
                  )}
                </div>
              );
            })}
            {hasMore && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{sorted.length - 8} more this month
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
