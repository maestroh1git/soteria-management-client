import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, BackendErrorBody } from '@/lib/types/api';
import { clearSession, isAuthPath } from '@/lib/utils/session';

// Must include the backend's global prefix (`/api`). The deployed value is set
// via NEXT_PUBLIC_API_URL (e.g. https://<backend-host>/api).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
      return Promise.reject(error);
    }

    // Parse the backend's standard error envelope:
    //   { success, error: { code, message, details }, timestamp, path }
    // Fall back to a top-level `message` (legacy/non-wrapped) or the axios
    // network error message.
    const body = error.response?.data;
    const wrapped = body?.error;
    const rawMessage = wrapped?.message ?? body?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : rawMessage || error.message || 'An unexpected error occurred';

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

    return Promise.reject(apiError);
  },
);

export default api;
