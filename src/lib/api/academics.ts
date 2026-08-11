import api from './client';

export interface ClassLevel {
    id: string;
    name: string;
    code: string | null;
    sortOrder: number;
    active?: boolean;
}

export interface ClassArm {
    id: string;
    name: string;
    capacity: number | null;
    levelId: string;
    formTeacherId: string | null;
    level?: ClassLevel;
}

export interface AcademicSession {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
}

export interface AcademicTerm {
    id: string;
    sessionId: string;
    name: string;
    startDate: string;
    endDate: string;
    sortOrder: number;
    isCurrent: boolean;
}

/** Seats taken and seats left. A snapshot, not a reservation. */
export interface ArmOccupancy {
    capacity: number | null;
    enrolled: number;
    free: number | null;
}

// ── Sessions and terms ──────────────────────────────────────────────────────

export async function getSessions(): Promise<AcademicSession[]> {
    return (await api.get('/academics/sessions')) as unknown as AcademicSession[];
}

export async function getCurrentSession(): Promise<AcademicSession | null> {
    return (await api.get(
        '/academics/sessions/current',
    )) as unknown as AcademicSession | null;
}

export async function createSession(dto: {
    name: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
}): Promise<AcademicSession> {
    return (await api.post(
        '/academics/sessions',
        dto,
    )) as unknown as AcademicSession;
}

export async function setCurrentSession(id: string): Promise<AcademicSession> {
    return (await api.patch(
        `/academics/sessions/${id}/current`,
        {},
    )) as unknown as AcademicSession;
}

export async function getTerms(sessionId?: string): Promise<AcademicTerm[]> {
    const qs = sessionId ? `?sessionId=${sessionId}` : '';
    return (await api.get(`/academics/terms${qs}`)) as unknown as AcademicTerm[];
}

export async function createTerm(dto: {
    sessionId: string;
    name: string;
    startDate: string;
    endDate: string;
    sortOrder?: number;
    isCurrent?: boolean;
}): Promise<AcademicTerm> {
    return (await api.post('/academics/terms', dto)) as unknown as AcademicTerm;
}

// ── Levels and arms ─────────────────────────────────────────────────────────

export async function getClassLevels(): Promise<ClassLevel[]> {
    return (await api.get('/academics/levels')) as unknown as ClassLevel[];
}

export async function createClassLevel(dto: {
    name: string;
    code?: string;
    sortOrder?: number;
}): Promise<ClassLevel> {
    return (await api.post('/academics/levels', dto)) as unknown as ClassLevel;
}

export async function getClassArms(levelId?: string): Promise<ClassArm[]> {
    const qs = levelId ? `?levelId=${levelId}` : '';
    return (await api.get(`/academics/arms${qs}`)) as unknown as ClassArm[];
}

export async function createClassArm(dto: {
    levelId: string;
    name: string;
    capacity?: number;
    formTeacherId?: string;
}): Promise<ClassArm> {
    return (await api.post('/academics/arms', dto)) as unknown as ClassArm;
}

export async function getArmOccupancy(id: string): Promise<ArmOccupancy> {
    return (await api.get(
        `/academics/arms/${id}/occupancy`,
    )) as unknown as ArmOccupancy;
}
