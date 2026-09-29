import { SyncConfig, SyncPayload, ServerData } from '../types/sync';
import { SYNC_DEFAULTS } from '../constants';

export class SyncError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SyncError';
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized) return '';
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

export async function checkServerHealth(config: SyncConfig): Promise<number> {
  const serverUrl = normalizeUrl(config.serverUrl);
  if (!serverUrl) {
    throw new SyncError('Server URL is not configured', 'NO_URL');
  }
  if (!config.apiKey) {
    throw new SyncError('API key is not configured', 'NO_API_KEY');
  }

  try {
    const response = await fetchWithTimeout(
      `${serverUrl}/health`,
      { method: 'GET', headers: getHeaders(config.apiKey) },
      SYNC_DEFAULTS.requestTimeoutMs,
    );

    if (response.status === 401) {
      throw new SyncError('Invalid API key', 'UNAUTHORIZED');
    }
    if (!response.ok) {
      throw new SyncError(`Server error: ${response.status}`, 'SERVER_ERROR');
    }

    const body = (await response.json()) as { serverTime: number };
    return body.serverTime;
  } catch (error) {
    if (error instanceof SyncError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SyncError('Connection timed out', 'TIMEOUT');
    }
    throw new SyncError(
      error instanceof Error ? error.message : 'Network error',
      'NETWORK_ERROR',
    );
  }
}

export async function pullFromServer(config: SyncConfig): Promise<ServerData> {
  const serverUrl = normalizeUrl(config.serverUrl);

  try {
    const response = await fetchWithTimeout(
      `${serverUrl}/sync`,
      { method: 'GET', headers: getHeaders(config.apiKey) },
      SYNC_DEFAULTS.requestTimeoutMs,
    );

    if (response.status === 401) {
      throw new SyncError('Invalid API key', 'UNAUTHORIZED');
    }
    if (!response.ok) {
      throw new SyncError(`Server error: ${response.status}`, 'SERVER_ERROR');
    }

    return (await response.json()) as ServerData;
  } catch (error) {
    if (error instanceof SyncError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SyncError('Connection timed out', 'TIMEOUT');
    }
    throw new SyncError(
      error instanceof Error ? error.message : 'Network error',
      'NETWORK_ERROR',
    );
  }
}

export async function pushToServer(
  config: SyncConfig,
  payload: SyncPayload,
): Promise<ServerData> {
  const serverUrl = normalizeUrl(config.serverUrl);

  try {
    const response = await fetchWithTimeout(
      `${serverUrl}/sync`,
      {
        method: 'POST',
        headers: getHeaders(config.apiKey),
        body: JSON.stringify(payload),
      },
      SYNC_DEFAULTS.requestTimeoutMs,
    );

    if (response.status === 401) {
      throw new SyncError('Invalid API key', 'UNAUTHORIZED');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new SyncError(
        `Server error: ${response.status} ${text}`,
        'SERVER_ERROR',
      );
    }

    return (await response.json()) as ServerData;
  } catch (error) {
    if (error instanceof SyncError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SyncError('Connection timed out', 'TIMEOUT');
    }
    throw new SyncError(
      error instanceof Error ? error.message : 'Network error',
      'NETWORK_ERROR',
    );
  }
}
