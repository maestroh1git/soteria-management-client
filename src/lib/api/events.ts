import api from './client';

export const EVENT_TYPES = [
    'GENERAL',
    'MEETING',
    'HOLIDAY',
    'DEADLINE',
    'ANNOUNCEMENT',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** An authored event — a row in the events table. */
export interface OrgEvent {
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
    startTime: string | null;
    location: string | null;
    type: EventType;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * One row of the dashboard's upcoming feed: an authored event OR a birthday
 * derived from an employee record. `kind` tells them apart; `editable` is true
 * only for authored events (birthdays are computed, not stored).
 */
export interface FeedItem {
    id: string;
    kind: 'EVENT' | 'BIRTHDAY';
    title: string;
    subtitle: string | null;
    date: string;
    time: string | null;
    type: EventType | null;
    isToday: boolean;
    editable: boolean;
}

export interface CreateEventDto {
    title: string;
    description?: string;
    eventDate: string;
    startTime?: string;
    location?: string;
    type?: EventType;
}

export type UpdateEventDto = Partial<CreateEventDto>;

export async function getUpcomingFeed(days?: number): Promise<FeedItem[]> {
    const q = days ? `?days=${days}` : '';
    return (await api.get(`/events/upcoming${q}`)) as unknown as FeedItem[];
}

export async function getEvents(): Promise<OrgEvent[]> {
    return (await api.get('/events')) as unknown as OrgEvent[];
}

export async function createEvent(dto: CreateEventDto): Promise<OrgEvent> {
    return (await api.post('/events', dto)) as unknown as OrgEvent;
}

export async function updateEvent(
    id: string,
    dto: UpdateEventDto,
): Promise<OrgEvent> {
    return (await api.patch(`/events/${id}`, dto)) as unknown as OrgEvent;
}

export async function deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
}
