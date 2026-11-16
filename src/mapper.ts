import type { Country, RawCountry } from './types.js';

const missing = 'Нет данных';
const nonnegative = (value: number | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

export function mapCountryResponse(raw: RawCountry): Country {
  const region = raw.region || missing;
  const capital = raw.capital || missing;
  return {
    id: raw.alpha3Code || raw.alpha2Code || raw.name,
    code: raw.alpha2Code || '',
    name: raw.name,
    nativeName: raw.nativeName || raw.name,
    flag: raw.flags?.svg || raw.flags?.png || '',
    capital,
    region,
    subregion: raw.subregion || missing,
    population: nonnegative(raw.population),
    area: nonnegative(raw.area),
    languages: (raw.languages || []).flatMap((language) => (language.name ? [language.name] : [])),
    currencies: (raw.currencies || []).flatMap((currency) => {
      const details = [currency.code, currency.symbol].filter(Boolean).join(', ');
      const name = currency.name || '';
      const label = name && details ? `${name} (${details})` : name || details;
      return label ? [label] : [];
    }),
    borders: [...(raw.borders || [])],
    timezones: [...(raw.timezones || [])],
    description: [
      `${raw.name}.`,
      raw.region ? `Регион: ${raw.region}.` : '',
      raw.subregion ? `Часть света: ${raw.subregion}.` : '',
      raw.capital ? `Столица: ${raw.capital}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
  };
}
