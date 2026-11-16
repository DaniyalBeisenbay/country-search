# TDD commit history

Each required module began with tests, an observed failing run because the module did not yet exist, and a separate `test:` commit. Only then was the implementation written, verified green, and recorded in a `feat:` commit. Tests do not use a real network or DOM.

| Required function / behavior                                                     | Failing tests | Passing implementation |
| -------------------------------------------------------------------------------- | ------------- | ---------------------- |
| debounce                                                                         | `d4d0de0`     | `438e377`              |
| searchCountries, HttpError, 404, transport cancellation, timeout                 | `6df92b7`     | `13d65bd`              |
| mapCountryResponse                                                               | `7afdcea`     | `a8227c4`              |
| AbortError / TimeoutError / HttpError / empty-result distinctions, states, retry | `80a9adf`     | `2339ed6`              |

After the base logic was covered, commit `378305c` added the request race test separately. It exercises the real API module with a fetch mock that rejects when aborted. Cancellation is asserted before the next debounce. The earlier response timer fires after the later one, and only the latest result remains.

Additional test-first pairs:

| Bonus                                 | Tests     | Implementation |
| ------------------------------------- | --------- | -------------- |
| LRU cache and independent subscribers | `b1a6c27` | `2abe3e6`      |
| History and localStorage failures     | `b9a8030` | `8f278af`      |

Initial setup `d6d8aeb` was checked with no tests using `--passWithNoTests`. The completed branch has 39 passing tests. Later English-interface and hosting updates preserve the original commit history.

Verify the sequence with:

```sh
git log --reverse --oneline
npm test
```
