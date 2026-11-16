import type { RawCountry } from './types.js';

export const REQUEST_TIMEOUT_MS = 10_000;

export class HttpError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}

/** One owned fetch, cancelled by either the caller or the deadline. */
export async function searchCountries(query: string, signal: AbortSignal): Promise<RawCountry[]> {
  const normalized = query.trim();
  if (!normalized) return [];
  signal.throwIfAborted();

  const combined = new AbortController();
  const abort = () => combined.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => {
    combined.abort(new DOMException('Request timed out', 'TimeoutError'));
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`https://countries.dev/name/${encodeURIComponent(normalized)}`, {
      signal: combined.signal,
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new HttpError(response.status);
    const data: unknown = await response.json();
    if (
      !Array.isArray(data) ||
      !data.every(
        (item: unknown) =>
          typeof item === 'object' &&
          item !== null &&
          'name' in item &&
          typeof item.name === 'string',
      )
    ) {
      throw new TypeError('Unexpected country response');
    }
    return data as RawCountry[];
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
