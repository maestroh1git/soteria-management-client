'use client';

import { useCallback } from 'react';
import { useMyTenant } from './use-tenant';
import { learnerWord, type LearnerTerm } from '@/lib/copy/glossary';

/** This school's word for its learners, and a function to write it. */
export function useLearnerTerm() {
  const { data: tenant } = useMyTenant();
  const raw = tenant?.settings?.learnerTerm;
  const term: LearnerTerm = raw === 'pupil' ? 'pupil' : 'student';
  const word = useCallback(
    (opts?: { plural?: boolean; capital?: boolean }) => learnerWord(term, opts),
    [term],
  );
  return { term, word };
}
