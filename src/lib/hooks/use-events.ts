import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getUpcomingFeed,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    type CreateEventDto,
    type UpdateEventDto,
} from '../api/events';

/**
 * The dashboard's upcoming feed — authored events merged with derived
 * birthdays. Refetched on a modest interval so the "Today" markers roll over
 * without a reload, and invalidated whenever an event is authored.
 */
export function useUpcomingFeed(days?: number) {
    return useQuery({
        queryKey: ['events', 'upcoming', days ?? 'default'],
        queryFn: () => getUpcomingFeed(days),
        staleTime: 5 * 60 * 1000,
    });
}

/** Authored events only — the management screen. */
export function useEvents() {
    return useQuery({
        queryKey: ['events', 'all'],
        queryFn: getEvents,
    });
}

function useInvalidateEvents() {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: ['events'] });
}

export function useCreateEvent() {
    const invalidate = useInvalidateEvents();
    return useMutation({
        mutationFn: (dto: CreateEventDto) => createEvent(dto),
        onSuccess: () => {
            invalidate();
            toast.success('Event created');
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to create event'),
    });
}

export function useUpdateEvent() {
    const invalidate = useInvalidateEvents();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateEventDto }) =>
            updateEvent(id, dto),
        onSuccess: () => {
            invalidate();
            toast.success('Event updated');
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to update event'),
    });
}

export function useDeleteEvent() {
    const invalidate = useInvalidateEvents();
    return useMutation({
        mutationFn: (id: string) => deleteEvent(id),
        onSuccess: () => {
            invalidate();
            toast.success('Event deleted');
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to delete event'),
    });
}
