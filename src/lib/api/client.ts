import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, BackendErrorBody } from '@/lib/types/api';

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

    // 401 Unauthorized — redirect to login
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-store');
      window.location.href = '/login';
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
