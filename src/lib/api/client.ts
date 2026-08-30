import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, BackendErrorBody } from '@/lib/types/api';
import { clearSession, isAuthPath } from '@/lib/utils/session';

// Same-origin by default: the browser calls a relative `/api`, and the platform
// (or the Next rewrite in next.config.ts / compose) routes `/api` to the
// backend. This keeps the client bundle env-agnostic so one built image can be
// promoted staging -> prod unchanged, and removes cross-origin/CORS entirely.
// NEXT_PUBLIC_API_URL still overrides for local `next dev` against a remote API.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// Request interceptor: attach JWT token
// ============================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================
// Response interceptor: unwrap data, handle errors
// ============================================================
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<BackendErrorBody>) => {
    const status = error.response?.status;

    // Parse the backend's standard error envelope:
    //   { success, error: { code, message, details }, timestamp, path }
    // Fall back to a top-level `message` (legacy/non-wrapped).
    //
    // Every path normalizes, including 401. This used to reject a 401 with the
    // raw AxiosError, so the login form's "Invalid credentials" — which the
    // backend does send, in this very envelope — was replaced on screen by
    // axios's own "Request failed with status code 401".
    const body = error.response?.data;
    const wrapped = body?.error;
    const rawMessage = wrapped?.message ?? body?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : rawMessage ||
        // No response at all: the request never landed — dropped connection,
        // CORS refusal, timeout. axios calls those "Network Error" and
        // "timeout of 30000ms exceeded", neither of which a user can act on.
        (error.response
          ? 'An unexpected error occurred'
          : 'Could not reach the server. Check your connection and try again.');

    // Validation errors duplicate the messages array into both `message` and
    // `details`; surface whichever is present as the field-level details.
    const details =
      wrapped?.details ?? (Array.isArray(rawMessage) ? rawMessage : null);

    const apiError: ApiError = {
      statusCode: status || 500,
      code: wrapped?.code,
      message,
      details,
    };

    // 401 Unauthorized — end the session properly.
    if (status === 401 && typeof window !== 'undefined') {
      // Both stores, or the middleware keeps believing we are signed in and
      // bounces us off /login straight back to a dashboard with no session.
      clearSession();
      // On an auth page the 401 IS the answer — a wrong password. Reloading
      // there throws away the "Invalid credentials" message the form is about
      // to render, and the user sees an empty form and no explanation.
      if (!isAuthPath(window.location.pathname)) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(apiError);
  },
);

export default api;
