export interface RawCountry {
  name: string;
  nativeName?: string;
  alpha2Code?: string;
  alpha3Code?: string;
  capital?: string;
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  flags?: { svg?: string; png?: string };
  languages?: { name?: string; nativeName?: string }[];
  currencies?: { name?: string; code?: string; symbol?: string }[];
  borders?: string[];
  timezones?: string[];
}

export interface Country {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  capital: string;
  region: string;
  subregion: string;
  population: number | null;
  area: number | null;
  languages: string[];
  currencies: string[];
  borders: string[];
  timezones: string[];
  description: string;
}
