import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getSessions,
    getCurrentSession,
    createSession,
    setCurrentSession,
    getTerms,
    createTerm,
    getClassLevels,
    createClassLevel,
    getClassArms,
    createClassArm,
    getArmOccupancy,
} from '../api/academics';

/**
 * The school's shape changes rarely — a session or an arm is created once and
 * then read constantly — so these are cached rather than refetched on every
 * mount of a form that needs a class dropdown.
 */
const STRUCTURE_STALE = 5 * 60 * 1000;

export function useSessions() {
    return useQuery({
        queryKey: ['academics', 'sessions'],
        queryFn: getSessions,
        staleTime: STRUCTURE_STALE,
    });
}

export function useCurrentSession() {
    return useQuery({
        queryKey: ['academics', 'sessions', 'current'],
        queryFn: getCurrentSession,
        staleTime: STRUCTURE_STALE,
    });
}

export function useCreateSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createSession,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['academics'] });
            toast.success('Session created');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not create session'),
    });
}

export function useSetCurrentSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: setCurrentSession,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['academics'] });
            // Worth saying out loud: this is what admissions and fees key to.
            toast.success('Current session changed');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not change session'),
    });
}

export function useTerms(sessionId?: string) {
    return useQuery({
        queryKey: ['academics', 'terms', sessionId],
        queryFn: () => getTerms(sessionId),
        staleTime: STRUCTURE_STALE,
        enabled: sessionId !== undefined || true,
    });
}

export function useCreateTerm() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createTerm,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['academics', 'terms'] });
            toast.success('Term created');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not create term'),
    });
}

export function useClassLevels() {
    return useQuery({
        queryKey: ['academics', 'levels'],
        queryFn: getClassLevels,
        staleTime: STRUCTURE_STALE,
    });
}

export function useCreateClassLevel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createClassLevel,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['academics'] });
            toast.success('Class level created');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not create level'),
    });
}

export function useClassArms(levelId?: string) {
    return useQuery({
        queryKey: ['academics', 'arms', levelId],
        queryFn: () => getClassArms(levelId),
        staleTime: STRUCTURE_STALE,
    });
}

export function useCreateClassArm() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createClassArm,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['academics'] });
            toast.success('Class created');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not create class'),
    });
}

export function useArmOccupancy(id: string | undefined) {
    return useQuery({
        queryKey: ['academics', 'arms', id, 'occupancy'],
        queryFn: () => getArmOccupancy(id!),
        enabled: !!id,
    });
}
