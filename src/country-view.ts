import { button, el } from './dom.js';
import type { Country } from './types.js';

const numbers = new Intl.NumberFormat('ru-RU');
const format = (value: number | null) => (value === null ? 'Нет данных' : numbers.format(value));
const regions: Record<string, string> = {
  Africa: 'Африка',
  Americas: 'Америка',
  Asia: 'Азия',
  Europe: 'Европа',
  Oceania: 'Океания',
  Antarctic: 'Антарктика',
  Polar: 'Полярный регион',
  'Antarctic Ocean': 'Антарктика',
};
const regionName = (region: string) => regions[region] || region;

function flag(country: Country): HTMLElement {
  const wrap = el('div', 'flag-wrap');
  const fallback = el('span', 'flag-fallback', '◉');
  fallback.setAttribute('aria-hidden', 'true');
  if (/^[A-Z]{2}$/.test(country.code)) {
    fallback.textContent = String.fromCodePoint(
      ...[...country.code].map((letter) => 127397 + letter.charCodeAt(0)),
    );
  }
  wrap.append(fallback);
  if (country.flag.startsWith('https://')) {
    const image = el('img', 'flag');
    image.src = country.flag;
    image.alt = `Флаг страны ${country.name}`;
    image.loading = 'lazy';
    image.addEventListener('load', () => {
      fallback.hidden = true;
    });
    image.addEventListener('error', () => {
      image.remove();
      fallback.hidden = false;
    });
    fallback.hidden = true;
    wrap.append(image);
  }
  return wrap;
}

export function countryCard(country: Country, open: (country: Country) => void): HTMLElement {
  const article = el('article');
  article.setAttribute('role', 'listitem');
  const card = button('country-card', '', () => open(country));
  card.setAttribute('aria-label', `Подробнее о стране ${country.name}`);
  const body = el('div', 'card-body');
  body.append(
    el('span', 'region', regionName(country.region)),
    el('strong', 'country-name', country.name),
  );
  const facts = el('div', 'card-facts');
  for (const [label, value] of [
    ['Столица', country.capital],
    ['Население', format(country.population)],
  ]) {
    const row = el('div', 'fact');
    row.append(el('span', 'fact-label', label), el('span', 'fact-value', value));
    facts.append(row);
  }
  body.append(facts);
  const footer = el('div', 'card-footer');
  footer.append(el('span', '', 'Узнать о стране'), el('span', '', '↗'));
  card.append(flag(country), body, footer);
  article.append(card);
  return article;
}

export function createCountryDialog(): {
  node: HTMLDialogElement;
  open: (country: Country) => void;
} {
  const dialog = el('dialog', 'detail');
  dialog.setAttribute('aria-labelledby', 'country-title');
  let opener: Element | null = null;
  dialog.addEventListener('close', () => {
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  });

  return {
    node: dialog,
    open: (country) => {
      opener = document.activeElement;
      const header = el('div', 'detail-header');
      const image = flag(country);
      image.className = '';
      const close = button('close-detail', '×', () => dialog.close());
      close.setAttribute('aria-label', 'Закрыть подробности');
      header.append(image, close);
      const content = el('div', 'detail-content');
      const title = el('h2', '', country.name);
      title.id = 'country-title';
      content.append(
        el('span', 'region', regionName(country.region)),
        title,
        el('p', 'native-name', country.nativeName),
        el('p', 'description', country.description),
      );
      const facts = el('dl', 'detail-facts');
      const entries = [
        ['Столица', country.capital],
        ['Население', format(country.population)],
        ['Площадь', country.area === null ? 'Нет данных' : `${format(country.area)} км²`],
        ['Субрегион', country.subregion],
        ['Языки', country.languages.join(', ') || 'Нет данных'],
        ['Валюта', country.currencies.join(', ') || 'Нет данных'],
        ['Границы · коды ISO alpha-3', country.borders.join(', ') || 'Нет сухопутных границ'],
        ['Часовые пояса', country.timezones.join(', ') || 'Нет данных'],
      ];
      for (const [label, value] of entries) {
        const group = el('div');
        group.append(el('dt', '', label), el('dd', '', value));
        facts.append(group);
      }
      content.append(
        facts,
        el(
          'p',
          'detail-note',
          'Источник: countries.dev. Сведения приведены по данным API и могут отличаться от актуальной статистики. Описание составлено из полей ответа.',
        ),
      );
      dialog.replaceChildren(header, content);
      dialog.showModal();
      dialog.scrollTop = 0;
    },
  };
}
