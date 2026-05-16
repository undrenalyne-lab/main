const englishRank = {
  none: 0,
  basic: 1,
  functional: 2,
  strong: 3,
  fluent: 4,
};

const physicalRank = {
  low: 0,
  medium: 1,
  high: 2,
  extreme: 3,
};

const statusPenalty = {
  live: 0,
  beta: -6,
  locked: -42,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function getRulesForCountry(profile, country, rules) {
  return rules.filter(
    (rule) =>
      rule.passportCountry === profile.identity.passportCountry &&
      rule.countryId === country.id,
  );
}

export function evaluateVisa(profile, country, rules) {
  const countryRules = getRulesForCountry(profile, country, rules);
  if (!countryRules.length) {
    return {
      status: country.status === "locked" ? "unknown" : "conditional",
      ageGate: "unknown",
      label: "Regle a verifier",
      blockers: ["Regle visa non branchee"],
      sourceIds: country.sourceIds || [],
    };
  }

  const age = Number(profile.identity.ageExact);
  const eligibleRules = countryRules.filter((rule) => {
    const minOk = rule.minAge == null || age >= rule.minAge;
    const maxOk = rule.maxAge == null || age <= rule.maxAge;
    return minOk && maxOk;
  });

  if (!eligibleRules.length) {
    const nearest = countryRules[0];
    return {
      status: "blocked",
      ageGate: age < nearest.minAge ? "too_young" : "too_old",
      label: nearest.label,
      blockers: [`Age ${age}: hors fenetre pour ${nearest.label}`],
      sourceIds: nearest.sourceIds || [],
      rule: nearest,
    };
  }

  const rule = eligibleRules[0];
  const deadlineSoon =
    rule.maxAge != null && age >= Number(rule.maxAge) - 1
      ? "deadline_soon"
      : "eligible";

  return {
    status: rule.statusWhenEligible || "conditional",
    ageGate: deadlineSoon,
    label: rule.label,
    blockers: rule.statusWhenEligible === "conditional" ? ["Conditions officielles a verifier"] : [],
    sourceIds: rule.sourceIds || [],
    rule,
  };
}

function cashScore(profile, country) {
  const paths = country.cashPaths || [];
  const target = Math.max(1, profile.money.targetMonthlyNet);
  const stableAverage = average(paths.map((path) => path.monthlyRangeStable || 0));
  const upsideAverage = average(paths.map((path) => path.monthlyRangeUpside || 0));
  const targetFit = (stableAverage / target) * 55;
  const upsideFit = (upsideAverage / target) * 25;
  const priorityBoost = country.priorityBoosts?.[profile.preferences.priority] || 0;
  return clamp(18 + targetFit + upsideFit + priorityBoost);
}

function accessScore(profile, country, visa) {
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

function speedScore(profile, country, visa) {
  const weeks = (country.cashPaths || []).map((path) => path.timeToFirstPayWeeks?.[1] || 24);
  const fastest = Math.min(...weeks, 32);
  let score = 100 - fastest * 3.2;
  if (visa.status === "blocked") score -= 45;
  if (profile.preferences.timeHorizon === "30d") score += fastest <= 4 ? 15 : -12;
  if (profile.preferences.timeHorizon === "90d") score += fastest <= 12 ? 10 : -6;
  return clamp(score);
}

function fitScore(profile, country) {
  const tags = new Set(profile.skills.experienceTags || []);
  const signalMatches = (country.fitSignals || []).filter((tag) => tags.has(tag)).length;
  let score = 34 + signalMatches * 9 + Math.min(16, Number(profile.skills.yearsExperience || 0) * 2);

  const englishNeed = englishRank[country.englishNeed || "none"] || 0;
  const english = englishRank[profile.skills.englishLevel] || 0;
  score += (english - englishNeed) * 10;

  const physical = physicalRank[profile.mobility.acceptsPhysicalWork] || 0;
  if ((country.bestFor || []).some((item) => /chantier|FIFO|remote|terrain/i.test(item))) {
    score += physical * 6;
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

function riskScore(profile, country, visa) {
  let risk = 42;
  if (country.status === "live") risk -= 10;
  if (country.status === "beta") risk += 6;
  if (country.status === "locked") risk += 28;
  if (visa.status === "blocked") risk += 32;
  if (visa.status === "conditional") risk += 12;
  if (profile.money.availableCash < average((country.cashPaths || []).map((path) => path.entryCostLow || 0))) {
    risk += 16;
  }
  if (profile.preferences.riskTolerance === "low") risk += 10;
  if (profile.preferences.riskTolerance === "high") risk -= 7;
  return clamp(100 - risk);
}

function entryCost(country) {
  const paths = country.cashPaths || [];
  return {
    low: Math.min(...paths.map((path) => path.entryCostLow || 0)),
    high: Math.max(...paths.map((path) => path.entryCostHigh || 0)),
    currency: country.currency,
    items: Array.from(new Set(paths.flatMap((path) => path.requiredTickets || []))).slice(0, 6),
  };
}

function timeToFirstPay(country) {
  const paths = country.cashPaths || [];
  return {
    lowWeeks: Math.min(...paths.map((path) => path.timeToFirstPayWeeks?.[0] || 4)),
    highWeeks: Math.max(...paths.map((path) => path.timeToFirstPayWeeks?.[1] || 24)),
  };
}

function realisticMonthlyRange(country) {
  const paths = country.cashPaths || [];
  return {
    low: Math.round(average(paths.map((path) => path.monthlyRangeLow || 0))),
    stable: Math.round(average(paths.map((path) => path.monthlyRangeStable || 0))),
    upside: Math.round(average(paths.map((path) => path.monthlyRangeUpside || 0))),
    currency: country.currency,
    netOrGross: country.netOrGross || "mixed",
  };
}

function blockers(profile, country, visa) {
  const output = [...(visa.blockers || [])];
  if (country.englishNeed && (englishRank[profile.skills.englishLevel] || 0) < (englishRank[country.englishNeed] || 0)) {
    output.push("Anglais sous le niveau utile");
  }
  if (country.status === "locked") {
    output.push("Pays non documente proprement");
  }
  const cost = entryCost(country);
  if (profile.money.availableCash < cost.low) {
    output.push("Capital inferieur au cout d'entree bas");
  }
  return output.slice(0, 5);
}

function reasons(profile, country, scores) {
  const output = [];
  if (scores.accessScore >= 70) output.push("Acces administratif relativement bon pour ton profil");
  if (scores.cashScore >= 70) output.push("Cash plausible proche ou au-dessus de ton objectif");
  if (scores.fitScore >= 70) output.push("Tes signaux vendables collent au terrain");
  if (scores.speedScore >= 70) output.push("Delai premiere paie raisonnable");
  if (!output.length) output.push("Option a garder en comparaison, pas en plan prioritaire");
  return output.slice(0, 4);
}

function dangers(country, visa, scoreBlockers) {
  return Array.from(
    new Set([
      ...scoreBlockers,
      ...(country.cashPaths || []).flatMap((path) => path.mainRisks || []),
    ]),
  ).slice(0, 5);
}

function nextAction(country, visa, scoreBlockers) {
  if (visa.status === "blocked") {
    return "Ne paie rien: ouvre une route alternative sans ce verrou age/visa.";
  }
  if (scoreBlockers.some((item) => item.includes("Capital"))) {
    return "Construis le budget tampon avant billet, visa ou ticket payant.";
  }
  if (country.id === "france") {
    return "Choisis une route France puis valide le premier ticket utile.";
  }
  return "Verifie la source officielle visa, puis contacte 20 recruteurs avant ticket cher.";
}

export function scoreCountry(profile, country, rules) {
  const visa = evaluateVisa(profile, country, rules);
  const access = accessScore(profile, country, visa);
  const cash = cashScore(profile, country);
  const speed = speedScore(profile, country, visa);
  const fit = fitScore(profile, country);
  const risk = riskScore(profile, country, visa);
  const total = clamp(access * 0.3 + cash * 0.25 + speed * 0.2 + fit * 0.15 + risk * 0.1);
  const mainBlockers = blockers(profile, country, visa);

  return {
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
    realisticMonthlyRange: realisticMonthlyRange(country),
    entryCost: entryCost(country),
    timeToFirstPay: timeToFirstPay(country),
    mainBlockers,
    whyRecommended: reasons(profile, country, { accessScore: access, cashScore: cash, speedScore: speed, fitScore: fit }),
    whyDangerous: dangers(country, visa, mainBlockers),
    nextAction: nextAction(country, visa, mainBlockers),
    sourceIds: Array.from(new Set([...(country.sourceIds || []), ...(visa.sourceIds || [])])),
  };
}

export function scoreCountries(profile, countries, rules) {
  return countries
    .map((country) => scoreCountry(profile, country, rules))
    .sort((left, right) => right.totalScore - left.totalScore);
}
