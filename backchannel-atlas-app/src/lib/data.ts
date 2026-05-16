import worldCountries from "@/data/world_countries_110m.json";
import { countries, countryMap, countrySlugMap, getCountryBySlug, rules, sourceMap, sources } from "./core-data";
import type { WorldFeature } from "./types";

export const worldFeatures = worldCountries.features as WorldFeature[];

export { countries, countryMap, countrySlugMap, getCountryBySlug, rules, sourceMap, sources };
