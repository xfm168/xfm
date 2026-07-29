export * from './types';
import type { LocationsDB } from './types';
import { CHINA_COUNTRY } from './china';
import { GLOBAL_COUNTRIES } from './global';
export const LOCATIONS_DB: LocationsDB = {
  countries: [CHINA_COUNTRY, ...GLOBAL_COUNTRIES],
};
