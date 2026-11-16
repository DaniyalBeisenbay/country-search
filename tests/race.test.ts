import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchController } from '../src/search-controller.js';
import type { SearchState } from '../src/search-controller.js';
import { rawSpain } from './fixture.js';

describe('actual cancellation of racing fetch requests', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('aborts immediately at new input; an older response scheduled after the newer cannot overwrite it', async () => {
    const signals: AbortSignal[] = [];
    const aborted: string[] = [];
    const responseAttempts: string[] = [];
    const states: SearchState[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, options: RequestInit) => {
        const signal = options.signal as AbortSignal;
        const query = decodeURIComponent(url.split('/').at(-1) || '');
        signals.push(signal);
        return new Promise((resolve, reject) => {
          const onAbort = () => {
            aborted.push(query);
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
          };
          signal.addEventListener('abort', onAbort, { once: true });
          setTimeout(
            () => {
              responseAttempts.push(query);
              signal.removeEventListener('abort', onAbort);
              resolve({
                ok: true,
                status: 200,
                json: async () => [
                  query === 'spain' ? rawSpain : { ...rawSpain, name: 'OUTDATED RESULT' },
                ],
              });
            },
            query === 'sp' ? 1000 : 50,
          );
        });
      }),
    );
    const app = new SearchController((state) => states.push(state));
    app.setQuery('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(signals[0]?.aborted).toBe(false);
    app.setQuery('spain');
    // Checked synchronously: cancellation cannot wait for the next debounce.
    expect(signals[0]?.aborted).toBe(true);
    expect(aborted).toEqual(['sp']);
    expect(app.state).toMatchObject({ status: 'waiting', query: 'spain', countries: [] });
    await vi.advanceTimersByTimeAsync(350);
    expect(app.state.countries.map((country) => country.name)).toEqual(['Spain']);
    await vi.advanceTimersByTimeAsync(1000);
    expect(responseAttempts).toEqual(['spain', 'sp']);
    expect(app.state).toMatchObject({ status: 'success', query: 'spain' });
    expect(app.state.countries.map((country) => country.name)).toEqual(['Spain']);
    expect(states.some((state) => state.status === 'error')).toBe(false);
    app.dispose();
  });

  it.each(['clear', 'dispose'])(
    'aborts a live fetch on %s and never renders its result',
    async (action) => {
      let activeSignal: AbortSignal | undefined;
      const states: SearchState[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn((_url, { signal }) => {
          activeSignal = signal;
          return new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          });
        }),
      );
      const app = new SearchController((state) => states.push(state));
      app.setQuery('spain');
      await vi.advanceTimersByTimeAsync(300);
      if (action === 'clear') app.setQuery('');
      else app.dispose();
      expect(activeSignal?.aborted).toBe(true);
      await vi.advanceTimersByTimeAsync(10000);
      expect(states.some((state) => ['success', 'error'].includes(state.status))).toBe(false);
      if (action === 'clear') expect(app.state.status).toBe('idle');
      expect(vi.getTimerCount()).toBe(0);
      app.dispose();
    },
  );
});
