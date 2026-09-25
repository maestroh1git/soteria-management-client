import api from './client';

export type ContactChannel = 'CALL' | 'MESSAGE' | 'MEETING' | 'VISIT' | 'OTHER';

export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
    CALL: 'Phone call',
    MESSAGE: 'Message',
    MEETING: 'Meeting at school',
    VISIT: 'Home visit',
    OTHER: 'Other',
};

/** One contact with a pupil's family (ROADMAP-EXECUTION.md, 5.5). */
export interface StudentContact {
    id: string;
    contactedAt: string;
    channel: ContactChannel;
    withWhom: string | null;
    /** False for "no answer": someone should try again. */
    reached: boolean;
    note: string;
    recordedByName: string | null;
}

export interface LogContactInput {
    studentId: string;
    channel: ContactChannel;
    withWhom?: string;
    reached: boolean;
    note: string;
    /** ISO; now if left out. */
    contactedAt?: string;
}

export async function getStudentContacts(studentId: string): Promise<StudentContact[]> {
    return (await api.get(`/students/${studentId}/contacts`)) as unknown as StudentContact[];
}

export async function logStudentContact({ studentId, ...body }: LogContactInput) {
    return (await api.post(`/students/${studentId}/contacts`, body)) as unknown as StudentContact;
}
