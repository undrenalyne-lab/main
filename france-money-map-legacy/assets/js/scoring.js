import { money } from "./ui.js";

const GOAL_WEIGHTS = {
  "argent-vite": {
    cash: 0.24,
    tickets: 0.18,
    saturation: 0.08,
    rebounds: 0.1,
    stability: 0.12,
    speed: 0.2,
    physical: 0.04,
    mobility: 0.04,
  },
  "cash-max": {
    cash: 0.34,
    tickets: 0.12,
    saturation: 0.06,
    rebounds: 0.14,
    stability: 0.1,
    speed: 0.16,
    physical: 0.04,
    mobility: 0.04,
  },
  stabilite: {
    cash: 0.18,
    tickets: 0.1,
    saturation: 0.08,
    rebounds: 0.12,
    stability: 0.3,
    speed: 0.1,
    physical: 0.06,
    mobility: 0.06,
  },
  "anti-concurrence": {
    cash: 0.16,
    tickets: 0.12,
    saturation: 0.3,
    rebounds: 0.16,
    stability: 0.08,
    speed: 0.1,
    physical: 0.04,
    mobility: 0.04,
  },
  "long-terme": {
    cash: 0.14,
    tickets: 0.1,
    saturation: 0.08,
    rebounds: 0.3,
    stability: 0.16,
    speed: 0.1,
    physical: 0.06,
    mobility: 0.06,
  },
  "recycler-passe": {
    cash: 0.14,
    tickets: 0.24,
    saturation: 0.06,
    rebounds: 0.14,
    stability: 0.12,
    speed: 0.12,
    physical: 0.09,
    mobility: 0.09,
  },
};

function normalize(value, min, max) {
  if (max === min) {
    return 0.5;
  }
  return (value - min) / (max - min);
}

function buildRange(values) {
  return values.reduce(
    (range, value) => ({
      min: Math.min(range.min, value),
      max: Math.max(range.max, value),
    }),
    { min: Infinity, max: -Infinity },
  );
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mobilityDemand(lane) {
  const blob = normalizeText(
    [...(lane.payoutModel || []), ...(lane.notes || []), ...(lane.tags || [])].join(
      " ",
    ),
  );
  if (/gd|deplacement|decouch|itiner/.test(blob)) {
    return 85;
  }
  if (/3x8|poste|nuit|week-end/.test(blob)) {
    return 60;
  }
  return 35;
}

function toleranceFit(tolerance, demand) {
  if (tolerance >= demand) {
    return 1;
  }
  return Math.max(0, 1 - (demand - tolerance) / 100);
}

function buildMetricRanges(lanes) {
  return {
    stableCash: buildRange(
      lanes.map((lane) => lane.salaryStableScenario.estimatedCashAvailable),
    ),
    maxCash: buildRange(
      lanes.map((lane) => lane.salaryMaxScenario.estimatedCashAvailable),
    ),
    speed: buildRange(lanes.map((lane) => lane.scores.speed)),
    competition: buildRange(lanes.map((lane) => lane.scores.competition)),
    rebounds: buildRange(lanes.map((lane) => lane.rebounds.length)),
    progression: buildRange(lanes.map((lane) => lane.verticalProgression.length)),
    durability: buildRange(lanes.map((lane) => lane.scores.durability)),
    stability: buildRange(lanes.map((lane) => lane.scores.stability)),
    volatility: buildRange(lanes.map((lane) => lane.scores.volatility)),
    requiredTickets: buildRange(lanes.map((lane) => lane.ticketsRequired.length)),
  };
}

function profileSignal(lane, selection) {
  const matches = lane.targetProfiles.filter((profile) =>
    selection.profiles.includes(profile),
  );
  const denominator = Math.max(
    1,
    Math.min(selection.profiles.length || 1, lane.targetProfiles.length || 1),
  );
  return {
    matches,
    score: matches.length / denominator,
  };
}

function buildReasons(lane, profileMatch, agentScores, metrics) {
  const candidates = [];

  if (profileMatch.matches.length > 0) {
    candidates.push({
      priority: 95,
      text: `Recycle ${profileMatch.matches.length} signal(s) déjà présent(s) dans ton profil.`,
    });
  }

  if (agentScores.cash >= 70) {
    candidates.push({
      priority: 90,
      text: `Le couple stable (${money(metrics.cashStable)}) / max plausible (${money(metrics.cashMax)}) sort au-dessus de la moyenne.`,
    });
  }

  if (agentScores.tickets >= 68) {
    candidates.push({
      priority: 80,
      text: `L'entrée reste relativement accessible pour ce niveau de cash.`,
    });
  }

  if (agentScores.saturation >= 68) {
    candidates.push({
      priority: 75,
      text: `La voie semble moins saturée que beaucoup d'alternatives.`,
    });
  }

  if (agentScores.rebounds >= 68) {
    candidates.push({
      priority: 70,
      text: `Les rebonds et portes suivantes sont solides après l'entrée.`,
    });
  }

  if (agentScores.stability >= 68) {
    candidates.push({
      priority: 65,
      text: `Le revenu paraît plus régulier que sur les lanes plus explosives.`,
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      priority: 40,
      text: `Route intéressante surtout si tu assumes ses contraintes opérationnelles.`,
    });
  }

  return candidates
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 3)
    .map((item) => item.text);
}

