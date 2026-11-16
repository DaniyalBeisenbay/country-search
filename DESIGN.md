# Country Search architecture

## Cancellation and request races

`SearchController.setQuery` in `src/search-controller.ts` runs on **every input event**. It cancels the scheduled debounce and aborts the active controller before publishing a new state or scheduling another search. This prevents an older result from appearing during the 300 ms debounce gap. Clearing input cancels both pending timers and the active network request.

`searchCountries` in `src/api.ts` passes a real signal to `fetch`. It uses a manual equivalent of `AbortSignal.any`: an owned controller forwards the caller's abort reason, while a separate 10-second timer aborts with `DOMException(..., 'TimeoutError')`. Caller cancellation normally carries `AbortError`. The `finally` block clears the timer and removes the listener. This composition does not require browser support for `AbortSignal.any`.

After `await`, `signal.throwIfAborted()` also protects the microtask between Promise resolution and mapping. It complements actual transport cancellation; it does not replace it. The controller comparison in `finally` prevents an older request from clearing the reference to a newer active request.

`src/errors.ts` distinguishes cancellation, timeout, `HttpError`, and network or unexpected errors. Caller cancellation is silent. Timeout and genuine failures show a message with retry. The API converts HTTP 404 into `[]`, so it becomes the empty state rather than an error. Other non-success statuses throw `HttpError` with the status. Checking `response.ok` is essential because fetch does not reject merely because a response is HTTP 500. `retry()` cancels pending work and immediately searches the latest `state.query`.

## Why a 300 ms debounce

The handwritten function in `src/debounce.ts` resets its timer whenever called and exposes cancellation. A 300 ms delay combines several consecutive keystrokes without making the interface feel slow. Removing it creates a request for nearly every letter. Increasing it to one or two seconds makes the interface feel unresponsive. Suggestions, history, and explicit form submission bypass the delay.

## Cache and independent subscribers

`createCachedSearch` in `src/cache.ts` normalizes keys with `trim().toLowerCase()`. Successful responses, including empty arrays, enter a bounded 30-entry LRU cache. Errors and aborted responses are never cached. The cache lasts until page reload.

Concurrent equal queries share an internal Promise and network controller. Each caller receives a separate Promise and listens to its own abort signal. Cancelling one subscriber rejects only that caller's Promise. When the last subscriber leaves, the shared fetch is aborted synchronously and its in-flight entry is removed, allowing a new call to start a fresh request. Cleanup removes an entry only if it still refers to the same request.

## History

`SearchHistory` in `src/history.ts` stores the eight latest successful queries. It removes case-insensitive duplicates and validates JSON loaded from localStorage. Invalid entries are ignored. If storage is inaccessible, corrupted, or full, the application continues with in-memory history. Selecting history searches immediately and can reuse the cache.

## Complexity

- `mapCountryResponse`: **O(L + C + B + T)** time and extra space for languages, currencies, borders, and time zones. Accounting for text processing also adds the total string length. Output arrays are independent and input data is never mutated.
- Cache/in-flight lookup, LRU reordering, and eviction use average **O(1)** Map operations. Key normalization costs **O(q)** for query length. Cache hits return the shared raw array; the mapper creates independent display models.
- Registering or cancelling one subscriber costs **O(1)**; delivering a shared response to S subscribers costs **O(S)**.
- Cache storage is bounded to 30 responses, with response size depending on the number of matches. In-flight memory depends on active keys and subscribers.
- History operations are bounded by eight entries; for a general H-entry history, duplicate detection and filtering cost **O(H)**.

## Clean code and module boundaries

- Single responsibility: `api.ts` owns HTTP and deadlines, `mapper.ts` transforms data, `search-controller.ts` manages lifecycle states, and `country-view.ts` renders cards and details.
- Dependency injection: the controller accepts a search function, the cache accepts a transport, and history accepts a storage interface. Tests require neither a DOM nor the internet.
- Pure mapping: `mapCountryResponse` has no network or DOM effects and does not mutate its input.
- Explicit names and constants: `DEBOUNCE_MS`, `REQUEST_TIMEOUT_MS`, and `HISTORY_LIMIT` make timing and capacity decisions visible.
- Safe DOM construction: `dom.ts`, `country-view.ts`, and `main.ts` use `createElement`, `textContent`, `append`, and `replaceChildren`; dynamic content is never parsed as HTML.
- Accessibility: an input label, live status announcements, a native dialog with Escape and focus restoration, descriptive button names, visible focus, and reduced-motion styles.

## Verification and data limitations

The 39 Vitest tests use fixtures, fake timers, and mocked fetch. The separate race test schedules the earlier response after the later one, rejects on signal abort, checks cancellation synchronously before the next debounce, and verifies that only the latest result survives. Tests also cover clearing, disposal, cache eviction, deduplication, independent subscribers, and storage failures.

The countries.dev schema uses string names and capitals and arrays of language and currency objects. Values are displayed as returned, even when a record contains an older capital name or historical population. The API has no encyclopedia-style description; detail text is generated from name, region, subregion, and capital. Borders are shown as ISO alpha-3 codes; an empty border list is displayed as no land borders.

The interface and documentation are in English, using `en-US` number formatting. Native country names remain proper names supplied by the API. Minimum tooling is Node.js 22.12+ and a modern browser with Fetch, AbortController, and HTMLDialogElement. Production compilation uses `tsc` ES modules; Vite is only the local development server. The primary deployment is GitHub Pages.
