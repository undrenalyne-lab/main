import type { CountryProfile, CountryScore, UserProfile, VisaRule } from "./types";

const englishRank = { none: 0, basic: 1, functional: 2, strong: 3, fluent: 4 };
const physicalRank = { low: 0, medium: 1, high: 2, extreme: 3 };
const statusPenalty = { live: 0, beta: -6, locked: -42 };

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function countryRules(profile: UserProfile, country: CountryProfile, rules: VisaRule[]) {
  return rules.filter(
    (rule) => rule.passportCountry === profile.identity.passportCountry && rule.countryId === country.id,
  );
}

export function evaluateVisa(profile: UserProfile, country: CountryProfile, rules: VisaRule[]) {
  const matches = countryRules(profile, country, rules);
  if (!matches.length) {
    return {
      status: country.status === "locked" ? "unknown" : "conditional",
      ageGate: "unknown",
      label: "Règle à vérifier",
      blockers: ["Règle visa non branchée"],
      sourceIds: country.sourceIds || [],
    } as const;
  }

  const age = Number(profile.identity.ageExact);
  const eligible = matches.filter((rule) => {
    const minOk = rule.minAge == null || age >= rule.minAge;
    const maxOk = rule.maxAge == null || age <= rule.maxAge;
    return minOk && maxOk;
  });

  if (!eligible.length) {
    const nearest = matches[0];
    return {
      status: "blocked",
      ageGate: nearest.minAge != null && age < nearest.minAge ? "too_young" : "too_old",
      label: nearest.label,
      blockers: [`Âge ${age}: hors fenêtre pour ${nearest.label}`],
      sourceIds: nearest.sourceIds || [],
      rule: nearest,
    } as const;
  }

  const rule = eligible[0];
  return {
    status: rule.statusWhenEligible || "conditional",
    ageGate: rule.maxAge != null && age >= Number(rule.maxAge) - 1 ? "deadline_soon" : "eligible",
    label: rule.label,
    blockers: rule.statusWhenEligible === "conditional" ? ["Conditions officielles à vérifier"] : [],
    sourceIds: rule.sourceIds || [],
    rule,
  } as const;
}

function cashScore(profile: UserProfile, country: CountryProfile) {
  const target = Math.max(1, profile.money.targetMonthlyNet);
  const stableAverage = average(country.cashPaths.map((path) => path.monthlyRangeStable || 0));
  const upsideAverage = average(country.cashPaths.map((path) => path.monthlyRangeUpside || 0));
  return clamp(18 + (stableAverage / target) * 55 + (upsideAverage / target) * 25 + (country.priorityBoosts?.[profile.preferences.priority] || 0));
}

function accessScore(country: CountryProfile, visa: ReturnType<typeof evaluateVisa>) {
  let score = 52;
  if (visa.status === "eligible") score += 28;
  if (visa.status === "conditional") score += 12;
  if (visa.status === "blocked") score -= 42;
  if (visa.ageGate === "deadline_soon") score -= 6;
  if (country.status === "live") score += 10;
  if (country.status === "beta") score += 2;
  score += statusPenalty[country.status] || 0;
  return clamp(score);
}

function speedScore(profile: UserProfile, country: CountryProfile, visa: ReturnType<typeof evaluateVisa>) {
  const fastest = Math.min(...country.cashPaths.map((path) => path.timeToFirstPayWeeks?.[1] || 24), 32);
  let score = 100 - fastest * 3.2;
  if (visa.status === "blocked") score -= 45;
  if (profile.preferences.timeHorizon === "30d") score += fastest <= 4 ? 15 : -12;
  if (profile.preferences.timeHorizon === "90d") score += fastest <= 12 ? 10 : -6;
  return clamp(score);
}

function fitScore(profile: UserProfile, country: CountryProfile) {
  const tags = new Set(profile.skills.experienceTags || []);
  const signalMatches = (country.fitSignals || []).filter((tag) => tags.has(tag)).length;
  let score = 34 + signalMatches * 9 + Math.min(16, Number(profile.skills.yearsExperience || 0) * 2);
  score += ((englishRank[profile.skills.englishLevel] || 0) - (englishRank[country.englishNeed] || 0)) * 10;
  if ((country.bestFor || []).some((item) => /chantier|FIFO|remote|terrain/i.test(item))) {
    score += (physicalRank[profile.mobility.acceptsPhysicalWork] || 0) * 6;
  }
  const mobilityKey = profile.mobility.acceptsFIFO
    ? "fifo"
    : profile.mobility.acceptsRemoteSites
      ? "remote"
      : profile.mobility.willingToRelocate
        ? "national"
        : "local";
  score += country.mobilityBoosts?.[mobilityKey] || 0;
  return clamp(score);
}

function riskScore(profile: UserProfile, country: CountryProfile, visa: ReturnType<typeof evaluateVisa>) {
  let risk = 42;
  if (country.status === "live") risk -= 10;
  if (country.status === "beta") risk += 6;
  if (country.status === "locked") risk += 28;
  if (visa.status === "blocked") risk += 32;
  if (visa.status === "conditional") risk += 12;
  if (profile.money.availableCash < average(country.cashPaths.map((path) => path.entryCostLow || 0))) risk += 16;
  if (profile.preferences.riskTolerance === "low") risk += 10;
  if (profile.preferences.riskTolerance === "high") risk -= 7;
  return clamp(100 - risk);
}

