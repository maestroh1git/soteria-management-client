import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import {
    getStudents,
    getStudent,
    createStudent,
    getStudentGuardians,
    getStudentMedical,
    upsertStudentMedical,
    getMedicalAlerts,
    getGuardians,
    findDuplicateGuardians,
    createGuardian,
    linkGuardian,
    getStudentImportOptions,
    previewStudentImport,
    commitStudentImport,
    downloadStudentTemplate,
    getStudentDocuments,
    attachStudentDocument,
    removeStudentDocument,
    type Student,
    type StudentMedical,
    type GuardianRelationship,
    type DocumentKind,
} from '../api/students';

export function useStudents(
    filters?: {
        status?: string;
        classArmId?: string;
        search?: string;
    
        page?: number;
        limit?: number;
    },
    enabled = true,
) {
    return useQuery({
        queryKey: ['students', filters],
        queryFn: () => getStudents(filters),
        enabled,
    });
}

export function useStudent(id: string) {
    return useQuery({
        queryKey: ['students', id],
        queryFn: () => getStudent(id),
        enabled: !!id,
    });
}

export function useCreateStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: Partial<Student>) => createStudent(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['students'] });
            toast.success('Student added');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not add student'),
    });
}

export function useStudentGuardians(id: string) {
    return useQuery({
        queryKey: ['students', id, 'guardians'],
        queryFn: () => getStudentGuardians(id),
        enabled: !!id,
    });
}

export function useStudentMedical(id: string) {
    return useQuery({
        queryKey: ['students', id, 'medical'],
        queryFn: () => getStudentMedical(id),
        enabled: !!id,
    });
}

export function useUpsertStudentMedical(studentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: Partial<StudentMedical>) =>
            upsertStudentMedical(studentId, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['students', studentId, 'medical'] });
            toast.success('Medical record saved');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not save'),
    });
}

/** Children in one class a teacher should know about before a trip. */
export function useMedicalAlerts(armId: string | undefined) {
    return useQuery({
        queryKey: ['students', 'medical-alerts', armId],
        queryFn: () => getMedicalAlerts(armId!),
        enabled: !!armId,
    });
}

export function useGuardians(search?: string) {
    return useQuery({
        queryKey: ['guardians', search],
        queryFn: () => getGuardians(search),
    });
}

/**
 * Deliberately manual rather than a live query on every keystroke: it is asked
 * once, when a phone number has been entered, and answering it mid-typing would
 * flag half a number as a duplicate.
 */
export function useFindDuplicateGuardians() {
    return useMutation({
        mutationFn: (phone: string) => findDuplicateGuardians(phone),
    });
}

export function useCreateGuardian() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createGuardian,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['guardians'] });
            toast.success('Guardian added');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not add guardian'),
    });
}

export function useLinkGuardian(studentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: {
            guardianId: string;
            relationship: GuardianRelationship;
            isPrimary?: boolean;
            canCollect?: boolean;
        }) => linkGuardian(studentId, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] });
            toast.success('Guardian linked');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not link guardian'),
    });
}

export function useStudentImportOptions() {
    return useQuery({
        queryKey: ['students', 'import', 'options'],
        queryFn: getStudentImportOptions,
    });
}

// ── Documents ───────────────────────────────────────────────────────────────

export function useStudentDocuments(studentId?: string) {
    return useQuery({
        queryKey: ['students', studentId, 'documents'],
        queryFn: () => getStudentDocuments(studentId!),
        enabled: !!studentId,
    });
}

export function useAttachStudentDocument(studentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            file,
            kind,
            description,
        }: {
            file: File;
            kind: DocumentKind;
            description?: string;
        }) => attachStudentDocument(studentId, file, kind, description),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['students', studentId, 'documents'] });
            toast.success('Document attached');
        },
        // The server refuses anything that is not really a PDF or an image, by
        // reading the file rather than believing it. Worth showing verbatim.
        onError: (e: Error) => toast.error(e.message || 'Could not attach that'),
    });
}

export function useRemoveStudentDocument(studentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (documentId: string) =>
            removeStudentDocument(studentId, documentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['students', studentId, 'documents'] });
            toast.success('Document removed');
        },
    });
}

/** Read a roster file and say what would happen, changing nothing. */
export function usePreviewStudentImport() {
    return useMutation({
        mutationFn: (file: File) => previewStudentImport(file),
        onError: (err) => toast.error(getApiErrorMessage(err, 'That file could not be read.')),
    });
}

/** Admit the pupils in the file and create their guardians. */
export function useCommitStudentImport() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => commitStudentImport(file),
        onSuccess: (r) => {
            qc.invalidateQueries({ queryKey: ['students'] });
            toast.success(
                `${r.students} ${r.students === 1 ? 'pupil' : 'pupils'} admitted · ${r.guardiansCreated} new ${r.guardiansCreated === 1 ? 'guardian' : 'guardians'}`,
            );
        },
        onError: (err) => toast.error(getApiErrorMessage(err, 'The import did not complete.')),
    });
}

/** The roster template, as a file download. */
export function useDownloadStudentTemplate() {
    return useMutation({
        mutationFn: async () => {
            const blob = await downloadStudentTemplate();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student-roster-template.xlsx';
            a.click();
            URL.revokeObjectURL(url);
        },
        onError: () => toast.error('The template could not be built. Please try again.'),
    });
}
