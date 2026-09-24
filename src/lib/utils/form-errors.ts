import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { getApiErrorMessage, isApiError } from './api-error';

/**
 * Put the API's refusal where the person is looking (ROADMAP-EXECUTION.md, C3.7).
 *
 * class-validator writes each problem as "<field> <what is wrong>"; a message
 * naming one of the form's fields goes under that field, the rest above the
 * form. A toast that says "name must be shorter than 100 characters" and then
 * vanishes leaves the person hunting for which box it meant.
 *
 * Returns the message for the form as a whole, if any.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  err: unknown,
  fallback = 'That could not be saved. Please try again.',
): string | null {
  const fields = Object.keys(form.getValues());
  const messages = isApiError(err)
    ? (err.details?.length
        ? err.details
        : Array.isArray(err.message)
          ? err.message
          : [err.message]
      ).filter(Boolean)
    : [];
  const unplaced: string[] = [];
  for (const m of messages) {
    const field = fields.find((f) => m === f || m.startsWith(`${f} `));
    if (field) {
      form.setError(field as Path<T>, { type: 'server', message: sentence(m) });
    } else {
      unplaced.push(m);
    }
  }
  if (!messages.length) return getApiErrorMessage(err, fallback);
  return unplaced.length ? unplaced.join(' ') : null;
}

/** "name must be a string" → "Must be a string." — the label says which. */
function sentence(message: string): string {
  const rest = message.replace(/^\S+\s+/, '');
  const s = rest.charAt(0).toUpperCase() + rest.slice(1);
  return /[.!?]$/.test(s) ? s : `${s}.`;
}
