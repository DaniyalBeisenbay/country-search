import { searchCountries } from './api.js';
import { debounce } from './debounce.js';
import { classifyError, type SearchFailure } from './errors.js';
import { mapCountryResponse } from './mapper.js';
import type { Country, RawCountry } from './types.js';

export const DEBOUNCE_MS = 300;
export type SearchFunction = (query: string, signal: AbortSignal) => Promise<RawCountry[]>;
export interface SearchState {
  status: 'idle' | 'waiting' | 'loading' | 'success' | 'empty' | 'error';
  query: string;
  countries: Country[];
  error?: SearchFailure;
}

/** Owns all search lifecycle transitions. It has no browser or storage dependencies. */
export class SearchController {
  private active?: AbortController;
  private disposed = false;
  private readonly scheduled = debounce(() => {
    void this.execute();
  }, DEBOUNCE_MS);
  state: SearchState = { status: 'idle', query: '', countries: [] };

  constructor(
    private readonly onChange: (state: SearchState) => void,
    private readonly search: SearchFunction = searchCountries,
  ) {}

  setQuery(query: string, immediate = false): void {
    if (this.disposed) return;
    // Cancel at the input event, before waiting for debounce.
    this.cancel();
    const normalized = query.trim();
    this.publish({ status: normalized ? 'waiting' : 'idle', query: normalized, countries: [] });
    if (!normalized) return;
    if (immediate) void this.execute();
    else this.scheduled();
  }

  retry(): void {
    if (this.disposed || !this.state.query) return;
    this.cancel();
    void this.execute();
  }

  dispose(): void {
    this.disposed = true;
    this.cancel();
  }

  private cancel(): void {
    this.scheduled.cancel();
    this.active?.abort();
    this.active = undefined;
  }

  private publish(state: SearchState): void {
    if (this.disposed) return;
    this.state = state;
    this.onChange(state);
  }

  private async execute(): Promise<void> {
    const query = this.state.query;
    const controller = new AbortController();
    this.active = controller;
    this.publish({ status: 'loading', query, countries: [] });
    try {
      const response = await this.search(query, controller.signal);
      // Abort is the cancellation mechanism; this check also protects the mapping microtask.
      controller.signal.throwIfAborted();
      const countries = response.map(mapCountryResponse);
      this.publish({ status: countries.length ? 'success' : 'empty', query, countries });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      const failure = classifyError(error);
      this.publish({
        status: failure ? 'error' : 'idle',
        query,
        countries: [],
        ...(failure ? { error: failure } : {}),
      });
    } finally {
      // A cancelled request may settle after its successor has already started.
      if (this.active === controller) this.active = undefined;
    }
  }
}
