import { button, el } from './dom.js';
const numbers = new Intl.NumberFormat('en-US');
const format = (value) => (value === null ? 'Not available' : numbers.format(value));
function flag(country) {
    const wrap = el('div', 'flag-wrap');
    const fallback = el('span', 'flag-fallback', '◉');
    fallback.setAttribute('aria-hidden', 'true');
    if (/^[A-Z]{2}$/.test(country.code)) {
        fallback.textContent = String.fromCodePoint(...[...country.code].map((letter) => 127397 + letter.charCodeAt(0)));
    }
    wrap.append(fallback);
    if (country.flag.startsWith('https://')) {
        const image = el('img', 'flag');
        image.src = country.flag;
        image.alt = `Flag of ${country.name}`;
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
export function countryCard(country, open) {
    const article = el('article');
    article.setAttribute('role', 'listitem');
    const card = button('country-card', '', () => open(country));
    card.setAttribute('aria-label', `Explore ${country.name}`);
    const body = el('div', 'card-body');
    body.append(el('span', 'region', country.region), el('strong', 'country-name', country.name));
    const facts = el('div', 'card-facts');
    for (const [label, value] of [
        ['Capital', country.capital],
        ['Population', format(country.population)],
    ]) {
        const row = el('div', 'fact');
        row.append(el('span', 'fact-label', label), el('span', 'fact-value', value));
        facts.append(row);
    }
    body.append(facts);
    const footer = el('div', 'card-footer');
    footer.append(el('span', '', 'Explore country'), el('span', '', '↗'));
    card.append(flag(country), body, footer);
    article.append(card);
    return article;
}
export function createCountryDialog() {
    const dialog = el('dialog', 'detail');
    dialog.setAttribute('aria-labelledby', 'country-title');
    let opener = null;
    dialog.addEventListener('close', () => {
        if (opener instanceof HTMLElement && opener.isConnected)
            opener.focus();
    });
    dialog.addEventListener('click', (event) => {
        if (event.target !== dialog)
            return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
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
            close.setAttribute('aria-label', 'Close country details');
            header.append(image, close);
            const content = el('div', 'detail-content');
            const title = el('h2', '', country.name);
            title.id = 'country-title';
            content.append(el('span', 'region', country.region), title, el('p', 'native-name', country.nativeName), el('p', 'description', country.description));
            const facts = el('dl', 'detail-facts');
            const entries = [
                ['Capital', country.capital],
                ['Population', format(country.population)],
                ['Area', country.area === null ? 'Not available' : `${format(country.area)} km²`],
                ['Subregion', country.subregion],
                ['Languages', country.languages.join(', ') || 'Not available'],
                ['Currency', country.currencies.join(', ') || 'Not available'],
                ['Borders · ISO alpha-3 codes', country.borders.join(', ') || 'No land borders'],
                ['Time zones', country.timezones.join(', ') || 'Not available'],
            ];
            for (const [label, value] of entries) {
                const group = el('div');
                group.append(el('dt', '', label), el('dd', '', value));
                facts.append(group);
            }
            content.append(facts, el('p', 'detail-note', 'Source: countries.dev. API data may differ from current statistics. The description is generated from the returned fields.'));
            dialog.replaceChildren(header, content);
            dialog.showModal();
            dialog.scrollTop = 0;
        },
    };
}
//# sourceMappingURL=country-view.js.map