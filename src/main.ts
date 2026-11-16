import { createCachedSearch } from './cache.js';
import { countryCard, createCountryDialog } from './country-view.js';
import { button, el, globe, link, searchIcon } from './dom.js';
import { SearchHistory } from './history.js';
import { SearchController, type SearchState } from './search-controller.js';

function createHistory(): SearchHistory {
  try {
    return new SearchHistory(window.localStorage);
  } catch {
    return new SearchHistory();
  }
}

const history = createHistory();
const shell = el('div', 'shell');
const header = el('header', 'header');
const brand = el('div', 'brand');
brand.append(el('span', 'brand-mark', '◎'), el('span', '', 'atlas'));
header.append(brand, el('span', 'header-note', 'A little window to the world'));

const main = el('main');
const hero = el('section', 'hero');
hero.setAttribute('aria-labelledby', 'hero-title');
const intro = el('div');
const eyebrow = el('div', 'eyebrow');
eyebrow.append(el('span', 'dot'), el('span', '', 'Every journey starts with curiosity'));
const heading = el('h1');
heading.id = 'hero-title';
heading.append(
  document.createTextNode('The world is closer'),
  el('br'),
  el('em', '', 'than you think.'),
);
intro.append(
  eyebrow,
  heading,
  el(
    'p',
    'hero-copy',
    'From familiar capitals to faraway islands. Find a country and discover a little more.',
  ),
);
const illustration = el('div', 'globe-scene');
illustration.setAttribute('aria-hidden', 'true');
illustration.append(
  globe(),
  el('span', 'globe-label', 'ONE PLANET · ENDLESS DISCOVERIES'),
  el('span', 'globe-caption', '48° N / 68° E'),
);
hero.append(intro, illustration);

const searchArea = el('section', 'search-area');
searchArea.setAttribute('aria-label', 'Country search');
const form = el('form', 'search-form');
form.setAttribute('role', 'search');
const label = el('label', 'sr-only', 'Country name in English');
label.htmlFor = 'country-search';
const input = el('input', 'search-input');
input.id = 'country-search';
input.type = 'search';
input.placeholder = 'Where would you like to explore?';
input.autocomplete = 'off';
input.spellcheck = false;
input.maxLength = 80;
input.setAttribute('aria-describedby', 'search-hint');
input.setAttribute('aria-controls', 'search-results');
const clear = button('clear', '×', () => {
  input.value = '';
  app.setQuery('');
  input.focus();
});
clear.hidden = true;
clear.setAttribute('aria-label', 'Clear search');
form.append(label, searchIcon(), input, clear);
const hint = el(
  'p',
  'search-hint',
  'Enter a country name in English, such as Kazakhstan. Results appear as you type.',
);
hint.id = 'search-hint';
const suggestions = el('div', 'suggestions');
suggestions.append(el('span', 'suggestions-label', 'Start with a little inspiration:'));
for (const [name, query] of [
  ['🇰🇿 Kazakhstan', 'Kazakhstan'],
  ['🇯🇵 Japan', 'Japan'],
  ['🇮🇹 Italy', 'Italy'],
  ['🇧🇷 Brazil', 'Brazil'],
]) {
  suggestions.append(button('chip', name || '', () => chooseQuery(query || '')));
}
const historyArea = el('div', 'history');
searchArea.append(form, hint, suggestions, historyArea);

const resultsSection = el('section', 'results-section');
resultsSection.setAttribute('aria-labelledby', 'results-heading');
const resultsHeader = el('div', 'results-header');
const resultsTitle = el('h2', '', 'Your next discovery');
resultsTitle.id = 'results-heading';
const count = el('span', 'results-count', 'Start exploring');
resultsHeader.append(resultsTitle, count);
const announcement = el('p', 'sr-only');
announcement.setAttribute('role', 'status');
announcement.setAttribute('aria-live', 'polite');
const results = el('div', 'results-grid');
results.id = 'search-results';
results.setAttribute('role', 'list');
resultsSection.append(resultsHeader, announcement, results);
main.append(hero, searchArea, resultsSection);

const footer = el('footer', 'footer');
footer.append(el('span', '', 'Stay curious. Explore with Atlas.'));
const credit = el('div', 'footer-credit');
credit.append(
  document.createTextNode('Data: '),
  link('countries.dev', 'https://countries.dev'),
  document.createTextNode(' · '),
  link('GeoNames (CC BY 4.0)', 'https://www.geonames.org/'),
  el('br'),
  document.createTextNode('Learning project · RS School'),
);
footer.append(credit);
const detail = createCountryDialog();
shell.append(header, main, footer);
document.body.append(shell, detail.node);

const app = new SearchController(renderState, createCachedSearch());
input.addEventListener('input', () => app.setQuery(input.value));
form.addEventListener('submit', (event) => {
  event.preventDefault();
  app.setQuery(input.value, true);
});
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) app.dispose();
});
renderHistory();
renderState(app.state);

function chooseQuery(query: string): void {
  input.value = query;
  app.setQuery(query, true);
  input.focus();
}

function renderHistory(): void {
  historyArea.replaceChildren();
  if (!history.items.length) return;
  historyArea.append(el('span', 'suggestions-label', 'Recent searches:'));
  for (const query of history.items) {
    historyArea.append(button('chip', query, () => chooseQuery(query)));
  }
  historyArea.append(
    button('text-button', 'Clear history', () => {
      history.clear();
      renderHistory();
      input.focus();
    }),
  );
}

function statePanel(icon: string, title: string, message: string, isError = false): HTMLElement {
  const panel = el('div', `state${isError ? ' error' : ''}`);
  const decoration = el('div', 'state-icon', icon);
  decoration.setAttribute('aria-hidden', 'true');
  panel.append(decoration, el('h3', '', title), el('p', '', message));
  if (isError)
    panel.append(
      button('primary-button', 'Retry', () => {
        input.focus();
        app.retry();
      }),
    );
  return panel;
}

function renderState(state: SearchState): void {
  clear.hidden = !input.value;
  results.replaceChildren();
  results.setAttribute('aria-busy', String(state.status === 'loading'));
  count.textContent = '';
  resultsTitle.textContent = state.query ? `Results for “${state.query}”` : 'Your next discovery';
  let status = '';
  if (state.status === 'success') {
    count.textContent = `Found: ${state.countries.length}`;
    results.append(...state.countries.map((country) => countryCard(country, detail.open)));
    history.remember(state.query);
    renderHistory();
    status = `Countries found: ${state.countries.length}`;
  } else if (state.status === 'waiting' || state.status === 'loading') {
    status =
      state.status === 'waiting' ? 'Waiting for you to finish typing…' : 'Searching for countries…';
    const panel = statePanel('', status, 'Just a moment. Your next discovery is on its way.');
    panel.querySelector('.state-icon')?.replaceChildren(el('span', 'spinner'));
    results.append(panel);
  } else if (state.status === 'empty') {
    status = 'No countries found';
    results.append(
      statePanel(
        '⌕',
        status,
        'Try another name or check your spelling. Search using country names in English.',
      ),
    );
    count.textContent = 'Found: 0';
  } else if (state.status === 'error') {
    status =
      state.error?.kind === 'timeout'
        ? 'The search took too long'
        : 'We could not load your next discovery';
    results.append(statePanel('!', status, state.error?.message || 'Please try again.', true));
  } else {
    status = 'Where will curiosity take you?';
    count.textContent = 'Start exploring';
    results.append(
      statePanel(
        '◎',
        status,
        'Search for a country above. Discover its flag, capital, and a few more reasons to explore.',
      ),
    );
  }
  announcement.textContent = status;
}
