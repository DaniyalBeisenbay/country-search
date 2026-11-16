export const HISTORY_KEY = 'country-search:history:v1';
const HISTORY_LIMIT = 8;
const MAX_QUERY_LENGTH = 80;
export class SearchHistory {
    storage;
    queries = [];
    constructor(storage) {
        this.storage = storage;
        try {
            const parsed = JSON.parse(storage?.getItem(HISTORY_KEY) || '[]');
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    if (typeof item !== 'string')
                        continue;
                    const query = item.trim();
                    if (!query || query.length > MAX_QUERY_LENGTH)
                        continue;
                    if (!this.queries.some((value) => value.toLowerCase() === query.toLowerCase())) {
                        this.queries.push(query);
                    }
                    if (this.queries.length === HISTORY_LIMIT)
                        break;
                }
            }
        }
        catch {
            /* The app remains usable with corrupt or inaccessible storage. */
        }
    }
    get items() {
        return [...this.queries];
    }
    remember(input) {
        const query = input.trim();
        if (!query || query.length > MAX_QUERY_LENGTH)
            return;
        this.queries = [
            query,
            ...this.queries.filter((item) => item.toLowerCase() !== query.toLowerCase()),
        ].slice(0, HISTORY_LIMIT);
        try {
            this.storage?.setItem(HISTORY_KEY, JSON.stringify(this.queries));
        }
        catch {
            /* Keep the in-memory history if the disk is full or disabled. */
        }
    }
    clear() {
        this.queries = [];
        try {
            this.storage?.removeItem(HISTORY_KEY);
        }
        catch {
            /* Clearing the visible history still succeeds. */
        }
    }
}
//# sourceMappingURL=history.js.map