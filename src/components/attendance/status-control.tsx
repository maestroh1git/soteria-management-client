'use client';

import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/api/attendance';

const OPTIONS: Array<{
    value: AttendanceStatus;
    letter: string;
    label: string;
}> = [
    { value: 'PRESENT', letter: 'P', label: 'Present' },
    { value: 'LATE', letter: 'L', label: 'Late' },
    { value: 'ABSENT', letter: 'A', label: 'Away' },
    { value: 'EXCUSED', letter: 'E', label: 'Excused' },
];

/** Colour is never the only signal — every state carries its letter too. */
const SELECTED: Record<AttendanceStatus, string> = {
    PRESENT:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    LATE: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    ABSENT: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    EXCUSED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
};

interface Props {
    /** Names the pupil, not the position — see below. */
    pupilName: string;
    name: string;
    value: AttendanceStatus | null;
    onChange: (status: AttendanceStatus) => void;
    disabled?: boolean;
}

/**
 * A four-way segmented control that is really a radio group.
 *
 * Four buttons would look identical and announce "P". A register renders this
 * forty times, which makes it the easiest place in the app to lose the
 * zero-unlabelled-controls the platform reached — so the fieldset is labelled
 * with the pupil's name and a screen reader says "Okonkwo, Adaeze, attendance,
 * Present, 1 of 4".
 */
export function AttendanceStatusControl({
    pupilName,
    name,
    value,
    onChange,
    disabled,
}: Props) {
    return (
        <fieldset
            className="flex-none"
            disabled={disabled}
            aria-describedby={undefined}
        >
            <legend className="sr-only">{pupilName} — attendance</legend>
            <div className="flex overflow-hidden rounded-lg border border-input bg-background">
                {OPTIONS.map((opt, i) => {
                    const id = `${name}-${opt.value}`;
                    const selected = value === opt.value;
                    return (
                        <div key={opt.value} className="contents">
                            <input
                                type="radio"
                                id={id}
                                name={name}
                                value={opt.value}
                                checked={selected}
                                onChange={() => onChange(opt.value)}
                                className="peer sr-only"
                            />
                            <label
                                htmlFor={id}
                                title={opt.label}
                                className={cn(
                                    'grid h-11 w-11 cursor-pointer place-items-center text-sm font-semibold',
                                    'text-muted-foreground transition-colors select-none',
                                    'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
                                    'hover:bg-accent',
                                    i > 0 && 'border-l border-input',
                                    selected && SELECTED[opt.value],
                                    disabled && 'cursor-not-allowed opacity-50',
                                )}
                            >
                                <span aria-hidden="true">{opt.letter}</span>
                                <span className="sr-only">{opt.label}</span>
                            </label>
                        </div>
                    );
                })}
            </div>
        </fieldset>
    );
}

export { OPTIONS as ATTENDANCE_OPTIONS };
