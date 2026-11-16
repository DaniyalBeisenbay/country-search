import { searchCountries } from './api.js';
/** Bounded LRU cache. The shared fetch belongs to its subscribers collectively. */
export function createCachedSearch(search = searchCountries, capacity = 30) {
    const cache = new Map();
    const pending = new Map();
    return async (query, signal) => {
        signal.throwIfAborted();
        const key = query.trim().toLowerCase();
        if (!key)
            return [];
        const cached = cache.get(key);
        if (cached) {
            cache.delete(key);
            cache.set(key, cached);
            return cached;
        }
        let shared = pending.get(key);
        if (!shared) {
            const controller = new AbortController();
            const entry = {
                controller,
                subscribers: 0,
                settled: false,
                promise: Promise.resolve().then(() => search(key, controller.signal)),
            };
            entry.promise = entry.promise
                .then((countries) => {
                controller.signal.throwIfAborted();
                if (capacity > 0) {
                    cache.set(key, countries);
                    if (cache.size > capacity) {
                        const oldest = cache.keys().next().value;
                        if (oldest !== undefined)
                            cache.delete(oldest);
                    }
                }
                return countries;
            })
                .finally(() => {
                entry.settled = true;
                if (pending.get(key) === entry)
                    pending.delete(key);
            });
            pending.set(key, entry);
            shared = entry;
        }
        const entry = shared;
        entry.subscribers += 1;
        return new Promise((resolve, reject) => {
            let finished = false;
            const release = () => {
                if (finished)
                    return false;
                finished = true;
                signal.removeEventListener('abort', onAbort);
                entry.subscribers -= 1;
                if (!entry.settled && entry.subscribers === 0) {
                    entry.controller.abort();
                    if (pending.get(key) === entry)
                        pending.delete(key);
                }
                return true;
            };
            const onAbort = () => {
                if (release())
                    reject(signal.reason);
            };
            signal.addEventListener('abort', onAbort, { once: true });
            entry.promise.then((countries) => {
                if (release())
                    resolve(countries);
            }, (error) => {
                if (release())
                    reject(error);
            });
        });
    };
}
//# sourceMappingURL=cache.js.map