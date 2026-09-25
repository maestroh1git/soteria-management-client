'use client';

import { useCallback } from 'react';
import { useMyTenant } from './use-tenant';
import { useHydrated } from './use-hydrated';
import { learnerWord, type LearnerTerm } from '@/lib/copy/glossary';

/** This school's word for its learners, and a function to write it. */
export function useLearnerTerm() {
  // Same as useTenantCurrency: "student" until hydrated, as the server rendered.
  const hydrated = useHydrated();
  const { data } = useMyTenant();
  const tenant = hydrated ? data : undefined;
  const raw = tenant?.settings?.learnerTerm;
  const term: LearnerTerm = raw === 'pupil' ? 'pupil' : 'student';
  const word = useCallback(
    (opts?: { plural?: boolean; capital?: boolean }) => learnerWord(term, opts),
    [term],
  );
  return { term, word };
}
