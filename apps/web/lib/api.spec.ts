import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildApiUrl, apiClient, ApiError, ApiNetworkError } from './api';

describe('buildApiUrl', () => {
  it('builds canonical URL with default base and leading slash endpoint', () => {
    const url = buildApiUrl('http://localhost:4000', '/me');
    expect(url).toBe('http://localhost:4000/api/v1/me');
  });

  it('handles base with trailing slash and endpoint without leading slash', () => {
    const url = buildApiUrl('http://localhost:4000/', 'me');
    expect(url).toBe('http://localhost:4000/api/v1/me');
  });

  it('collapses redundant multiple slashes in endpoint and base', () => {
    const url = buildApiUrl('http://localhost:4000///', '///drives///123');
    expect(url).toBe('http://localhost:4000/api/v1/drives/123');
  });

  it('avoids duplicating /api/v1 when base already includes /api/v1', () => {
    const url = buildApiUrl('http://localhost:4000/api/v1', '/me');
    expect(url).toBe('http://localhost:4000/api/v1/me');
  });

  it('avoids duplicating /api/v1 when base with trailing slash includes /api/v1/', () => {
    const url = buildApiUrl('http://localhost:4000/api/v1/', '/notices');
    expect(url).toBe('http://localhost:4000/api/v1/notices');
  });

  it('avoids duplicating /api/v1 when endpoint already starts with /api/v1', () => {
    const url = buildApiUrl('http://localhost:4000', '/api/v1/health');
    expect(url).toBe('http://localhost:4000/api/v1/health');
  });

  it('throws descriptive error if base URL is missing or empty', () => {
    expect(() => buildApiUrl('', '/me')).toThrow(
      'API base URL is not configured. Set NEXT_PUBLIC_API_URL.',
    );
    expect(() => buildApiUrl(undefined, '/me')).toThrow(
      'API base URL is not configured. Set NEXT_PUBLIC_API_URL.',
    );
    expect(() => buildApiUrl('   ', '/me')).toThrow(
      'API base URL is not configured. Set NEXT_PUBLIC_API_URL.',
    );
  });
});

describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed json on successful 200 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });

    const data = await apiClient<{ status: string }>('/health');
    expect(data).toEqual({ status: 'ok' });
  });

  it('returns empty object on 204 No Content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('should not parse');
      },
    });

    const data = await apiClient('/some-empty');
    expect(data).toEqual({});
  });

  it('throws ApiError with status and message on 404 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Item not found' }),
    });

    await expect(apiClient('/missing')).rejects.toThrow(ApiError);
    await expect(apiClient('/missing')).rejects.toThrow('Item not found');
  });

  it('retries once on GET request network failure before throwing ApiNetworkError', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    global.fetch = fetchMock;

    let caughtError: unknown;
    try {
      await apiClient('/test-retry', { method: 'GET' });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(ApiNetworkError);
    expect((caughtError as ApiNetworkError).message).toBe(
      'We could not reach the server. Check your connection and try again.',
    );
    expect((caughtError as ApiNetworkError).urlPath).toBe('/test-retry');
    // Expect 2 attempts (initial + 1 retry)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('succeeds on GET if the retry succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ retried: true }),
      });
    global.fetch = fetchMock;

    const res = await apiClient<{ retried: boolean }>('/test-retry-success');
    expect(res).toEqual({ retried: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries POST requests on network failure and throws ApiNetworkError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    global.fetch = fetchMock;

    let caughtError: unknown;
    try {
      await apiClient('/test-post', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(ApiNetworkError);
    // Crucial: exactly 1 attempt, zero retries for POST!
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never retries PUT, PATCH, DELETE requests on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    global.fetch = fetchMock;

    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      fetchMock.mockClear();
      await expect(apiClient('/action', { method })).rejects.toThrow(ApiNetworkError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });
});
