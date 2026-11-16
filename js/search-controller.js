import { searchCountries } from './api.js';
import { debounce } from './debounce.js';
import { classifyError } from './errors.js';
import { mapCountryResponse } from './mapper.js';
export const DEBOUNCE_MS = 300;
/** Owns all search lifecycle transitions. It has no browser or storage dependencies. */
export class SearchController {
    onChange;
    search;
    active;
    disposed = false;
    scheduled = debounce(() => {
        void this.execute();
    }, DEBOUNCE_MS);
    state = { status: 'idle', query: '', countries: [] };
    constructor(onChange, search = searchCountries) {
        this.onChange = onChange;
        this.search = search;
    }
    setQuery(query, immediate = false) {
        if (this.disposed)
            return;
        // Cancel at the input event, before waiting for debounce.
        this.cancel();
        const normalized = query.trim();
        this.publish({ status: normalized ? 'waiting' : 'idle', query: normalized, countries: [] });
        if (!normalized)
            return;
        if (immediate)
            void this.execute();
        else
            this.scheduled();
    }
    retry() {
        if (this.disposed || !this.state.query)
            return;
        this.cancel();
        void this.execute();
    }
    dispose() {
        this.disposed = true;
        this.cancel();
    }
    cancel() {
        this.scheduled.cancel();
        this.active?.abort();
        this.active = undefined;
    }
    publish(state) {
        if (this.disposed)
            return;
        this.state = state;
        this.onChange(state);
    }
    async execute() {
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
        }
        catch (error) {
            if (controller.signal.aborted)
                return;
            const failure = classifyError(error);
            this.publish({
                status: failure ? 'error' : 'idle',
                query,
                countries: [],
                ...(failure ? { error: failure } : {}),
            });
        }
        finally {
            // A cancelled request may settle after its successor has already started.
            if (this.active === controller)
                this.active = undefined;
        }
    }
}
//# sourceMappingURL=search-controller.js.map