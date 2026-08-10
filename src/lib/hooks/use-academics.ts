import { useQuery } from '@tanstack/react-query';
import {
    getClassLevels,
    getClassArms,
    getCurrentSession,
} from '../api/academics';

/**
 * The school's shape changes rarely — a session or a class arm is created once
 * and then read constantly — so these are cached rather than refetched on every
 * mount of a form that needs a class dropdown.
 */
const STRUCTURE_STALE = 5 * 60 * 1000;

export function useClassLevels() {
    return useQuery({
        queryKey: ['academics', 'levels'],
        queryFn: getClassLevels,
        staleTime: STRUCTURE_STALE,
    });
}

export function useClassArms(levelId?: string) {
    return useQuery({
        queryKey: ['academics', 'arms', levelId],
        queryFn: () => getClassArms(levelId),
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
