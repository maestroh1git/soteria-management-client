'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import {
    useEvents,
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
} from '@/lib/hooks/use-events';
import { EVENT_TYPES, type EventType, type OrgEvent } from '@/lib/api/events';

const TYPE_LABEL: Record<EventType, string> = {
    GENERAL: 'General',
    MEETING: 'Meeting',
    HOLIDAY: 'Holiday',
    DEADLINE: 'Deadline',
    ANNOUNCEMENT: 'Announcement',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM-DD' → 'Sep 20, 2026', parsed by parts (no timezone drift). */
function formatDate(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return date;
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function formatTime(time: string | null): string | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h)) return null;
    const period = h < 12 ? 'AM' : 'PM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

interface FormState {
    title: string;
    eventDate: string;
    startTime: string;
    location: string;
    type: EventType;
    description: string;
}

const EMPTY: FormState = {
    title: '',
    eventDate: '',
    startTime: '',
    location: '',
    type: 'GENERAL',
    description: '',
};

export default function EventsPage() {
    const { data: events = [], isLoading } = useEvents();
    const create = useCreateEvent();
    const update = useUpdateEvent();
    const remove = useDeleteEvent();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<OrgEvent | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [confirmDelete, setConfirmDelete] = useState<OrgEvent | null>(null);

    const startAdd = () => {
        setEditing(null);
        setForm(EMPTY);
        setDialogOpen(true);
    };

    const startEdit = (event: OrgEvent) => {
        setEditing(event);
        setForm({
            title: event.title,
            eventDate: event.eventDate,
            // A 'time' column can come back as 'HH:MM:SS'; the input wants 'HH:MM'.
            startTime: event.startTime ? event.startTime.slice(0, 5) : '',
            location: event.location ?? '',
            type: event.type,
            description: event.description ?? '',
        });
        setDialogOpen(true);
    };

    const complete = form.title.trim() && form.eventDate;
    const saving = create.isPending || update.isPending;

    const submit = async () => {
        if (!complete) return;
        const dto = {
            title: form.title.trim(),
            eventDate: form.eventDate,
            startTime: form.startTime || undefined,
            location: form.location.trim() || undefined,
            type: form.type,
            description: form.description.trim() || undefined,
        };
        if (editing) {
            await update.mutateAsync({ id: editing.id, dto });
        } else {
            await create.mutateAsync(dto);
        }
        setDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Events</h1>
                    <p className="text-sm text-muted-foreground">
                        What the whole organisation should see on the way in. Birthdays are
                        added automatically — create the rest here.
                    </p>
                </div>
                <Button onClick={startAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add event
                </Button>
            </div>

            {isLoading ? (
                <LoadingSkeleton rows={6} />
            ) : events.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    title="No events yet"
                    description="Create a meeting, holiday, deadline or announcement for everyone to see on the dashboard."
                />
            ) : (
                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Event</th>
                                <th className="px-4 py-3 text-left font-medium">When</th>
                                <th className="px-4 py-3 text-left font-medium">Type</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => {
                                const time = formatTime(event.startTime);
                                return (
                                    <tr key={event.id} className="border-b">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{event.title}</div>
                                            {event.location && (
                                                <div className="text-xs text-muted-foreground">
                                                    {event.location}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {formatDate(event.eventDate)}
                                            {time && (
                                                <span className="text-muted-foreground"> · {time}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary">
                                                {TYPE_LABEL[event.type]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => startEdit(event)}
                                                    aria-label="Edit event"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setConfirmDelete(event)}
                                                    aria-label="Delete event"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit event' : 'Add event'}</DialogTitle>
                        <DialogDescription>
                            Everyone in the organisation sees this on their dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g. End-of-term staff meeting"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={form.eventDate}
                                    onChange={(e) =>
                                        setForm({ ...form, eventDate: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time (optional)</Label>
                                <Input
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) =>
                                        setForm({ ...form, startTime: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) =>
                                        setForm({ ...form, type: v as EventType })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EVENT_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {TYPE_LABEL[t]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Location (optional)</Label>
                                <Input
                                    placeholder="e.g. Main hall"
                                    value={form.location}
                                    onChange={(e) =>
                                        setForm({ ...form, location: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Textarea
                                placeholder="Anything staff should know"
                                value={form.description}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submit} disabled={!complete || saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save changes' : 'Add event'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog
                open={!!confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this event?</DialogTitle>
                        <DialogDescription>
                            {confirmDelete?.title} will be removed from everyone&apos;s
                            dashboard. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={remove.isPending}
                            onClick={async () => {
                                if (!confirmDelete) return;
                                await remove.mutateAsync(confirmDelete.id);
                                setConfirmDelete(null);
                            }}
                        >
                            {remove.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
