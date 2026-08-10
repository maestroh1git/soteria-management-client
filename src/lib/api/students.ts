import api from './client';

export type StudentStatus =
    | 'ACTIVE'
    | 'GRADUATED'
    | 'WITHDRAWN'
    | 'TRANSFERRED';

export type GuardianRelationship =
    | 'FATHER'
    | 'MOTHER'
    | 'GUARDIAN'
    | 'SPONSOR'
    | 'OTHER';

export interface ClassArmRef {
    id: string;
    name: string;
    level?: { id: string; name: string };
}

export interface Student {
    id: string;
    admissionNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE';
    admissionDate: string;
    status: StudentStatus;
    address: string | null;
    currentClassArmId: string | null;
    currentClassArm?: ClassArmRef | null;
}

export interface Guardian {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    address: string | null;
    occupation: string | null;
}

export interface StudentGuardianLink {
    id: string;
    relationship: GuardianRelationship;
    isPrimary: boolean;
    canCollect: boolean;
    guardian: Guardian;
}

/**
 * Medical biodata. Null when nothing has been recorded — deliberately distinct
 * from an empty record, because "we hold no allergy information" and "we have
 * confirmed no allergies" are different answers to a teacher with a snack.
 */
export interface StudentMedical {
    id: string;
    bloodGroup: string | null;
    genotype: string | null;
    allergies: string | null;
    chronicConditions: string | null;
    medications: string | null;
    doctorName: string | null;
    doctorPhone: string | null;
    hospital: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    notes: string | null;
}

export interface StudentImportPreview {
    create: Array<{
        line: number;
        admissionNumber: string;
        name: string;
        className: string;
        guardianName: string;
        guardianExisting: boolean;
    }>;
    skip: Array<{ admissionNumber: string; name: string }>;
    errors: string[];
    newGuardians: number;
    reusedGuardians: number;
    totalRows: number;
}

export async function getStudents(filters?: {
    status?: string;
    classArmId?: string;
    search?: string;
}): Promise<Student[]> {
    const q = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') q.set('status', filters.status);
    if (filters?.classArmId) q.set('classArmId', filters.classArmId);
    if (filters?.search) q.set('search', filters.search);
    const qs = q.toString();
    return (await api.get(`/students${qs ? `?${qs}` : ''}`)) as unknown as Student[];
}

export async function getStudent(id: string): Promise<Student> {
    return (await api.get(`/students/${id}`)) as unknown as Student;
}

export async function createStudent(dto: Partial<Student>): Promise<Student> {
    return (await api.post('/students', dto)) as unknown as Student;
}

export async function getStudentGuardians(
    id: string,
): Promise<StudentGuardianLink[]> {
    return (await api.get(
        `/students/${id}/guardians`,
    )) as unknown as StudentGuardianLink[];
}

export async function getStudentMedical(
    id: string,
): Promise<StudentMedical | null> {
    return (await api.get(`/students/${id}/medical`)) as unknown as StudentMedical | null;
}

export async function upsertStudentMedical(
    id: string,
    dto: Partial<StudentMedical>,
): Promise<StudentMedical> {
    return (await api.put(
        `/students/${id}/medical`,
        dto,
    )) as unknown as StudentMedical;
}

/** Children in one class with something a teacher should know beforehand. */
export async function getMedicalAlerts(
    armId: string,
): Promise<Array<{ student: Student; medical: StudentMedical }>> {
    return (await api.get(
        `/students/class/${armId}/medical-alerts`,
    )) as unknown as Array<{ student: Student; medical: StudentMedical }>;
}

export async function getGuardians(search?: string): Promise<Guardian[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return (await api.get(`/students/guardians${qs}`)) as unknown as Guardian[];
}

/**
 * Guardians already on file with this number.
 *
 * Called before creating one. Two siblings entered separately otherwise become
 * two copies of a parent, and sibling discounts then silently never apply.
 */
export async function findDuplicateGuardians(
    phone: string,
): Promise<Guardian[]> {
    return (await api.get(
        `/students/guardians/duplicates?phone=${encodeURIComponent(phone)}`,
    )) as unknown as Guardian[];
}

export async function createGuardian(
    dto: Partial<Guardian>,
): Promise<Guardian> {
    return (await api.post('/students/guardians', dto)) as unknown as Guardian;
}

export async function linkGuardian(
    studentId: string,
    dto: {
        guardianId: string;
        relationship: GuardianRelationship;
        isPrimary?: boolean;
        canCollect?: boolean;
    },
): Promise<StudentGuardianLink> {
    return (await api.post(
        `/students/${studentId}/guardians`,
        dto,
    )) as unknown as StudentGuardianLink;
}

// ── Import ──────────────────────────────────────────────────────────────────

function body(file: File) {
    const form = new FormData();
    form.append('file', file);
    // Content-Type is left to the browser so it sets the multipart boundary.
    return { form, config: { headers: { 'Content-Type': undefined as never } } };
}

export async function previewStudentImport(
    file: File,
): Promise<StudentImportPreview> {
    const { form, config } = body(file);
    return (await api.post(
        '/students/import/preview',
        form,
        config,
    )) as unknown as StudentImportPreview;
}

export async function commitStudentImport(
    file: File,
): Promise<{ students: number; guardiansCreated: number; guardiansReused: number }> {
    const { form, config } = body(file);
    return (await api.post('/students/import', form, config)) as unknown as {
        students: number;
        guardiansCreated: number;
        guardiansReused: number;
    };
}

export async function getStudentImportOptions(): Promise<{
    classes: Array<{ id: string; label: string; capacity: number | null }>;
    relationships: string[];
}> {
    return (await api.get('/students/import/options')) as unknown as {
        classes: Array<{ id: string; label: string; capacity: number | null }>;
        relationships: string[];
    };
}

/**
 * The template, carrying this school's own class names.
 *
 * Fetched as a blob rather than linked directly: the endpoint needs the bearer
 * token, and an anchor tag cannot carry one.
 */
export async function downloadStudentTemplate(): Promise<Blob> {
    const res = await api.get('/students/import/template', {
        responseType: 'blob',
    });
    return res as unknown as Blob;
}
