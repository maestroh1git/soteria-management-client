import type { ApiError } from '@/lib/types/api';

/** Narrow an unknown thrown value to the normalized ApiError from the interceptor. */
export function isApiError(err: unknown): err is ApiError {
  return (
    !!err &&
    typeof err === 'object' &&
    'statusCode' in err &&
    'message' in err
  );
}

/**
 * Turn a thrown API error into a single user-facing string.
 *
 * - 429 (auth rate limiting, S5) gets a dedicated "slow down" message instead
 *   of the raw throttler text.
 * - Validation errors (S11 password policy, etc.) surface their per-field
 *   `details` so the user sees exactly what failed.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isApiError(err)) {
    if (err.statusCode === 429) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (err.details && err.details.length > 0) {
      return err.details.join(' ');
    }
    const msg = Array.isArray(err.message)
      ? err.message.join(' ')
      : err.message;
    if (msg) return msg;
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (msg) return String(msg);
  }

  return fallback;
}
