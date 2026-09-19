import { getEnv } from '../runtimeConfig';

export const API_BASE = getEnv('VITE_API_URL');
export const API_UNAUTHORIZED_EVENT = 'reforge:api-unauthorized';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function isApiErrorWithStatus(error: unknown, status: number): error is ApiError {
  return error instanceof ApiError && error.status === status;
}

export function isUnauthorizedError(error: unknown): boolean {
  return isApiErrorWithStatus(error, 401);
}

let _accessToken: string | null = null;

// Pushed on every OIDC auth-state change from app/App.tsx — see that file's comment on why
// it's a synchronous, not effect-based, assignment.
export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function authHeaders(): Record<string, string> {
  return _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {};
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'Request failed';

    const error = new ApiError(response.status, message, body);

    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(API_UNAUTHORIZED_EVENT, { detail: { error } }));
    }

    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  return handleResponse<T>(response);
}
