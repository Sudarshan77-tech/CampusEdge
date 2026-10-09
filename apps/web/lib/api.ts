import { createClient as createBrowserClient } from './supabase/client';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      authToken = data.session?.access_token;
    } catch {
      // Browser supabase client error or no session
    }
  }

  const reqHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (!(rest.body instanceof FormData)) {
    reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
  }

  if (authToken) {
    reqHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...rest,
    headers: reqHeaders,
  });

  if (!res.ok) {
    let errMessage = `API request failed with status ${res.status}`;
    let errDetails: unknown = null;
    try {
      const errJson = await res.json();
      errMessage = errJson.message || errMessage;
      errDetails = errJson;
    } catch {
      // Non-json error
    }
    throw new ApiError(
      res.status,
      Array.isArray(errMessage) ? errMessage.join(', ') : errMessage,
      errDetails,
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { method: 'GET', ...options }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { method: 'DELETE', ...options }),

  upload: <T = unknown>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: formData,
      ...options,
    }),
};
