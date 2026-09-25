'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDownloadAttendance } from '@/lib/hooks/use-attendance';
import { shiftDate, todayIso } from '@/lib/utils/dates';

const ALL = '__all__';

/**
 * The register as a spreadsheet, for the office (ROADMAP-EXECUTION.md, 5.7):
 * any range, the whole school or one class. Current marks only; corrections
 * replace what they corrected.
 */
export function AttendanceExport({ classes }: { classes: Array<{ id: string; name: string }> }) {
    const [from, setFrom] = useState(shiftDate(todayIso(), -6));
    const [to, setTo] = useState(todayIso());
    const [armId, setArmId] = useState(ALL);
    const download = useDownloadAttendance();
    const chosen = classes.find((c) => c.id === armId);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Download the register</CardTitle>
                <CardDescription>As CSV, for any dates, the whole school or one class.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="export-from">From</Label>
                    <Input id="export-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-44" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="export-to">To</Label>
                    <Input id="export-to" type="date" value={to} min={from} max={todayIso()} onChange={(e) => setTo(e.target.value)} className="w-44" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="export-class">Class</Label>
                    <Select value={armId} onValueChange={setArmId}>
                        <SelectTrigger id="export-class" className="w-56">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>The whole school</SelectItem>
                            {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    disabled={download.isPending || !from || !to || from > to}
                    onClick={() =>
                        download.mutate({
                            from,
                            to,
                            classArmId: chosen?.id,
                            label: chosen?.name ?? 'attendance',
                        })
                    }
                >
                    <Download className="mr-2 h-4 w-4" /> Download CSV
                </Button>
            </CardContent>
        </Card>
    );
}
