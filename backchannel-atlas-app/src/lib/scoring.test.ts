import { countries, rules } from "./core-data";
import { demoProfiles } from "./profile";
import { scoreCountries } from "./scoring";

const scores32 = scoreCountries(demoProfiles.kevin32, countries, rules);
const scores37 = scoreCountries(demoProfiles.kevin37, countries, rules);

const australia32 = scores32.find((score) => score.countryId === "australia");
const australia37 = scores37.find((score) => score.countryId === "australia");

if (!australia32 || !australia37) {
  throw new Error("Australia score missing");
}

if (australia32.ageGate === australia37.ageGate && australia32.visaFit === australia37.visaFit) {
  throw new Error("Expected Kevin 32 and Kevin 37 to differ on Australia visa/age gate");
}

if (scores32[0]?.countryId === scores37[0]?.countryId && australia32.totalScore === australia37.totalScore) {
  throw new Error("Expected demo profiles to produce meaningfully different scoring");
}

console.log("Scoring tests passed", {
  kevin32Top: scores32[0]?.countryId,
  kevin37Top: scores37[0]?.countryId,
  australia32: australia32.ageGate,
  australia37: australia37.ageGate,
});
