import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, REQUEST_TIMEOUT_MS, searchCountries } from '../src/api.js';
import { rawSpain } from './fixture.js';

const respond = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('searchCountries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('encodes a trimmed query, supplies a signal and returns the array', async () => {
    const fetchMock = respond(200, [rawSpain]);
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchCountries('  united states  ', new AbortController().signal)).toEqual([
      rawSpain,
    ]);
    expect(fetchMock).toHaveBeenCalledWith('https://countries.dev/name/united%20states', {
      signal: expect.any(AbortSignal),
    });
  });

  it('never requests empty input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchCountries('  ', new AbortController().signal)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats 404 as an empty result without trying to decode its body', async () => {
    vi.stubGlobal('fetch', respond(404, null));
    expect(await searchCountries('zzzz', new AbortController().signal)).toEqual([]);
  });

  it.each([400, 429, 500, 503])('throws HttpError carrying HTTP %i', async (status) => {
    vi.stubGlobal('fetch', respond(status, null));
    const request = searchCountries('spain', new AbortController().signal);
    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({ name: 'HttpError', status });
  });

  it('propagates network and malformed JSON errors', async () => {
    const error = new TypeError('offline');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    await expect(searchCountries('spain', new AbortController().signal)).rejects.toBe(error);
    vi.stubGlobal('fetch', respond(200, { unexpected: true }));
    await expect(searchCountries('spain', new AbortController().signal)).rejects.toThrow();
  });

  it('really aborts fetch when its caller aborts', async () => {
    let fetchSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, { signal }) => {
        fetchSignal = signal;
        return new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(signal.reason), { once: true }),
        );
      }),
    );
    const controller = new AbortController();
    const request = searchCountries('spain', controller.signal);
    controller.abort();
    expect(fetchSignal?.aborted).toBe(true);
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('does not fetch with an already aborted signal', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();
    await expect(searchCountries('spain', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts a hanging fetch with TimeoutError and clears the timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          }),
      ),
    );
    const controller = new AbortController();
    const request = searchCountries('spain', controller.signal);
    const assertion = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await assertion;
    expect(controller.signal.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up its timeout after success', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', respond(200, [rawSpain]));
    await searchCountries('spain', new AbortController().signal);
    expect(vi.getTimerCount()).toBe(0);
  });
});
