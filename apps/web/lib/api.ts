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

export class ApiNetworkError extends Error {
  public readonly urlPath: string;
  public readonly causeError: unknown;

  constructor(urlPath: string, cause?: unknown) {
    super('We could not reach the server. Check your connection and try again.');
    this.name = 'ApiNetworkError';
    this.urlPath = urlPath;
    this.causeError = cause;
  }
}

export function buildApiUrl(base: string | undefined, endpoint: string): string {
  if (!base || typeof base !== 'string' || !base.trim()) {
    throw new Error('API base URL is not configured. Set NEXT_PUBLIC_API_URL.');
  }

  const cleanBase = base.trim().replace(/\/+$/, '');
  let cleanEndpoint = endpoint.trim().replace(/\/+/g, '/');
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }

  let finalPath = cleanEndpoint;
  if (!cleanBase.endsWith('/api/v1') && !cleanEndpoint.startsWith('/api/v1')) {
    finalPath = `/api/v1${cleanEndpoint}`;
  }

  return `${cleanBase}${finalPath}`;
}

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface RequestOptions extends RequestInit {
  token?: string;
  timeoutMs?: number;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers = {}, timeoutMs = 15000, ...rest } = options;

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

  const normalizedEndpoint = endpoint === '/auth/me' ? '/me' : endpoint;
  const url = buildApiUrl(DEFAULT_API_BASE, normalizedEndpoint);
  const method = (rest.method || 'GET').toUpperCase();
  const isIdempotentGet = method === 'GET';

  const executeFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const signal = controller.signal;
    if (rest.signal) {
      if (rest.signal.aborted) {
        controller.abort();
      } else {
        rest.signal.addEventListener('abort', () => controller.abort());
      }
    }

    try {
      const response = await fetch(url, {
        ...rest,
        method,
        headers: reqHeaders,
        signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let res: Response;
  try {
    res = await executeFetch();
  } catch (initialErr) {
    if (isIdempotentGet) {
      // Retry once after 500ms backoff for idempotent GET
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        res = await executeFetch();
      } catch (retryErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`[apiClient network failure on ${endpoint}]:`, retryErr);
        }
        throw new ApiNetworkError(endpoint, retryErr);
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[apiClient network failure on ${endpoint}]:`, initialErr);
      }
      throw new ApiNetworkError(endpoint, initialErr);
    }
  }

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
