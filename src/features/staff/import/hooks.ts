'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import { commitImport, getImportOptions, previewImport } from './api';

type ImportArgs = { file: File; createMissingRoles: boolean };

/** What the file may contain: the columns, and the positions it can match. */
export function useImportOptions() {
  return useQuery({ queryKey: ['employees', 'import', 'options'], queryFn: getImportOptions });
}

/** Read the file and say what would happen, changing nothing. */
export function usePreviewImport() {
  return useMutation({
    mutationFn: ({ file, createMissingRoles }: ImportArgs) =>
      previewImport(file, createMissingRoles),
    // The page's old handler read `e.message` off an Error; the API's refusals
    // are not Errors, so every reason ("column 'email' is missing") was lost.
    onError: (err) => toast.error(getApiErrorMessage(err, 'That file could not be read.')),
  });
}

/** Create the staff in the file. */
export function useCommitImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, createMissingRoles }: ImportArgs) =>
      commitImport(file, createMissingRoles),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success(
        `${result.created} ${result.created === 1 ? 'member of staff' : 'staff'} imported`,
      );
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'The import did not complete.')),
  });
}
