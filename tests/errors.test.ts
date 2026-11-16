import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyError } from '../src/errors.js';
import { SearchController } from '../src/search-controller.js';
import { HttpError } from '../src/api.js';
import { rawSpain } from './fixture.js';

const noChange = () => undefined;

describe('error classification', () => {
  it('treats caller cancellation as silent, including cross-realm shaped errors', () => {
    expect(classifyError(new DOMException('Cancelled', 'AbortError'))).toBeNull();
    expect(classifyError({ name: 'AbortError' })).toBeNull();
  });
  it('distinguishes timeouts from cancellations', () => {
    expect(classifyError(new DOMException('Timed out', 'TimeoutError'))).toMatchObject({
      kind: 'timeout',
    });
  });
  it('distinguishes HttpError and network errors', () => {
    expect(classifyError(new HttpError(503))).toMatchObject({ kind: 'http', status: 503 });
    expect(classifyError(new TypeError('Failed to fetch'))).toMatchObject({ kind: 'network' });
    expect(classifyError('unexpected')).toMatchObject({ kind: 'network' });
  });
});

describe('search state and error handling without a DOM', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps empty and whitespace-only input idle without fetching', async () => {
    const search = vi.fn();
    const app = new SearchController(noChange, search);
    app.setQuery('   ');
    await vi.advanceTimersByTimeAsync(300);
    expect(app.state.status).toBe('idle');
    expect(search).not.toHaveBeenCalled();
    app.dispose();
  });

  it('distinguishes loading and 404-as-empty results', async () => {
    let resolve!: (value: []) => void;
    const search = vi.fn(
      () =>
        new Promise<[]>((done) => {
          resolve = done;
        }),
    );
    const app = new SearchController(noChange, search);
    app.setQuery('zzzz');
    expect(app.state.status).toBe('waiting');
    await vi.advanceTimersByTimeAsync(300);
    expect(app.state.status).toBe('loading');
    resolve([]);
    await vi.advanceTimersByTimeAsync(0);
    expect(app.state.status).toBe('empty');
    app.dispose();
  });

  it.each([
    [new DOMException('Timeout', 'TimeoutError'), 'timeout'],
    [new HttpError(500), 'http'],
    [new TypeError('offline'), 'network'],
  ])('exposes a genuine error: %s', async (error, kind) => {
    const app = new SearchController(noChange, vi.fn().mockRejectedValue(error));
    app.setQuery('spain');
    await vi.advanceTimersByTimeAsync(300);
    expect(app.state).toMatchObject({ status: 'error', error: { kind } });
    app.dispose();
  });

  it('does not expose AbortError as a user-facing error', async () => {
    const app = new SearchController(
      noChange,
      vi.fn().mockRejectedValue(new DOMException('', 'AbortError')),
    );
    app.setQuery('spain');
    await vi.advanceTimersByTimeAsync(300);
    expect(app.state.status).toBe('idle');
    expect(app.state.error).toBeUndefined();
    app.dispose();
  });

  it('retry immediately uses the last typed query and cancels its pending debounce', async () => {
    const search = vi.fn().mockRejectedValueOnce(new HttpError(500)).mockResolvedValue([rawSpain]);
    const app = new SearchController(noChange, search);
    app.setQuery('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(app.state.status).toBe('error');
    app.setQuery('spain');
    app.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(search).toHaveBeenLastCalledWith('spain', expect.any(AbortSignal));
    expect(app.state).toMatchObject({ status: 'success', query: 'spain' });
    await vi.advanceTimersByTimeAsync(300);
    expect(search).toHaveBeenCalledTimes(2);
    app.dispose();
  });

  it('cancels pending work when disposed', async () => {
    const search = vi.fn();
    const app = new SearchController(noChange, search);
    app.setQuery('spain');
    app.dispose();
    await vi.advanceTimersByTimeAsync(300);
    expect(search).not.toHaveBeenCalled();
  });
});
