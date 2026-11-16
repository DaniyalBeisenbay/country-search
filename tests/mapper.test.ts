import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from '../src/mapper.js';
import { rawSpain } from './fixture.js';

describe('mapCountryResponse', () => {
  it('maps the countries.dev array-based schema into card and detail data', () => {
    expect(mapCountryResponse(rawSpain)).toMatchObject({
      id: 'ESP',
      code: 'ES',
      name: 'Spain',
      nativeName: 'España',
      flag: 'https://flagcdn.com/es.svg',
      capital: 'Madrid',
      region: 'Europe',
      subregion: 'Southern Europe',
      population: 47351567,
      area: 505992,
      languages: ['Spanish'],
      currencies: ['Euro (EUR, €)'],
      borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
      timezones: ['UTC+01:00'],
    });
    expect(mapCountryResponse(rawSpain).description).toContain('Spain');
  });

  it('handles missing optional values and keeps zero distinct from missing', () => {
    expect(mapCountryResponse({ name: 'Unknown', population: 0 })).toMatchObject({
      id: 'Unknown',
      code: '',
      name: 'Unknown',
      flag: '',
      capital: 'Нет данных',
      region: 'Нет данных',
      nativeName: 'Unknown',
      population: 0,
      area: null,
      languages: [],
      currencies: [],
      borders: [],
      timezones: [],
    });
  });

  it('uses PNG when SVG is unavailable and omits incomplete language names', () => {
    expect(
      mapCountryResponse({
        name: 'Test',
        flags: { png: 'https://example.com/flag.png' },
        languages: [{}, { name: 'English' }],
        currencies: [{ code: 'USD' }, {}],
        population: -1,
        area: Number.NaN,
      }),
    ).toMatchObject({
      flag: 'https://example.com/flag.png',
      languages: ['English'],
      currencies: ['USD'],
      population: null,
      area: null,
    });
  });

  it('is pure and does not share mutable arrays with its input', () => {
    const input = structuredClone(rawSpain);
    const snapshot = structuredClone(input);
    const first = mapCountryResponse(input);
    expect(mapCountryResponse(input)).toEqual(first);
    first.borders.push('NEW');
    first.timezones.push('NEW');
    expect(input).toEqual(snapshot);
  });
});
