import { HttpError } from './api.js';
export function classifyError(error) {
    const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : '';
    if (name === 'AbortError')
        return null;
    if (name === 'TimeoutError') {
        return {
            kind: 'timeout',
            message: 'The server did not respond within 10 seconds. Please try again.',
        };
    }
    if (error instanceof HttpError) {
        return {
            kind: 'http',
            status: error.status,
            message: error.status === 429
                ? 'Too many requests. Wait a moment and try again.'
                : `The country service is temporarily unavailable (HTTP ${error.status}). Please try again.`,
        };
    }
    return {
        kind: 'network',
        message: 'Could not load countries. Check your internet connection and try again.',
    };
}
//# sourceMappingURL=errors.js.map