import api from './client';

export interface ClassLevel {
    id: string;
    name: string;
    code: string | null;
    sortOrder: number;
}

export interface ClassArm {
    id: string;
    name: string;
    capacity: number | null;
    levelId: string;
    level?: ClassLevel;
}

export interface AcademicSession {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
}

export async function getClassLevels(): Promise<ClassLevel[]> {
    return (await api.get('/academics/levels')) as unknown as ClassLevel[];
}

export async function getClassArms(levelId?: string): Promise<ClassArm[]> {
    const qs = levelId ? `?levelId=${levelId}` : '';
    return (await api.get(`/academics/arms${qs}`)) as unknown as ClassArm[];
}

export async function getCurrentSession(): Promise<AcademicSession | null> {
    return (await api.get(
        '/academics/sessions/current',
    )) as unknown as AcademicSession | null;
}
