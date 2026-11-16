import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../src/debounce.js';

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits for the entire delay and forwards the latest arguments', () => {
    const callback = vi.fn();
    const run = debounce(callback, 300);
    run('s');
    vi.advanceTimersByTime(200);
    run('spain', 42);
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledExactlyOnceWith('spain', 42);
  });

  it('supports cancelling a scheduled call, then scheduling again', () => {
    const callback = vi.fn();
    const run = debounce(callback, 300);
    run();
    run.cancel();
    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
    run();
    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledOnce();
  });
});
