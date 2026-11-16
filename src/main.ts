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
brand.append(el('span', 'brand-mark', '◎'), el('span', '', 'атлас'));
header.append(brand, el('span', 'header-note', 'Маленькое окно в большой мир'));

const main = el('main');
const hero = el('section', 'hero');
hero.setAttribute('aria-labelledby', 'hero-title');
const intro = el('div');
const eyebrow = el('div', 'eyebrow');
eyebrow.append(el('span', 'dot'), el('span', '', 'География начинается с любопытства'));
const heading = el('h1');
heading.id = 'hero-title';
heading.append(document.createTextNode('Мир ближе,'), el('br'), el('em', '', 'чем кажется.'));
intro.append(
  eyebrow,
  heading,
  el(
    'p',
    'hero-copy',
    'От знакомых столиц до далёких островов. Найдите страну и узнайте о ней чуть больше.',
  ),
);
const illustration = el('div', 'globe-scene');
illustration.setAttribute('aria-hidden', 'true');
illustration.append(
  globe(),
  el('span', 'globe-label', 'ОДНА ПЛАНЕТА · ТЫСЯЧИ ОТКРЫТИЙ'),
  el('span', 'globe-caption', '48° N / 68° E'),
);
hero.append(intro, illustration);

const searchArea = el('section', 'search-area');
searchArea.setAttribute('aria-label', 'Поиск стран');
const form = el('form', 'search-form');
form.setAttribute('role', 'search');
const label = el('label', 'sr-only', 'Название страны на английском');
label.htmlFor = 'country-search';
const input = el('input', 'search-input');
input.id = 'country-search';
input.type = 'search';
input.placeholder = 'Какую страну вы хотите открыть?';
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
clear.setAttribute('aria-label', 'Очистить поиск');
form.append(label, searchIcon(), input, clear);
const hint = el(
  'p',
  'search-hint',
  'Введите название на английском — например, Kazakhstan. Поиск начнётся автоматически.',
);
hint.id = 'search-hint';
const suggestions = el('div', 'suggestions');
suggestions.append(el('span', 'suggestions-label', 'Начните с небольшого путешествия:'));
for (const [name, query] of [
  ['🇰🇿 Казахстан', 'Kazakhstan'],
  ['🇯🇵 Япония', 'Japan'],
  ['🇮🇹 Италия', 'Italy'],
  ['🇧🇷 Бразилия', 'Brazil'],
]) {
  suggestions.append(button('chip', name || '', () => chooseQuery(query || '')));
}
const historyArea = el('div', 'history');
searchArea.append(form, hint, suggestions, historyArea);

const resultsSection = el('section', 'results-section');
resultsSection.setAttribute('aria-labelledby', 'results-heading');
const resultsHeader = el('div', 'results-header');
const resultsTitle = el('h2', '', 'Ваше следующее открытие');
resultsTitle.id = 'results-heading';
const count = el('span', 'results-count', 'Начните с поиска');
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
footer.append(el('span', '', 'С любопытством к миру. Атлас стран.'));
const credit = el('div', 'footer-credit');
credit.append(
  document.createTextNode('Данные: '),
  link('countries.dev', 'https://countries.dev'),
  document.createTextNode(' · '),
  link('GeoNames (CC BY 4.0)', 'https://www.geonames.org/'),
  el('br'),
  document.createTextNode('Учебный проект · RS School'),
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
  historyArea.append(el('span', 'suggestions-label', 'Вы искали:'));
  for (const query of history.items) {
    historyArea.append(button('chip', query, () => chooseQuery(query)));
  }
  historyArea.append(
    button('text-button', 'Очистить историю', () => {
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
      button('primary-button', 'Повторить', () => {
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
  resultsTitle.textContent = state.query
    ? `Результаты поиска «${state.query}»`
    : 'Ваше следующее открытие';
  let status = '';
  if (state.status === 'success') {
    count.textContent = `Найдено: ${state.countries.length}`;
    results.append(...state.countries.map((country) => countryCard(country, detail.open)));
    history.remember(state.query);
    renderHistory();
    status = `Найдено стран: ${state.countries.length}`;
  } else if (state.status === 'waiting' || state.status === 'loading') {
    status = state.status === 'waiting' ? 'Ожидаем завершения ввода…' : 'Ищем страны…';
    const panel = statePanel('', status, 'Ещё немного — и можно отправляться в путешествие.');
    panel.querySelector('.state-icon')?.replaceChildren(el('span', 'spinner'));
    results.append(panel);
  } else if (state.status === 'empty') {
    status = 'Пока ничего не нашлось';
    results.append(
      statePanel(
        '⌕',
        status,
        'Попробуйте другое название или проверьте написание. Названия стран нужно вводить на английском.',
      ),
    );
    count.textContent = 'Найдено: 0';
  } else if (state.status === 'error') {
    status =
      state.error?.kind === 'timeout'
        ? 'Поиск занял слишком много времени'
        : 'Не удалось продолжить путешествие';
    results.append(statePanel('!', status, state.error?.message || 'Попробуйте ещё раз.', true));
  } else {
    status = 'Какое место вас вдохновляет?';
    count.textContent = 'Начните с поиска';
    results.append(
      statePanel(
        '◎',
        status,
        'Введите название страны выше. Здесь появятся флаги, столицы и маленькие поводы узнать мир лучше.',
      ),
    );
  }
  announcement.textContent = status;
}
