'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/empty-state';
import { useClassArms } from '@/lib/hooks/use-academics';
import { useMyClasses } from '@/lib/hooks/use-attendance';
import { RegisterScreen } from './register-screen';
import { todayIso } from '@/lib/utils/dates';


/**
 * Taking the register.
 *
 * A form teacher lands straight on their own class — one arm means no picker,
 * because a chooser of twelve, eleven of which they may not mark, is a step
 * that exists only because the data model was easier that way. Administrators
 * and the school office get the full list.
 */
export default function AttendancePage() {
    const {
        data: mine,
        isLoading: loadingMine,
        isError: mineFailed,
    } = useMyClasses();
    const {
        data: arms = [],
        isLoading: loadingArms,
        isError: armsFailed,
    } = useClassArms();
    const [date, setDate] = useState(todayIso());
    const [chosen, setChosen] = useState<string | null>(null);

    if (loadingMine || loadingArms) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const myArms = mine?.classes ?? [];
    const options = myArms.length
        ? myArms.map((c) => ({ id: c.classArmId, name: c.className }))
        : arms.map((a) => ({
              id: a.id,
              name: `${a.level?.name ?? ''} ${a.name}`.trim(),
          }));

    if (options.length === 0) {
        return (
            <EmptyState
                isError={mineFailed || armsFailed}
                subject="your classes"
                title="No classes to take a register for"
                description="Create a class and enrol pupils in it first."
            />
        );
    }

    // One class: straight in. More than one: choose.
    const armId = chosen ?? options[0].id;

    return (
        <div className="space-y-5">
            {options.length > 1 && (
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="arm-picker">Class</Label>
                        <Select value={armId} onValueChange={setChosen}>
                            <SelectTrigger id="arm-picker" className="w-56">
                                <SelectValue placeholder="Choose a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((o) => (
                                    <SelectItem key={o.id} value={o.id}>
                                        {o.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="register-day">Date</Label>
                        <Input
                            id="register-day"
                            type="date"
                            value={date}
                            max={todayIso()}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-44"
                        />
                    </div>
                </div>
            )}

            <RegisterScreen classArmId={armId} date={date} onDateChange={setDate} />
        </div>
    );
}