function analyzeLane(lane, ranges, selection) {
  const weights = GOAL_WEIGHTS[selection.goal] || GOAL_WEIGHTS["argent-vite"];
  const stableCash = lane.salaryStableScenario.estimatedCashAvailable;
  const maxCash = lane.salaryMaxScenario.estimatedCashAvailable;
  const speedNorm = normalize(lane.scores.speed, ranges.speed.min, ranges.speed.max);
  const competitionInverse =
    1 -
    normalize(
      lane.scores.competition,
      ranges.competition.min,
      ranges.competition.max,
    );
  const reboundNorm = normalize(
    lane.rebounds.length,
    ranges.rebounds.min,
    ranges.rebounds.max,
  );
  const progressionNorm = normalize(
    lane.verticalProgression.length,
    ranges.progression.min,
    ranges.progression.max,
  );
  const durabilityNorm = normalize(
    lane.scores.durability,
    ranges.durability.min,
    ranges.durability.max,
  );
  const stabilityNorm = normalize(
    lane.scores.stability,
    ranges.stability.min,
    ranges.stability.max,
  );
  const volatilityInverse =
    1 -
    normalize(
      lane.scores.volatility,
      ranges.volatility.min,
      ranges.volatility.max,
    );
  const requiredTicketsInverse =
    1 -
    normalize(
      lane.ticketsRequired.length,
      ranges.requiredTickets.min,
      ranges.requiredTickets.max,
    );
  const accessEase = 1 - (lane.accessDifficulty.score - 1) / 4;
  const profileMatch = profileSignal(lane, selection);
  const cashStableNorm = normalize(
    stableCash,
    ranges.stableCash.min,
    ranges.stableCash.max,
  );
  const cashMaxNorm = normalize(
    maxCash,
    ranges.maxCash.min,
    ranges.maxCash.max,
  );
  const cashFocus = selection.goal === "cash-max" ? 0.65 : 0.45;
  const cashAgent = (cashStableNorm * (1 - cashFocus) + cashMaxNorm * cashFocus) * 100;
  const ticketAgent =
    (requiredTicketsInverse * 0.35 +
      accessEase * 0.3 +
      profileMatch.score * 0.35) *
    100;
  const saturationAgent = competitionInverse * 100;
  const reboundAgent =
    (reboundNorm * 0.35 + progressionNorm * 0.35 + durabilityNorm * 0.3) * 100;
  const stabilityNeedFactor = selection.stabilityNeed / 100;
  const stabilityAgent =
    (stabilityNorm * (0.5 + stabilityNeedFactor * 0.2) +
      volatilityInverse * (0.5 - stabilityNeedFactor * 0.2)) *
    100;
  const physicalDemand = lane.scores.fatigue * 20;
  const physicalFit = toleranceFit(selection.physicalTolerance, physicalDemand);
  const mobilityFit = toleranceFit(
    selection.mobilityTolerance,
    mobilityDemand(lane),
  );
  const speedFit =
    speedNorm * (0.55 + selection.speedNeed / 200) + accessEase * 0.15;
  const totalScore =
    (cashAgent / 100) * weights.cash +
    (ticketAgent / 100) * weights.tickets +
    (saturationAgent / 100) * weights.saturation +
    (reboundAgent / 100) * weights.rebounds +
    (stabilityAgent / 100) * weights.stability +
    speedFit * weights.speed +
    physicalFit * weights.physical +
    mobilityFit * weights.mobility;

  const metrics = {
    cashStable: stableCash,
    cashMax: maxCash,
    lowCash: lane.salaryLowScenario.estimatedCashAvailable,
  };

  const agentScores = {
    cash: Math.round(cashAgent),
    tickets: Math.round(ticketAgent),
    saturation: Math.round(saturationAgent),
    rebounds: Math.round(reboundAgent),
    stability: Math.round(stabilityAgent),
  };

  return {
    lane,
    totalScore: Math.round(totalScore * 100),
    agentScores,
    profileMatch,
    reasons: buildReasons(lane, profileMatch, agentScores, metrics),
    metrics,
    sortValues: {
      score: Math.round(totalScore * 100),
      "cash-max": maxCash,
      "cash-stable": stableCash,
      speed: Math.round((speedNorm * 0.7 + accessEase * 0.3) * 100),
      "anti-foule": Math.round(competitionInverse * 100),
      "long-terme": Math.round(
        ((reboundAgent / 100) * 0.6 + (stabilityAgent / 100) * 0.4) * 100,
      ),
    },
  };
}

export function sortRankedLanes(rankedLanes, sortMode = "score") {
  return [...rankedLanes].sort((left, right) => {
    const leftValue = left.sortValues[sortMode] ?? left.sortValues.score;
    const rightValue = right.sortValues[sortMode] ?? right.sortValues.score;
    return rightValue - leftValue;
  });
}

export function scoreLanes(lanes, selection) {
  if (lanes.length === 0) {
    return [];
  }

  const ranges = buildMetricRanges(lanes);
  const ranked = lanes.map((lane) => analyzeLane(lane, ranges, selection));
  return sortRankedLanes(ranked, selection.sort);
}

export function scoreSingleLane(lane, allLanes, selection) {
  return scoreLanes(allLanes, selection).find((item) => item.lane.id === lane.id);
}
