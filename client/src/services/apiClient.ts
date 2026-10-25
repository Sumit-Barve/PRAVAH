/**
 * SAKSHAM Unified API Client
 * Centralizes HTTP requests, timeout handling, error normalization, HttpOnly cookie credentials,
 * and automated CSRF token transmission for state-changing operations.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface RequestOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * Helper to extract cookie value by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Standard GET request with timeout and cookie transmission
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, headers = {} } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Transmit saksham_token HttpOnly cookie
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: unknown = null;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson?.message) {
          errorMessage = errorJson.message;
        }
        errorDetails = errorJson;
      } catch {
        // Fallback to default
      }
      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(
        `Request to '${endpoint}' timed out after ${timeoutMs / 1000}s. Please verify backend server connectivity.`,
        408
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error.message || 'Network request failed. Ensure PRAVAH API service is running on port 5000.',
      0
    );
  }
}

/**
 * Mutating HTTP request (POST, PUT, PATCH, DELETE) with automatic CSRF token inclusion
 */
export async function apiMutate<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, headers = {} } = options;
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const csrfToken = getCookie('saksham_csrf_token');

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  if (csrfToken) {
    requestHeaders['x-csrf-token'] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: unknown = null;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson?.message) {
          errorMessage = errorJson.message;
        }
        errorDetails = errorJson;
      } catch {
        // Fallback
      }
      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(
        `Request to '${endpoint}' timed out after ${timeoutMs / 1000}s.`,
        408
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error.message || 'Network request failed. Ensure PRAVAH API service is running on port 5000.',
      0
    );
  }
}

export const apiPost = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiMutate<T>('POST', endpoint, body, options);

export const apiPut = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiMutate<T>('PUT', endpoint, body, options);

export const apiPatch = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiMutate<T>('PATCH', endpoint, body, options);

export const apiDelete = <T>(endpoint: string, options?: RequestOptions) =>
  apiMutate<T>('DELETE', endpoint, undefined, options);

/**
 * File upload helper sending multipart FormData with CSRF protection
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 60000, headers = {} } = options;
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const csrfToken = getCookie('saksham_csrf_token');
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  if (csrfToken) {
    requestHeaders['x-csrf-token'] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: requestHeaders,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: unknown = null;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        }
        errorDetails = errorJson;
      } catch {
        // Fallback
      }
      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Upload failed.', 0);
  }
}

