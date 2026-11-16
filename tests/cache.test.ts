import { describe, expect, it, vi } from 'vitest';
import { createCachedSearch } from '../src/cache.js';
import { rawSpain } from './fixture.js';

describe('bounded cache and independent subscribers', () => {
  it('normalizes keys, caches empty results and evicts the least recently used entry', async () => {
    const fetch = vi.fn().mockResolvedValue([rawSpain]);
    const search = createCachedSearch(fetch, 2);
    const signal = () => new AbortController().signal;
    await search(' Spain ', signal());
    await search('spain', signal());
    expect(fetch).toHaveBeenCalledTimes(1);
    await search('france', signal());
    await search('SPAIN', signal());
    await search('italy', signal());
    await search('france', signal());
    expect(fetch).toHaveBeenCalledTimes(4);
    fetch.mockResolvedValue([]);
    await search('zzz', signal());
    await search('zzz', signal());
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('deduplicates in-flight requests without sharing caller cancellation', async () => {
    let resolve!: (value: (typeof rawSpain)[]) => void;
    let networkSignal!: AbortSignal;
    const fetch = vi.fn((_query: string, signal: AbortSignal) => {
      networkSignal = signal;
      return new Promise<(typeof rawSpain)[]>((done, reject) => {
        resolve = done;
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    });
    const search = createCachedSearch(fetch);
    const a = new AbortController();
    const b = new AbortController();
    const first = search('spain', a.signal);
    const firstAssertion = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const second = search('spain', b.signal);
    await Promise.resolve();
    a.abort();
    await firstAssertion;
    expect(networkSignal.aborted).toBe(false);
    resolve([rawSpain]);
    await expect(second).resolves.toEqual([rawSpain]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('really aborts the network when the last subscriber cancels and allows a fresh request', async () => {
    const signals: AbortSignal[] = [];
    const fetch = vi.fn((_query: string, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<(typeof rawSpain)[]>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    });
    const search = createCachedSearch(fetch);
    const a = new AbortController();
    const first = search('spain', a.signal);
    const firstAssertion = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    await Promise.resolve();
    a.abort();
    expect(signals[0]?.aborted).toBe(true);
    await firstAssertion;
    const b = new AbortController();
    const second = search('spain', b.signal);
    const secondAssertion = expect(second).rejects.toMatchObject({ name: 'AbortError' });
    await Promise.resolve();
    b.abort();
    await secondAssertion;
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('never caches failures or starts a request for an aborted caller', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
    const search = createCachedSearch(fetch);
    await expect(search('spain', new AbortController().signal)).rejects.toThrow('offline');
    fetch.mockResolvedValue([rawSpain]);
    await expect(search('spain', new AbortController().signal)).resolves.toEqual([rawSpain]);
    expect(fetch).toHaveBeenCalledTimes(2);
    const controller = new AbortController();
    controller.abort();
    await expect(search('france', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
