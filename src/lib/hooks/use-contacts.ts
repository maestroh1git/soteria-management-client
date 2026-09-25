import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getStudentContacts, logStudentContact } from '../api/contacts';

/** A pupil's contact log, newest first. */
export function useStudentContacts(studentId: string | undefined, enabled = true) {
    return useQuery({
        queryKey: ['contacts', studentId],
        queryFn: () => getStudentContacts(studentId!),
        enabled: !!studentId && enabled,
    });
}

/** Write a contact down; the follow-up list shows it as the last contact. */
export function useLogContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: logStudentContact,
        onSuccess: (_, input) => {
            queryClient.invalidateQueries({ queryKey: ['contacts', input.studentId] });
            queryClient.invalidateQueries({ queryKey: ['attendance', 'at-risk'] });
            toast.success('Contact saved');
        },
    });
}
