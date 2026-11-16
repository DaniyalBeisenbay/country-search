# Atlas — Country Search

A live country search application for the [RS School assignment](https://github.com/rolling-scopes-school/tasks/blob/master/fullstack-engineering/tasks/country-search/README.md).

[Live demo](https://daniyalbeisenbay.github.io/country-search/) · [Pull request](https://github.com/DaniyalBeisenbay/country-search/pull/1)

**Completed:** 16.11.2026 · **Deadline:** 17.11.2026

TypeScript, Fetch API, AbortController, a handwritten debounce, and Vitest. The entire interface is created programmatically without `innerHTML`. No backend or API keys are required.

## Run locally

Requires **Node.js 22.12+**.

```sh
npm ci
npm run dev
```

Open the address printed in the terminal, usually [http://127.0.0.1:5173](http://127.0.0.1:5173).

Search using English country names, such as `Kazakhstan`, `Japan`, or `united`. Empty input never triggers a request. Suggestions, history, and form submission search immediately; typing uses a 300 ms debounce.

The development command builds and serves `dist`. After changing TypeScript, HTML, or CSS, run `npm run build` in another terminal or restart `npm run dev`.

## Commands

```sh
npm test          # 39 tests, including cancellation, timeout, and the request race
npm run lint      # ESLint and Prettier validation
npm run format    # Format the project
npm run build     # Compile ES modules with tsc and copy HTML/CSS into dist
npm run test:watch
```

## Features

- Live country search using `https://countries.dev/name/{query}`.
- Immediate cancellation on every input change, before the next debounce expires.
- Distinct idle, waiting, loading, results, empty, and error states.
- HTTP 404 means no matches; other HTTP errors and the 10-second timeout offer a retry of the latest query.
- Cards with flags, capitals, regions, and population; an accessible dialog with country details.
- A bounded LRU cache and in-flight deduplication with independent subscriber cancellation.
- The eight most recent successful queries stored in localStorage.
- Responsive layouts, keyboard access, visible focus, and reduced-motion support.

## Documentation

- [DESIGN.md](DESIGN.md): cancellation, debounce rationale, complexity, and clean code decisions.
- [TDD.md](TDD.md): separate failing-test and implementation commits.
- [PR_DESCRIPTION.md](PR_DESCRIPTION.md): submission details and verification checklist.
- [Screenshot](docs/preview.jpg).

The Husky pre-commit hook runs **only lint-staged** (ESLint and Prettier). The pre-push hook runs `npm test`. Failing TDD commits can be recorded locally, but the final pushed state must pass tests.

The repository is public by the author's choice. `main` contains only README and `.gitignore`; the application is on `country-search`. Keep the complete TDD history and leave the pull request unmerged.

## Deployment

The primary deployment is GitHub Pages at [daniyalbeisenbay.github.io/country-search](https://daniyalbeisenbay.github.io/country-search/). The `gh-pages` branch contains the compiled contents of `dist` and `.nojekyll`. GitHub Pages publishes that branch from its root. Relative asset URLs support the repository subpath.

To update the deployed application, run the checks and build, then publish the contents of `dist` to `gh-pages`. Source code and the assignment PR remain on `country-search`; generated files are not committed to that branch.

## Data

Country data comes from [countries.dev](https://countries.dev), geographic data from [GeoNames](https://www.geonames.org/) (CC BY 4.0), and flags from URLs supplied by the API. Some records may be historical. Detail descriptions are generated from returned fields rather than an encyclopedia.
