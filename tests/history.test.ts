import { describe, expect, it, vi } from 'vitest';
import { SearchHistory, HISTORY_KEY } from '../src/history.js';

const storage = (value: string | null = null) => ({
  getItem: vi.fn(() => value),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

describe('search history', () => {
  it('persists recent queries, removes case-insensitive duplicates, and keeps at most eight', () => {
    const disk = storage();
    const history = new SearchHistory(disk);
    for (let i = 0; i < 10; i++) history.remember(`country ${i}`);
    history.remember(' Country 5 ');
    expect(history.items).toHaveLength(8);
    expect(history.items[0]).toBe('Country 5');
    expect(history.items.filter((item) => item.toLowerCase() === 'country 5')).toHaveLength(1);
    expect(disk.setItem).toHaveBeenLastCalledWith(HISTORY_KEY, JSON.stringify(history.items));
    history.clear();
    expect(history.items).toEqual([]);
    expect(disk.removeItem).toHaveBeenCalledWith(HISTORY_KEY);
  });
  it('validates untrusted storage and ignores corrupted JSON', () => {
    expect(new SearchHistory(storage('{broken')).items).toEqual([]);
    expect(new SearchHistory(storage('{"not":"array"}')).items).toEqual([]);
    expect(new SearchHistory(storage('[null,42," Spain ","spain",""]')).items).toEqual(['Spain']);
  });
  it('works in memory when storage is unavailable or throws', () => {
    const unavailable = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    const history = new SearchHistory(unavailable);
    expect(() => history.remember('spain')).not.toThrow();
    expect(history.items).toEqual(['spain']);
    expect(() => history.clear()).not.toThrow();
    const memory = new SearchHistory();
    memory.remember('japan');
    expect(memory.items).toEqual(['japan']);
  });
});
