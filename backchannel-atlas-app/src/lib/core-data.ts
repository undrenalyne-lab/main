import countryProfiles from "@/data/country_profiles.json";
import mobilitySources from "@/data/mobility_sources.json";
import visaRules from "@/data/visa_rules.json";
import type { CountryProfile, Source, VisaRule } from "./types";

export const countries = countryProfiles.countries as unknown as CountryProfile[];
export const rules = visaRules.rules as unknown as VisaRule[];
export const sources = mobilitySources as unknown as Source[];

export const countryMap = new Map(countries.map((country) => [country.id, country]));
export const countrySlugMap = new Map(countries.map((country) => [country.slug, country]));
export const sourceMap = new Map(sources.map((source) => [source.id, source]));

export function getCountryBySlug(slug: string | undefined) {
  return countrySlugMap.get(slug || "") || countries[0];
}
