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
 * - Anything that is not an ApiError falls back to the caller's own wording,
 *   because a raw Error's message is written for a developer, not a user.
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

  // Deliberately no generic `err.message` branch. Anything that did not come
  // through the interceptor has not been written for a user to read: this
  // branch used to forward axios's own "Request failed with status code 401"
  // straight to the login form, pre-empting the caller's fallback. If we did
  // not normalize it, we do not know it is fit to show.
  return fallback;
}