function entryCost(country: CountryProfile) {
  return {
    low: Math.min(...country.cashPaths.map((path) => path.entryCostLow || 0)),
    high: Math.max(...country.cashPaths.map((path) => path.entryCostHigh || 0)),
    currency: country.currency,
    items: Array.from(new Set(country.cashPaths.flatMap((path) => path.requiredTickets || []))).slice(0, 6),
  };
}

function timeToFirstPay(country: CountryProfile) {
  return {
    lowWeeks: Math.min(...country.cashPaths.map((path) => path.timeToFirstPayWeeks?.[0] || 4)),
    highWeeks: Math.max(...country.cashPaths.map((path) => path.timeToFirstPayWeeks?.[1] || 24)),
  };
}

function monthlyRange(country: CountryProfile) {
  return {
    low: Math.round(average(country.cashPaths.map((path) => path.monthlyRangeLow || 0))),
    stable: Math.round(average(country.cashPaths.map((path) => path.monthlyRangeStable || 0))),
    upside: Math.round(average(country.cashPaths.map((path) => path.monthlyRangeUpside || 0))),
    currency: country.currency,
    netOrGross: country.netOrGross || "mixed",
  };
}

function blockers(profile: UserProfile, country: CountryProfile, visa: ReturnType<typeof evaluateVisa>) {
  const output = [...(visa.blockers || [])];
  if ((englishRank[profile.skills.englishLevel] || 0) < (englishRank[country.englishNeed] || 0)) {
    output.push("Anglais sous le niveau utile");
  }
  if (country.status === "locked") output.push("Pays non documenté proprement");
  if (profile.money.availableCash < entryCost(country).low) output.push("Capital inférieur au coût d'entrée bas");
  return output.slice(0, 5);
}

function reasons(scores: Pick<CountryScore, "accessScore" | "cashScore" | "speedScore" | "fitScore">) {
  const output = [];
  if (scores.accessScore >= 70) output.push("Accès administratif relativement bon pour ton profil");
  if (scores.cashScore >= 70) output.push("Cash plausible proche ou au-dessus de ton objectif");
  if (scores.fitScore >= 70) output.push("Tes signaux vendables collent au terrain");
  if (scores.speedScore >= 70) output.push("Délai première paie raisonnable");
  if (!output.length) output.push("Option à garder en comparaison, pas en plan prioritaire");
  return output.slice(0, 4);
}

function nextAction(country: CountryProfile, visa: ReturnType<typeof evaluateVisa>, scoreBlockers: string[]) {
  if (visa.status === "blocked") return "Ne paie rien: ouvre une route alternative sans ce verrou âge/visa.";
  if (scoreBlockers.some((item) => item.includes("Capital"))) return "Construis le budget tampon avant billet, visa ou ticket payant.";
  if (country.id === "france") return "Choisis une route France puis valide le premier ticket utile.";
  return "Vérifie la source officielle visa, puis contacte 20 recruteurs avant ticket cher.";
}

export function scoreCountry(profile: UserProfile, country: CountryProfile, visaRules: VisaRule[]): CountryScore {
  const visa = evaluateVisa(profile, country, visaRules);
  const access = accessScore(country, visa);
  const cash = cashScore(profile, country);
  const speed = speedScore(profile, country, visa);
  const fit = fitScore(profile, country);
  const risk = riskScore(profile, country, visa);
  const total = clamp(access * 0.3 + cash * 0.25 + speed * 0.2 + fit * 0.15 + risk * 0.1);
  const mainBlockers = blockers(profile, country, visa);

  const score: CountryScore = {
    countryId: country.id,
    slug: country.slug,
    name: country.name,
    status: country.status === "locked" ? "locked" : total >= 72 ? "green" : total >= 52 ? "orange" : "red",
    totalScore: Math.round(total),
    accessScore: Math.round(access),
    cashScore: Math.round(cash),
    speedScore: Math.round(speed),
    fitScore: Math.round(fit),
    riskScore: Math.round(risk),
    visaFit: visa.status,
    ageGate: visa.ageGate,
    visaLabel: visa.label,
    realisticMonthlyRange: monthlyRange(country),
    entryCost: entryCost(country),
    timeToFirstPay: timeToFirstPay(country),
    mainBlockers,
    whyRecommended: [],
    whyDangerous: Array.from(new Set([...mainBlockers, ...country.cashPaths.flatMap((path) => path.mainRisks || [])])).slice(0, 5),
    nextAction: nextAction(country, visa, mainBlockers),
    sourceIds: Array.from(new Set([...(country.sourceIds || []), ...(visa.sourceIds || [])])),
  };
  score.whyRecommended = reasons(score);
  return score;
}

export function scoreCountries(profile: UserProfile, countries: CountryProfile[], visaRules: VisaRule[]) {
  return countries
    .map((country) => scoreCountry(profile, country, visaRules))
    .sort((left, right) => right.totalScore - left.totalScore);
}
