'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterScreen } from '@/app/(dashboard)/attendance/register-screen';
import { useMyClass } from '@/lib/hooks/use-attendance';
import { todayIso } from '@/lib/utils/dates';

/**
 * A form teacher's register for one class.
 *
 * The same screen the office uses at /attendance, reached from the teacher's own
 * class and exempt from the route map like the rest of /me: the API decides who
 * may take it (the class's form teacher, or the office), so a teacher who holds
 * only the Employee role is no longer bounced away (ROADMAP-EXECUTION.md, A9).
 */
export default function MyClassRegisterPage({
    params,
}: {
    params: Promise<{ armId: string }>;
}) {
    const { armId } = use(params);
    const { data } = useMyClass(armId);
    const [date, setDate] = useState(todayIso());

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild aria-label="Back to the class">
                        <Link href={`/me/classes/${armId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">Register</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {data?.className ?? 'Your class'}
                        </p>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="my-register-day">Date</Label>
                    <Input
                        id="my-register-day"
                        type="date"
                        value={date}
                        max={todayIso()}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-44"
                    />
                </div>
            </div>

            <RegisterScreen classArmId={armId} date={date} onDateChange={setDate} />
        </div>
    );
}
