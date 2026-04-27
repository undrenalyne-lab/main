import { loadAllData, loadHomeModel } from "./data.js";
import { DEFAULT_SELECTION, mergeSelection, saveSelection } from "./filters.js";
import { scoreLanes } from "./scoring.js";
import {
  competitionTone,
  escapeHtml,
  integer,
  laneHref,
  linkChip,
  pill,
  scenarioBoxHtml,
  sectorIcon,
  stabilityTone,
} from "./ui.js";

const HOME_STORAGE_KEY = "backchannel-atlas-home-onboarding-v1";
const LEGACY_HOME_STORAGE_KEYS = ["france-money-map-home-onboarding-v1"];
const DEFAULT_HEAT_LAYER = "fit-now";
const HEAT_LAYERS = [
  { id: "fit-now", label: "Fit now" },
  { id: "cash-ceiling", label: "Cash ceiling" },
  { id: "entry-speed", label: "Entry speed" },
];

const heroStats = document.getElementById("heroStats");
const missionRail = document.getElementById("missionRail");
const profileLab = document.getElementById("profileLab");
const heatLayerSet = document.getElementById("heatLayerSet");
const worldMap = document.getElementById("worldMap");
const marketDrawer = document.getElementById("marketDrawer");
const marketHeatGrid = document.getElementById("marketHeatGrid");
const missionBoard = document.getElementById("missionBoard");
const launchpadPanel = document.getElementById("launchpadPanel");
const featuredTitle = document.getElementById("featuredTitle");
const featuredCopy = document.getElementById("featuredCopy");
const featuredRoutes = document.getElementById("featuredRoutes");

let siteData;
let homeModel;
let homeState;
let watchMarkets = [];
let heatLayer = DEFAULT_HEAT_LAYER;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeArrayValue(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadSavedHomePackage() {
  try {
    const rawValue =
      window.localStorage.getItem(HOME_STORAGE_KEY) ||
      LEGACY_HOME_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(
        Boolean,
      );
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}

function saveHomePackage() {
  try {
    window.localStorage.setItem(
      HOME_STORAGE_KEY,
      JSON.stringify({
        ...homeState,
        _watchMarkets: watchMarkets,
        _heatLayer: heatLayer,
      }),
    );
  } catch (error) {
    // Ignore storage failures.
  }
}

function getField(fieldId) {
  return homeModel.fieldMap.get(fieldId);
}

function getFieldOption(fieldId, optionId) {
  if (fieldId === "country" && homeModel?.worldMarketMap?.has(optionId)) {
    return {
      id: optionId,
      label: homeModel.worldMarketMap.get(optionId).label,
    };
  }
  return getField(fieldId)?.options.find((option) => option.id === optionId);
}

function getOptionLabel(fieldId, optionId) {
  return getFieldOption(fieldId, optionId)?.label || optionId;
}

function normalizeFieldValue(field, rawValue, fallbackValue) {
  if (field.id === "country" && homeModel?.worldMarketMap) {
    const candidate = rawValue ?? fallbackValue ?? field.options[0]?.id;
    if (homeModel.worldMarketMap.has(candidate)) {
      return candidate;
    }
  }

  const allowedIds = new Set(field.options.map((option) => option.id));

  if (field.type === "multi") {
    const values = normalizeArrayValue(rawValue ?? fallbackValue).filter((value) =>
      allowedIds.has(value),
    );
    const maxSelected = field.maxSelected || values.length || field.options.length;
    return uniqueValues(values).slice(0, maxSelected);
  }

  const value = rawValue ?? fallbackValue ?? field.options[0]?.id;
  return allowedIds.has(value) ? value : fallbackValue ?? field.options[0]?.id;
}

function normalizeHomeState(schema, candidate = {}) {
  const defaults = schema.defaults || {};
  return (schema.fields || []).reduce((state, field) => {
    state[field.id] = normalizeFieldValue(
      field,
      candidate[field.id],
      defaults[field.id],
    );
    return state;
  }, {});
}

function commitHomeState(partial) {
  homeState = normalizeHomeState(homeModel.schema, {
    ...homeState,
    ...partial,
  });
  saveHomePackage();
  render();
}

function commitUiState(partial) {
  if (partial.watchMarkets) {
    watchMarkets = partial.watchMarkets;
  }
  if (partial.heatLayer) {
    heatLayer = partial.heatLayer;
  }
  saveHomePackage();
  render();
}

function toggleHomeMultiValue(field, optionId) {
  const currentValues = normalizeArrayValue(homeState[field.id]);
  const exists = currentValues.includes(optionId);

  if (exists) {
    commitHomeState({
      [field.id]: currentValues.filter((value) => value !== optionId),
    });
    return;
  }

  const maxSelected = field.maxSelected || field.options.length;
  const nextValues = [...currentValues, optionId];
  commitHomeState({
    [field.id]: nextValues.slice(-maxSelected),
  });
}

function choosePrimaryGoal(goalIds, goalPriority = []) {
  for (const goalId of goalPriority) {
    if (goalIds.includes(goalId)) {
      return goalId;
    }
  }
  return goalIds[0] || null;
}

function applyNumericAdjustments(target, adjustment = {}) {
  Object.entries(adjustment).forEach(([key, value]) => {
    if (typeof target[key] === "number") {
      target[key] += value;
    }
  });
}

function buildFranceSelection(countryConfig) {
  const model = countryConfig.selectionModel || {};
  const baseSelection = mergeSelection(DEFAULT_SELECTION, model.baseSelection || {});
  const primaryCompactGoal = choosePrimaryGoal(
    homeState.goals,
    model.goalPriority || [],
  );
  const mappedGoal = model.goalMap?.[primaryCompactGoal] || baseSelection.goal;
  const derivedProfiles = uniqueValues([
    ...(model.defaultProfiles || []),
    ...homeState.experienceTags.flatMap(
      (tag) => model.experienceProfileMap?.[tag] || [],
    ),
    ...(model.englishProfileMap?.[homeState.english] || []),
  ]);

  const nextSelection = {
    goal: mappedGoal,
    sort: baseSelection.sort,
    profiles: derivedProfiles.length ? derivedProfiles : baseSelection.profiles,
    stabilityNeed: baseSelection.stabilityNeed,
    speedNeed: baseSelection.speedNeed,
    physicalTolerance: baseSelection.physicalTolerance,
    mobilityTolerance:
      model.mobilityToleranceMap?.[homeState.mobility] ??
      baseSelection.mobilityTolerance,
  };

  homeState.goals.forEach((goalId) => {
    applyNumericAdjustments(nextSelection, model.goalAdjustments?.[goalId]);
  });
  applyNumericAdjustments(nextSelection, model.ageAdjustments?.[homeState.ageBand]);

  if (
    homeState.experienceTags.some((tag) =>
      ["terrain", "meca", "hauteur", "securite"].includes(tag),
    )
  ) {
    nextSelection.physicalTolerance += 10;
  }

  if (homeState.nationality === "sponsor") {
    nextSelection.stabilityNeed += 6;
    nextSelection.speedNeed -= 6;
  }

  ["stabilityNeed", "speedNeed", "physicalTolerance", "mobilityTolerance"].forEach(
    (key) => {
      nextSelection[key] = clamp(nextSelection[key], 0, 100);
    },
  );

  return mergeSelection(baseSelection, nextSelection);
}

function buildFranceRouteHref(selection) {
  const params = new URLSearchParams();
  params.set("goal", selection.goal);
  if (selection.profiles.length) {
    params.set("profiles", selection.profiles.join(","));
  }
  if (selection.sort && selection.sort !== "score") {
    params.set("sort", selection.sort);
  }
  if (selection.stabilityNeed !== DEFAULT_SELECTION.stabilityNeed) {
    params.set("stability", selection.stabilityNeed);
  }
  if (selection.speedNeed !== DEFAULT_SELECTION.speedNeed) {
    params.set("speed", selection.speedNeed);
  }
  if (selection.physicalTolerance !== DEFAULT_SELECTION.physicalTolerance) {
    params.set("physical", selection.physicalTolerance);
  }
  if (selection.mobilityTolerance !== DEFAULT_SELECTION.mobilityTolerance) {
    params.set("mobility", selection.mobilityTolerance);
  }
  return `./parcours.html?${params.toString()}`;
}

function buildInsights(countryConfig) {
  const insights = (countryConfig.insightRules || []).filter((rule) => {
    const when = rule.when || {};
    if (when.nationality && !when.nationality.includes(homeState.nationality)) {
      return false;
    }
    if (when.ageBand && !when.ageBand.includes(homeState.ageBand)) {
      return false;
    }
    if (when.mobility && !when.mobility.includes(homeState.mobility)) {
      return false;
    }
    if (when.english && !when.english.includes(homeState.english)) {
      return false;
    }
    if (
      when.experienceCountMin &&
      homeState.experienceTags.length < when.experienceCountMin
    ) {
      return false;
    }
    if (
      when.experienceTagsAny &&
      !homeState.experienceTags.some((tag) => when.experienceTagsAny.includes(tag))
    ) {
      return false;
    }
    if (when.goalsAny && !homeState.goals.some((goal) => when.goalsAny.includes(goal))) {
      return false;
    }
    return true;
  });

  return insights.length
    ? insights.slice(0, 3)
    : [{ tone: "blue", title: "Lecture rapide", body: countryConfig.summary }];
}

function buildAustraliaRecommendations(countryConfig) {
  return (countryConfig.playbookWeights || [])
    .map((rule) => {
      const playbook = homeModel.australiaPlaybookMap.get(rule.title);
      if (!playbook) {
        return null;
      }

      const weights = rule.weights || {};
      const rawScore =
        (weights.nationality?.[homeState.nationality] || 0) +
        (weights.ageBand?.[homeState.ageBand] || 0) +
        (weights.mobility?.[homeState.mobility] || 0) +
        (weights.english?.[homeState.english] || 0) +
        homeState.experienceTags.reduce(
          (total, tag) => total + (weights.experienceTags?.[tag] || 0),
          0,
        ) +
        homeState.goals.reduce(
          (total, goal) => total + (weights.goals?.[goal] || 0),
          0,
        );

      return {
        playbook,
        matchScore: clamp(50 + rawScore, 0, 99),
        recommendedSources: (rule.recommendedSourceIds || [])
          .map((sourceId) => siteData.sourceMap.get(sourceId))
          .filter(Boolean),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.matchScore - left.matchScore);
}

function buildAustraliaMissionRecommendations() {
  const missions = homeModel.australiaGuide?.missions || [];
  return missions
    .map((mission) => {
      let score = 48;

      if (mission.id === "track-protection-officer") {
        score += homeState.experienceTags.includes("rail") ? 18 : 0;
        score += homeState.experienceTags.includes("securite") ? 10 : 0;
        score += homeState.experienceTags.includes("elec") ? 8 : 0;
        score += ["functional", "strong"].includes(homeState.english) ? 10 : -10;
        score += ["national", "remote-roster"].includes(homeState.mobility) ? 8 : -4;
        score += homeState.goals.includes("cash-upside") ? 8 : 0;
      } else if (mission.id === "track-maintainer") {
        score += homeState.experienceTags.includes("terrain") ? 14 : 0;
        score += homeState.experienceTags.includes("rail") ? 12 : 0;
        score += homeState.goals.includes("fast-entry") ? 10 : 0;
        score += ["regional", "national", "remote-roster"].includes(homeState.mobility)
          ? 8
          : -3;
      } else if (mission.id === "fifo-process-operator") {
        score += homeState.mobility === "remote-roster" ? 18 : -8;
        score += ["functional", "strong"].includes(homeState.english) ? 10 : -12;
        score += homeState.goals.includes("cash-upside") ? 14 : 0;
        score += homeState.experienceTags.includes("meca") ? 10 : 0;
        score += homeState.experienceTags.includes("logistique") ? 8 : 0;
      } else if (mission.id === "civil-labourer-traffic") {
        score += homeState.goals.includes("fast-entry") ? 16 : 0;
        score += homeState.experienceTags.includes("terrain") ? 10 : 0;
        score += homeState.mobility === "local" ? 8 : 0;
        score += homeState.mobility === "national" ? 4 : 0;
      }

      if (["eu", "sponsor"].includes(homeState.nationality)) {
        score -= mission.id === "track-protection-officer" ? 6 : 0;
        score -= mission.id === "fifo-process-operator" ? 8 : 0;
      }

      return {
        mission,
        matchScore: clamp(score, 0, 99),
      };
    })
    .sort((left, right) => right.matchScore - left.matchScore);
}

function buildCountryContext() {
  const market =
    homeModel.worldMarketMap.get(homeState.country) || homeModel.worldMarkets[0];
  const countryConfig = homeModel.countryMap.get(market.id);
  const insights = countryConfig ? buildInsights(countryConfig) : buildLockedMarketInsights(market);

  if (market.id === "france" && countryConfig) {
    const franceSelection = buildFranceSelection(countryConfig);
    const rankedLanes = scoreLanes(siteData.lanes, franceSelection);
    return {
      country: market,
      countryConfig,
      insights,
      franceSelection,
      rankedLanes,
      topRoute: rankedLanes[0]?.lane || null,
    };
  }

  if (market.id === "australia" && countryConfig) {
    const australiaRecommendations = buildAustraliaRecommendations(countryConfig);
    const australiaMissionRecommendations = buildAustraliaMissionRecommendations();
    return {
      country: market,
      countryConfig,
      insights,
      australiaRecommendations,
      australiaMissionRecommendations,
      topMission: australiaMissionRecommendations[0]?.mission || null,
      topMissionRecommendation: australiaMissionRecommendations[0] || null,
      topPlaybook: australiaRecommendations[0]?.playbook || null,
      topRecommendation: australiaRecommendations[0] || null,
    };
  }

  return {
    country: market,
    countryConfig: null,
    insights,
    roadmapActions: buildRoadmapActions(market),
    roadmapCards: buildRoadmapCards(market),
  };
}

function buildLockedMarketInsights(market) {
  const insights = [
    {
      tone: "gold",
      title: "Marché verrouillé",
      body: `${market.label} est visible pour t'aider à arbitrer l'avenir, pas encore comme moteur live.`,
    },
    {
      tone: "blue",
      title: "Premier verrou",
      body: market.firstGate || market.unlockNote,
    },
  ];

  if (["functional", "strong"].includes(homeState.english)) {
    insights.push({
      tone: "green",
      title: "Langue exploitable",
      body: "Ton niveau d'anglais garde ouvertes plus de portes internationales quand le pays sera branché.",
    });
  } else {
    insights.push({
      tone: "red",
      title: "Langue encore fragile",
      body: "Sur la plupart des marchés verrouillés, l'anglais opérationnel reste un filtre précoce avant tickets et candidatures.",
    });
  }

  if (["national", "remote-roster"].includes(homeState.mobility)) {
    insights.push({
      tone: "green",
      title: "Mobilité utile",
      body: "Ton niveau de mobilité est cohérent avec des futurs marchés remote, roster ou itinérants.",
    });
  } else {
    insights.push({
      tone: "gold",
      title: "Mobilité à élargir",
      body: "Une mobilité trop locale coupera beaucoup de routes monde, même avec bon cash théorique.",
    });
  }

  return insights.slice(0, 4);
}

function buildRoadmapActions(market) {
  return [
    `Documenter ${market.label} comme marché cible secondaire, pas comme sortie immédiate.`,
    `Renforcer les signaux transférables: ${homeState.experienceTags.length ? homeState.experienceTags.join(", ") : "terrain, élec, méca ou hauteur"}.`,
    `Préparer le premier verrou: ${market.firstGate || market.unlockNote}.`,
    "Utiliser France ou Australie pour générer du cash et de l'expérience pendant que le pays reste verrouillé.",
  ];
}

function buildRoadmapCards(market) {
  return [
    {
      title: "Pourquoi c'est verrouillé",
      body: market.unlockNote || "Le pays n'est pas encore modélisé proprement.",
      tone: "red",
    },
    {
      title: "Signal déjà utile",
      body:
        homeState.experienceTags.length >= 2
          ? `Ton profil transporte déjà ${homeState.experienceTags.slice(0, 2).join(" + ")}.`
          : "Commence par construire 1 ou 2 signaux terrain solides et revendables.",
      tone: "blue",
    },
    {
      title: "Usage intelligent",
      body: `Garde ${market.label} en veille, mais exécute d'abord sur un marché live ou beta déjà documenté.`,
      tone: "gold",
    },
  ];
}

function scoreModelContribution(weightMap = {}, values = []) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((total, value) => total + (weightMap[value] || 0), 0);
}

function genericLockedScore(market) {
  let score = 38;
  score += ["functional", "strong"].includes(homeState.english) ? 8 : -2;
  score += ["national", "remote-roster"].includes(homeState.mobility) ? 8 : 0;
  score += homeState.goals.includes("cash-upside") ? 8 : 0;
  score += homeState.goals.includes("reuse-experience") ? 4 : 0;

  if (["germany", "netherlands", "norway"].includes(market.id)) {
    score += ["eu", "local"].includes(homeState.nationality) ? 10 : -6;
  }
  if (["uae", "qatar", "singapore"].includes(market.id)) {
    score += homeState.nationality === "sponsor" ? -4 : 2;
  }
  if (["terrain", "elec", "meca", "automation", "hauteur"].some((tag) =>
    homeState.experienceTags.includes(tag),
  )) {
    score += 8;
  }
  return clamp(score, 0, 100);
}

function scoreMarketByLayer(market, layer) {
  if (!market.heatModel) {
    return genericLockedScore(market);
  }

  const model = market.heatModel;
  const expContribution = scoreModelContribution(
    model.experienceTags,
    homeState.experienceTags,
  );
  const goalContribution = scoreModelContribution(model.goals, homeState.goals);
  const nationality = model.nationality?.[homeState.nationality] || 0;
  const english = model.english?.[homeState.english] || 0;
  const mobility = model.mobility?.[homeState.mobility] || 0;
  const age = model.ageBand?.[homeState.ageBand] || 0;

  if (layer === "fit-now") {
    return clamp(
      model.base + nationality + english + mobility + age + expContribution * 0.6 + goalContribution * 0.35,
      0,
      100,
    );
  }

  if (layer === "cash-ceiling") {
    return clamp(
      42 +
        (model.base - 40) * 0.4 +
        mobility * 0.8 +
        english * 0.4 +
        expContribution * 0.8 +
        goalContribution * 0.9 +
        (homeState.goals.includes("cash-upside") ? 10 : 0),
      0,
      100,
    );
  }

  return clamp(
    50 +
      nationality * 1.1 +
      mobility * 0.7 +
      english * 0.35 +
      expContribution * 0.35 +
      goalContribution * 0.75 +
      (homeState.goals.includes("fast-entry") ? 12 : 0),
    0,
    100,
  );
}

function bandFromScore(score) {
  if (score >= 80) {
    return "peak";
  }
  if (score >= 60) {
    return "hot";
  }
  if (score >= 38) {
    return "warm";
  }
  return "cold";
}

function marketStatusTone(status) {
  if (status === "live") {
    return "green";
  }
  if (status === "beta") {
    return "gold";
  }
  return "red";
}

function marketBandTone(band) {
  if (band === "peak") {
    return "green";
  }
  if (band === "hot") {
    return "gold";
  }
  if (band === "warm") {
    return "blue";
  }
  return "red";
}

function buildMarketScores() {
  return homeModel.worldMarkets
    .map((market) => {
      const layerScore = scoreMarketByLayer(market, heatLayer);
      const fitScore = scoreMarketByLayer(market, "fit-now");
      const cashScore = scoreMarketByLayer(market, "cash-ceiling");
      const speedScore = scoreMarketByLayer(market, "entry-speed");
      return {
        market,
        layerScore,
        fitScore,
        cashScore,
        speedScore,
        band: bandFromScore(layerScore),
      };
    })
    .sort((left, right) => {
      if (left.market.status === right.market.status) {
        return right.layerScore - left.layerScore;
      }
      const order = { live: 0, beta: 1, locked: 2 };
      return order[left.market.status] - order[right.market.status];
    });
}

function activeMarketScores() {
  return buildMarketScores().find((item) => item.market.id === homeState.country);
}

function completionScore() {
  const checks = [
    Boolean(homeState.country),
    Boolean(homeState.nationality),
    Boolean(homeState.ageBand),
    Boolean(homeState.mobility),
    Boolean(homeState.english),
    homeState.experienceTags.length > 0,
    homeState.goals.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function watchMarketList() {
  return uniqueValues(
    watchMarkets.filter((marketId) => homeModel.worldMarketMap.has(marketId)),
  );
}

function toggleWatchMarket(marketId) {
  const next = watchMarketList().includes(marketId)
    ? watchMarkets.filter((id) => id !== marketId)
    : [...watchMarketList(), marketId].slice(-3);
  commitUiState({ watchMarkets: next });
}

function updateMissionRail() {
  const steps = [...missionRail.querySelectorAll(".mission-step")];
  const score = completionScore();
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === 0);
    step.classList.toggle("is-complete", false);
  });

  if (score >= 55) {
    steps[0]?.classList.add("is-complete");
    steps[1]?.classList.add("is-active");
  }
  if (homeState.country) {
    steps[1]?.classList.add("is-complete");
    steps[2]?.classList.add("is-active");
  }
  if (homeState.country && (homeState.country === "france" || homeState.country === "australia")) {
    steps[2]?.classList.add("is-complete");
    steps[3]?.classList.add("is-active");
  }
}

function renderHeroStats(marketScores) {
  const cards = [...heroStats.querySelectorAll(".metric-card")];
  const values = {
    lanes: siteData.lanes.length,
    tickets: siteData.tickets.length,
    employers: siteData.employers.length,
    markets: homeModel.worldMarkets.length,
  };

  cards.forEach((card) => {
    const stat = card.querySelector("[data-stat]");
    if (!stat) {
      return;
    }
    stat.textContent = integer(values[stat.dataset.stat] || 0);
  });

  const active = activeMarketScores() || marketScores[0];
  const badge = document.querySelector(".mission-console .badge");
  if (badge && active) {
    badge.textContent = `${active.market.label} ${active.market.status}`;
    badge.className = `badge badge--${active.market.status === "live" ? "live" : active.market.status === "beta" ? "beta" : "locked"}`;
  }
}

function fieldGroup(fieldId) {
  if (["country", "nationality", "ageBand"].includes(fieldId)) {
    return "1. Acces et droits";
  }
  if (["mobility", "english"].includes(fieldId)) {
    return "2. Mobilite reelle";
  }
  if (fieldId === "experienceTags") {
    return "3. Capital vendable";
  }
  return "4. Arbitrage cash";
}

function renderProfileLab(context) {
  const grouped = homeModel.fields.reduce((groups, field) => {
    const group = fieldGroup(field.id);
    groups[group] = groups[group] || [];
    groups[group].push(field);
    return groups;
  }, {});

  const completion = completionScore();
  const watchPills = watchMarketList()
    .map((marketId) => homeModel.worldMarketMap.get(marketId))
    .filter(Boolean)
    .map((market) => pill(market.label, marketStatusTone(market.status)))
    .join("");

  profileLab.innerHTML = `
    <div class="panel-head">
      <div>
        <span class="mini-label">01 · Profiler</span>
        <h3>Quatre blocs. Pas plus. Juste assez pour que la carte dise vrai.</h3>
      </div>
      <div class="button-row">
        <span class="badge badge--data">localStorage</span>
      </div>
    </div>
    <div class="profile-progress">
      <div class="profile-progress-bar">
        <span style="width:${completion}%"></span>
      </div>
      <div class="profile-progress-meta">
        <strong>${completion}%</strong>
        <span class="muted">profil exploitable</span>
      </div>
    </div>
    <div class="warning-card">
      <strong>Pays actif:</strong> ${escapeHtml(context.country.label)}
      <br />
      <strong>Watchlist:</strong> ${watchPills || "aucun pays epingle"}
    </div>
    <div class="home-profile-groups">
      ${Object.entries(grouped)
        .map(
          ([groupLabel, fields]) => `
            <section class="profile-group">
              <div class="profile-group-head">
                <span class="mini-label">${escapeHtml(groupLabel)}</span>
              </div>
              <div class="profile-group-fields">
                ${fields
                  .map((field) => {
                    if (field.id === "country") {
                      return `
                        <label class="home-field">
                          <div class="home-field-head">
                            <span class="mini-label">${escapeHtml(field.label)}</span>
                            <p class="muted">${escapeHtml(field.description)}</p>
                          </div>
                          <select class="input home-select" data-home-select="${field.id}">
                            ${homeModel.worldMarkets
                              .map(
                                (market) => `
                                  <option
                                    value="${escapeHtml(market.id)}"
                                    ${homeState[field.id] === market.id ? "selected" : ""}
                                  >
                                    ${escapeHtml(`${market.label} · ${market.status}`)}
                                  </option>
                                `,
                              )
                              .join("")}
                          </select>
                        </label>
                      `;
                    }

                    if (field.control === "select") {
                      return `
                        <label class="home-field">
                          <div class="home-field-head">
                            <span class="mini-label">${escapeHtml(field.label)}</span>
                            <p class="muted">${escapeHtml(field.description)}</p>
                          </div>
                          <select class="input home-select" data-home-select="${field.id}">
                            ${field.options
                              .map(
                                (option) => `
                                  <option
                                    value="${escapeHtml(option.id)}"
                                    ${homeState[field.id] === option.id ? "selected" : ""}
                                  >
                                    ${escapeHtml(option.label)}
                                  </option>
                                `,
                              )
                              .join("")}
                          </select>
                        </label>
                      `;
                    }

                    return `
                      <div class="home-field">
                        <div class="home-field-head">
                          <span class="mini-label">${escapeHtml(field.label)}</span>
                          <p class="muted">${escapeHtml(field.description)}</p>
                        </div>
                        <div class="chip-set">
                          ${field.options
                            .map((option) => {
                              const isActive =
                                field.type === "multi"
                                  ? homeState[field.id].includes(option.id)
                                  : homeState[field.id] === option.id;

                              return `
                                <button
                                  class="chip ${isActive ? "is-active" : ""}"
                                  type="button"
                                  data-home-toggle="${field.id}"
                                  data-home-value="${option.id}"
                                >
                                  ${escapeHtml(option.label)}
                                </button>
                              `;
                            })
                            .join("")}
                        </div>
                        ${
                          field.type === "multi"
                            ? `<div class="home-field-count">${homeState[field.id].length}/${field.maxSelected} sélectionnés</div>`
                            : ""
                        }
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            </section>
          `,
        )
        .join("")}
    </div>
    <div class="button-row">
      <button class="button secondary" type="button" data-home-reset>Reset</button>
      <a class="button primary" href="#worldMap">Aller à la carte</a>
    </div>
  `;
}

function renderHeatLayerSet() {
  heatLayerSet.innerHTML = HEAT_LAYERS.map(
    (layer) => `
      <button
        class="chip ${heatLayer === layer.id ? "is-active" : ""}"
        type="button"
        data-heat-layer="${layer.id}"
      >
        ${escapeHtml(layer.label)}
      </button>
    `,
  ).join("");
}

function marketNodeLabel(scoreItem) {
  if (scoreItem.market.status === "locked") {
    return "LOCK";
  }
  return String(Math.round(scoreItem.layerScore));
}

function worldMapSvg() {
  return `
    <svg class="world-svg" viewBox="0 0 1200 680" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="atlasLand" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="rgba(255,255,255,0.16)" />
          <stop offset="1" stop-color="rgba(255,255,255,0.045)" />
        </linearGradient>
      </defs>
      <g class="world-grid">
        <path d="M120 80H1080M120 180H1080M120 280H1080M120 380H1080M120 480H1080M120 580H1080" />
        <path d="M180 70V610M340 70V610M500 70V610M660 70V610M820 70V610M980 70V610" />
      </g>
      <g class="world-land">
        <path d="M96 166 164 108 258 92 356 120 430 176 406 252 326 288 278 344 188 338 118 282Z" />
        <path d="M318 346 382 392 424 474 388 590 322 626 282 562 300 456Z" />
        <path d="M500 134 570 96 676 112 724 162 678 226 590 226 528 190Z" />
        <path d="M548 244 632 278 674 354 640 486 584 578 528 494 516 388Z" />
        <path d="M704 140 806 102 954 120 1098 184 1140 262 1074 326 956 304 902 352 792 310 734 244Z" />
        <path d="M876 430 970 452 1060 512 1072 586 990 626 884 588 830 516Z" />
      </g>
      <g class="world-routes">
        <path d="M570 220 C650 260 736 334 1004 496" />
        <path d="M210 174 C340 154 456 176 578 214" />
        <path d="M628 292 C694 320 756 366 786 420" />
      </g>
    </svg>
  `;
}

function renderWorldMap(marketScores) {
  const selected = activeMarketScores() || marketScores[0];
  const sortedMarkets = [...marketScores].sort((left, right) => {
    if (left.market.status === right.market.status) {
      return right.layerScore - left.layerScore;
    }
    return { live: 0, beta: 1, locked: 2 }[left.market.status] - { live: 0, beta: 1, locked: 2 }[right.market.status];
  });

  worldMap.innerHTML = `
    <div class="world-map-stage">
      <div class="world-map-canvas" role="img" aria-label="Carte mondiale des marchés Backchannel Atlas">
        ${worldMapSvg()}
        <div class="world-map-legend">
          <span class="pill is-green">Live</span>
          <span class="pill is-gold">Beta</span>
          <span class="pill is-red">Locked</span>
        </div>
        ${marketScores
          .map(
            (item) => `
              <button
                class="atlas-pin atlas-pin-${item.market.status} atlas-band-${item.band} ${item.market.id === selected.market.id ? "is-focused" : ""} ${watchMarketList().includes(item.market.id) ? "is-watched" : ""}"
                type="button"
                style="left:${item.market.coords.x}%; top:${item.market.coords.y}%"
                data-market-focus="${item.market.id}"
                aria-label="${escapeHtml(item.market.label)} ${escapeHtml(item.market.status)} score ${escapeHtml(marketNodeLabel(item))}"
                title="${escapeHtml(`${item.market.label} · ${item.market.status} · ${marketNodeLabel(item)}`)}"
              >
                <span class="atlas-pin-dot" aria-hidden="true"></span>
                <span class="atlas-pin-meta">
                  <span class="atlas-pin-code">${escapeHtml(item.market.label.slice(0, 3).toUpperCase())}</span>
                  <span class="atlas-pin-score">${escapeHtml(marketNodeLabel(item))}</span>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="world-map-dock" aria-label="Marchés visibles">
        ${sortedMarkets
          .slice(0, 6)
          .map(
            (item) => `
              <button
                class="world-dock-item ${item.market.id === selected.market.id ? "is-active" : ""}"
                type="button"
                data-market-focus="${item.market.id}"
              >
                <span>${escapeHtml(item.market.label)}</span>
                <strong>${escapeHtml(marketNodeLabel(item))}</strong>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function australiaSalaryBoxHtml(label, value, tone = "") {
  const className = tone ? `money-value is-${tone}` : "money-value";
  return `
    <div class="money-box money-box-au">
      <span class="mini-label">${escapeHtml(label)}</span>
      <strong class="${className}">${escapeHtml(value || "à vérifier")}</strong>
      <div class="muted">brut annuel plausible · beta</div>
    </div>
  `;
}

function australiaMissionMoneyRow(mission) {
  const signals = mission.salarySignals || {};
  return `
    <div class="money-row">
      ${australiaSalaryBoxHtml("Bas", signals.low || mission.salaryYear1, "blue")}
      ${australiaSalaryBoxHtml("Stable", signals.stable || mission.salaryYear1, "gold")}
      ${australiaSalaryBoxHtml("Upside", signals.upside || mission.salaryYear1, "green")}
    </div>
  `;
}

function marketReasons(scoreItem, context) {
  const reasons = [];
  if (scoreItem.market.id === "france") {
    if (["eu", "local", "rights"].includes(homeState.nationality)) {
      reasons.push("droits au travail plus simples à convertir en action");
    } else {
      reasons.push("verrou admin plus lourd que sur un marché déjà ouvert");
    }
    if (homeState.experienceTags.length >= 2) {
      reasons.push("plusieurs signaux recyclables sur routes France live");
    }
    if (homeState.mobility === "local") {
      reasons.push("mobilité basse limite certaines routes grands déplacements");
    }
  } else if (scoreItem.market.id === "australia") {
    if (["local", "rights"].includes(homeState.nationality)) {
      reasons.push("work rights déjà plus crédibles");
    } else {
      reasons.push("work rights restent le premier filtre dur");
    }
    if (["functional", "strong"].includes(homeState.english)) {
      reasons.push("anglais assez haut pour screening, safety et onboarding");
    } else {
      reasons.push("anglais faible coupe vite les portes site");
    }
    if (homeState.mobility === "remote-roster") {
      reasons.push("roster / remote accepté, donc fit meilleur sur FIFO et shutdowns");
    }
  } else {
    reasons.push(scoreItem.market.teaser);
  }
  return reasons.slice(0, 3);
}

function renderMarketDrawer(scoreItem, context) {
  const reasons = marketReasons(scoreItem, context);
  const isWatched = watchMarketList().includes(scoreItem.market.id);

  let body = `
    <div class="pill-row">
      ${pill(scoreItem.market.label, "orange")}
      ${pill(scoreItem.market.status, marketStatusTone(scoreItem.market.status))}
      ${pill(`${HEAT_LAYERS.find((layer) => layer.id === heatLayer)?.label} ${Math.round(scoreItem.layerScore)}`, marketBandTone(scoreItem.band))}
    </div>
    <h3>${escapeHtml(scoreItem.market.label)}</h3>
    ${scoreItem.market.tagline ? `<div class="data-row"><span class="data-value">${escapeHtml(scoreItem.market.tagline)}</span><span class="data-label">Lecture courte du marche</span></div>` : ""}
    <p class="muted">${escapeHtml(scoreItem.market.summary)}</p>
    <div class="warning-card">
      <strong>Premier gate:</strong> ${escapeHtml(scoreItem.market.firstGate || scoreItem.market.unlockNote)}
    </div>
    ${
      scoreItem.market.missions?.length
        ? `
          <div>
            <span class="mini-label">Missions visibles</span>
            <div class="inline-links">
              ${scoreItem.market.missions.map((mission) => pill(mission, "blue")).join("")}
            </div>
          </div>
        `
        : ""
    }
    <div class="list">
      ${reasons
        .map(
          (reason, index) => `
            <div class="list-item">
              <span class="list-index">${index + 1}</span>
              <div>${escapeHtml(reason)}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;

  if (scoreItem.market.id === "france" && context.topRoute) {
    body += `
      <div class="detail-facts">
        <div class="detail-fact">
          <span class="mini-label">Mission top 1</span>
          <div>${escapeHtml(context.topRoute.title)}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Premier verrou</span>
          <div>${escapeHtml(siteData.ticketMap.get(context.topRoute.ticketsRequired[0])?.name || "ticket à confirmer")}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Cash stable</span>
          <div>${escapeHtml(context.topRoute.salaryStableScenario ? new Intl.NumberFormat("fr-FR", {style:"currency", currency:"EUR", maximumFractionDigits:0}).format(context.topRoute.salaryStableScenario.estimatedCashAvailable) : "—")}</div>
        </div>
      </div>
      <div class="button-row">
        <a class="button primary" href="${buildFranceRouteHref(context.franceSelection)}">Entrer en France</a>
        <a class="button secondary" href="${laneHref(context.topRoute.id)}">Voir la route top 1</a>
      </div>
    `;
  } else if (scoreItem.market.id === "australia" && context.topRecommendation) {
    const playbook = context.topRecommendation.playbook;
    const mission = context.topMission;
    body += `
      ${mission ? australiaMissionMoneyRow(mission) : ""}
      <div class="detail-facts">
        <div class="detail-fact">
          <span class="mini-label">Mission top 1</span>
          <div>${escapeHtml(mission?.label || playbook.title)}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Premier job plausible</span>
          <div>${escapeHtml(mission?.firstRole || playbook.firstRoles?.[0] || "à confirmer")}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Temps pour être prêt</span>
          <div>${escapeHtml(mission?.prepWeeks ? `${mission.prepWeeks} semaines` : playbook.timeToReady)}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Première paie</span>
          <div>${escapeHtml(mission?.firstPayWindow || "dépend du gate employeur")}</div>
        </div>
      </div>
      ${
        mission
          ? `
            <div class="warning-card">
              <strong>Ticket bloquant:</strong> ${escapeHtml(mission.blockingTicket)}
            </div>
          `
          : ""
      }
      <div class="button-row">
        <a class="button primary" href="./australia.html">Ouvrir la mission AU</a>
        <a class="button secondary" href="./sources.html">Contrôler les sources</a>
      </div>
    `;
  } else {
    body += `
      <div class="warning-card">
        <strong>État du marché:</strong> ${escapeHtml(scoreItem.market.unlockNote || "roadmap")}
      </div>
      <div class="button-row">
        <button class="button secondary" type="button" data-watch-market="${scoreItem.market.id}">
          ${isWatched ? "Retirer de la watchlist" : "Épingler pour plus tard"}
        </button>
      </div>
    `;
  }

  marketDrawer.innerHTML = body;
}

function renderHeatGrid(marketScores) {
  marketHeatGrid.innerHTML = marketScores
    .map(
      (item) => `
        <article class="card heat-card ${item.market.id === homeState.country ? "is-active" : ""} ${item.market.status === "locked" ? "is-locked" : ""}">
          <div class="pill-row">
            ${pill(item.market.label, "orange")}
            ${pill(item.market.badge, marketStatusTone(item.market.status))}
            ${pill(Math.round(item.layerScore).toString(), marketBandTone(item.band))}
          </div>
          <h3>${escapeHtml(item.market.label)}</h3>
          <p class="muted">${escapeHtml(item.market.teaser)}</p>
          <div class="heat-metrics">
            <div><span class="mini-label">Fit</span><strong>${Math.round(item.fitScore)}</strong></div>
            <div><span class="mini-label">Cash</span><strong>${Math.round(item.cashScore)}</strong></div>
            <div><span class="mini-label">Speed</span><strong>${Math.round(item.speedScore)}</strong></div>
          </div>
          <div class="button-row">
            <button class="button ${item.market.id === homeState.country ? "primary" : "secondary"}" type="button" data-market-focus="${item.market.id}">
              ${item.market.id === homeState.country ? "Pays actif" : "Ouvrir le pays"}
            </button>
            <button class="button secondary" type="button" data-watch-market="${item.market.id}">
              ${watchMarketList().includes(item.market.id) ? "Épinglé" : "Épingler"}
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderMissionBoard(context) {
  if (context.country.id === "france") {
    const topRoute = context.topRoute;
    missionBoard.innerHTML = `
      <span class="mini-label">Mission France</span>
      <h3>De ton profil vers une première candidature crédible.</h3>
      <div class="list">
        <div class="list-item">
          <span class="list-index">1</span>
          <div>
            <strong>Choisis ta porte d'entrée</strong>
            <div>${escapeHtml(topRoute ? topRoute.title : "ouvre le moteur France pour voir les routes.")}</div>
          </div>
        </div>
        <div class="list-item">
          <span class="list-index">2</span>
          <div>
            <strong>Verrouille le premier ticket utile</strong>
            <div>${escapeHtml(topRoute ? siteData.ticketMap.get(topRoute.ticketsRequired[0])?.name || "ticket à confirmer" : "pas encore de ticket conseillé")}</div>
          </div>
        </div>
        <div class="list-item">
          <span class="list-index">3</span>
          <div>
            <strong>Vise les boîtes liées</strong>
            <div>${escapeHtml(topRoute ? `${topRoute.employerIds.length} employeur(s) déjà reliés à la route.` : "les employeurs apparaissent après tri.")}</div>
          </div>
        </div>
      </div>
      <div class="button-row">
        <a class="button primary" href="${buildFranceRouteHref(context.franceSelection)}">Ouvrir la mission France</a>
        <a class="button secondary" href="./tickets.html">Voir les tickets</a>
      </div>
    `;
    return;
  }

  if (context.country.id === "australia") {
    const top = context.topRecommendation?.playbook;
    const mission = context.topMission;
    missionBoard.innerHTML = `
      <span class="mini-label">Mission Australie</span>
      <h3>Commence par une porte Perth-based credible. Le FIFO premium vient apres.</h3>
      <div class="list">
        <div class="list-item">
          <span class="list-index">1</span>
          <div>
            <strong>Valide les work rights</strong>
            <div>Sans droits reels, White Card et FIFO restent theoriques.</div>
          </div>
        </div>
        <div class="list-item">
          <span class="list-index">2</span>
          <div>
            <strong>Choisis une mission propre</strong>
            <div>${escapeHtml(mission ? mission.label : "track maintainer, TPO, civil entry ou FIFO support selon ton profil.")}</div>
          </div>
        </div>
        <div class="list-item">
          <span class="list-index">3</span>
          <div>
            <strong>Monte les gates dans l'ordre</strong>
            <div>${escapeHtml(mission ? mission.blockingTicket : top ? `${top.requiredTickets?.[0]?.name || "work rights"} puis ${top.requiredTickets?.[1]?.name || "ticket site"}` : "gates a clarifier")}</div>
          </div>
        </div>
        <div class="list-item">
          <span class="list-index">4</span>
          <div>
            <strong>Vends-toi sur la bonne porte</strong>
            <div>${escapeHtml(mission ? mission.entryVia : top ? top.firstRoles?.join(" · ") : "vise un premier role reel, pas un reve FIFO generique.")}</div>
          </div>
        </div>
      </div>
      <div class="button-row">
        <a class="button primary" href="./australia.html">Ouvrir la mission Australie</a>
        <a class="button secondary" href="./sources.html">Controler les work rights</a>
      </div>
    `;
    return;
  }

  missionBoard.innerHTML = `
    <span class="mini-label">Mission roadmap</span>
    <h3>${escapeHtml(context.country.label)} n'est pas encore live. Utilise-le comme radar, pas comme promesse.</h3>
    <div class="list">
      ${(context.roadmapActions || [])
        .map(
          (action, index) => `
            <div class="list-item">
              <span class="list-index">${index + 1}</span>
              <div>${escapeHtml(action)}</div>
            </div>
          `,
        )
        .join("")}
    </div>
    <div class="button-row">
      <button class="button secondary" type="button" data-watch-market="${escapeHtml(context.country.id)}">
        ${watchMarketList().includes(context.country.id) ? "Retirer de la watchlist" : "Épingler ce pays"}
      </button>
      <a class="button primary" href="./parcours.html">Exécuter sur France live</a>
    </div>
  `;
}

function renderLaunchpad(context) {
  if (context.country.id === "france") {
    launchpadPanel.innerHTML = `
      <span class="mini-label">Launchpad</span>
      <h3>Ce que la France te donne maintenant</h3>
      <div class="warning-card">
        <strong>Lecture:</strong> France live = routes, tickets, employeurs et cash comparatif déjà branchés.
      </div>
      <div class="list">
        ${context.insights
          .map(
            (insight, index) => `
              <div class="list-item">
                <span class="list-index">${index + 1}</span>
                <div><strong>${escapeHtml(insight.title)}</strong><div>${escapeHtml(insight.body)}</div></div>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="button-row">
        <a class="button primary" href="${buildFranceRouteHref(context.franceSelection)}">Tri France</a>
        <a class="button secondary" href="./employeurs.html">Employeurs</a>
        <a class="button secondary" href="./sources.html">Intel</a>
      </div>
    `;
    return;
  }

  if (context.country.id === "australia") {
    const top = context.topRecommendation?.playbook;
    const mission = context.topMission;
    launchpadPanel.innerHTML = `
      <span class="mini-label">Launchpad</span>
      <h3>Ce que l'Australie te donne maintenant</h3>
      <div class="warning-card">
        <strong>Cash année 1:</strong> ${escapeHtml(mission?.salaryYear1 || top?.salarySignals?.stable || "pas de bande stable fiable sans mission active")}
        <br />
        <strong>Prep:</strong> ${escapeHtml(mission?.prepWeeks ? `${mission.prepWeeks} semaines` : top?.timeToReady || "a estimer selon work rights et gates")}
      </div>
      ${
        mission
          ? `
            <div class="data-row">
              <span class="data-value">${escapeHtml(mission.label)}</span>
              <span class="data-label">${escapeHtml(mission.whyGood)}</span>
            </div>
          `
          : ""
      }
      <div class="list">
        ${context.insights
          .map(
            (insight, index) => `
              <div class="list-item">
                <span class="list-index">${index + 1}</span>
                <div><strong>${escapeHtml(insight.title)}</strong><div>${escapeHtml(insight.body)}</div></div>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="button-row">
        <a class="button primary" href="./australia.html">Playbooks AU</a>
        <a class="button secondary" href="./sources.html">Sources AU</a>
      </div>
    `;
    return;
  }

  launchpadPanel.innerHTML = `
    <span class="mini-label">Launchpad</span>
    <h3>Ce que ce pays verrouillé te donne quand même</h3>
    <div class="warning-card">
      <strong>État:</strong> ${escapeHtml(context.country.unlockNote || "roadmap")}
      <br />
      <strong>Premier verrou:</strong> ${escapeHtml(context.country.firstGate || "à documenter")}
    </div>
    <div class="list">
      ${context.insights
        .map(
          (insight, index) => `
            <div class="list-item">
              <span class="list-index">${index + 1}</span>
              <div><strong>${escapeHtml(insight.title)}</strong><div>${escapeHtml(insight.body)}</div></div>
            </div>
          `,
        )
        .join("")}
    </div>
    <div class="button-row">
      <a class="button primary" href="./index.html#worldMap">Revenir à la carte</a>
      <a class="button secondary" href="./australia.html">Voir un pays déjà beta</a>
    </div>
  `;
}

function franceRouteCardHtml(result) {
  const { lane } = result;
  const ticketLabels = lane.ticketsRequired
    .map((ticketId) => siteData.ticketMap.get(ticketId)?.name)
    .filter(Boolean)
    .slice(0, 2);

  return `
    <article class="result-card">
      <div class="pill-row">
        ${pill(`${sectorIcon(lane.sector)} ${lane.sectorLabel}`, "blue")}
        ${pill(lane.stabilityLevel, stabilityTone(lane.stabilityLevel))}
        ${pill(lane.competitionLevel, competitionTone(lane.competitionLevel))}
      </div>
      <h3 class="result-title">${escapeHtml(lane.title)}</h3>
      <p class="result-subtitle">${escapeHtml(lane.branch)} · ${escapeHtml(lane.subBranch)}</p>
      <div class="money-row">
        ${scenarioBoxHtml("Stable", lane.salaryStableScenario, "gold")}
        ${scenarioBoxHtml("Max", lane.salaryMaxScenario, "green")}
      </div>
      <div class="inline-links">
        ${ticketLabels.length
          ? ticketLabels.map((ticket) => pill(ticket, "orange")).join("")
          : pill("tickets à confirmer", "red")}
      </div>
      <div class="button-row">
        <a class="button primary" href="${escapeHtml(laneHref(lane.id))}">Voir la porte</a>
      </div>
    </article>
  `;
}

function playbookMatchTone(score) {
  if (score >= 72) {
    return "green";
  }
  if (score >= 58) {
    return "gold";
  }
  return "red";
}

function australiaPlaybookCardHtml(result) {
  const { playbook } = result;
  return `
    <article class="result-card">
      <div class="pill-row">
        ${pill(playbook.track, "blue")}
        ${pill(`Match ${result.matchScore}`, playbookMatchTone(result.matchScore))}
        ${pill(playbook.confidenceLevel || "beta", "gold")}
      </div>
      <h3 class="result-title">${escapeHtml(playbook.title)}</h3>
      <p class="result-subtitle">${escapeHtml(playbook.summary)}</p>
      <div class="detail-facts">
        <div class="detail-fact">
          <span class="mini-label">Temps</span>
          <div>${escapeHtml(playbook.timeToReady)}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Stable</span>
          <div>${escapeHtml(playbook.salarySignals?.stable || "à confirmer")}</div>
        </div>
      </div>
      <div>
        <span class="mini-label">Premiers tickets</span>
        <div class="pill-row">
          ${(playbook.requiredTickets || [])
            .slice(0, 3)
            .map((ticket) => pill(ticket.name, "orange"))
            .join("")}
        </div>
      </div>
      <div>
        <span class="mini-label">Premiers rôles</span>
        <div class="inline-links">
          ${(playbook.firstRoles || []).map((role) => pill(role, "blue")).join("")}
        </div>
      </div>
      <div class="button-row">
        <a class="button primary" href="./australia.html">Voir le playbook</a>
      </div>
    </article>
  `;
}

function australiaMissionCardHtml(result, isPrimary = false) {
  const { mission } = result;
  return `
    <article class="result-card ${isPrimary ? "card--mission" : ""}">
      <div class="pill-row">
        ${pill("Australie", "orange")}
        ${pill(mission.difficulty, mission.difficulty === "high" ? "red" : mission.difficulty === "medium" ? "gold" : "green")}
        ${pill(`Match ${result.matchScore}`, playbookMatchTone(result.matchScore))}
      </div>
      <h3 class="result-title">${escapeHtml(mission.label)}</h3>
      <p class="result-subtitle">${escapeHtml(mission.whyGood)}</p>
      ${australiaMissionMoneyRow(mission)}
      <div class="detail-facts">
        <div class="detail-fact">
          <span class="mini-label">Temps de prep</span>
          <div>${escapeHtml(`${mission.prepWeeks} semaines`)}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Premier job</span>
          <div>${escapeHtml(mission.firstRole || "à confirmer")}</div>
        </div>
        <div class="detail-fact">
          <span class="mini-label">Première paie</span>
          <div>${escapeHtml(mission.firstPayWindow || "variable")}</div>
        </div>
      </div>
      <div class="warning-card">
        <strong>Ticket bloquant:</strong> ${escapeHtml(mission.blockingTicket)}
      </div>
      <div class="button-row">
        <a class="button primary" href="./australia.html">Ouvrir la mission</a>
      </div>
    </article>
  `;
}

function renderFeatured(context) {
  if (context.country.id === "france") {
    featuredTitle.textContent = "Next move recommandé";
    featuredCopy.textContent =
      "Le moteur te sort d'abord la porte la plus actionnable, puis deux alternatives proches.";
    featuredRoutes.innerHTML = context.rankedLanes
      .slice(0, 3)
      .map((result, index) => franceRouteCardHtml(result).replace('class="result-card"', `class="result-card ${index === 0 ? "card--mission" : ""}"`))
      .join("");
    return;
  }

  if (context.country.id === "australia") {
    featuredTitle.textContent = "Next move recommandé";
    featuredCopy.textContent =
      "La première mission doit être lisible en une lecture: temps, cash année 1, ticket bloquant, porte d'entrée.";
    featuredRoutes.innerHTML = context.australiaMissionRecommendations
      .slice(0, 3)
      .map((result, index) => australiaMissionCardHtml(result, index === 0))
      .join("");
    return;
  }

  featuredTitle.textContent = `${context.country.label} est encore verrouillé`;
  featuredCopy.textContent =
    "Le site ne prétend pas encore te vendre une route parfaite. Il te montre le verrou, le signal utile et l'usage intelligent du pays.";
  featuredRoutes.innerHTML = (context.roadmapCards || [])
    .map(
      (card) => `
        <article class="result-card">
          <div class="pill-row">${pill(context.country.label, "orange")}${pill(card.title, card.tone)}</div>
          <h3 class="result-title">${escapeHtml(card.title)}</h3>
          <p class="result-subtitle">${escapeHtml(card.body)}</p>
        </article>
      `,
    )
    .join("");
}

function render() {
  const context = buildCountryContext();
  const marketScores = buildMarketScores();

  if (context.franceSelection) {
    saveSelection(context.franceSelection);
  }

  updateMissionRail();
  renderHeroStats(marketScores);
  renderProfileLab(context);
  renderHeatLayerSet();
  renderWorldMap(marketScores);
  renderMarketDrawer(
    marketScores.find((item) => item.market.id === homeState.country) || marketScores[0],
    context,
  );
  renderHeatGrid(marketScores);
  renderMissionBoard(context);
  renderLaunchpad(context);
  renderFeatured(context);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-home-reset]");
    if (resetButton) {
      homeState = normalizeHomeState(homeModel.schema, homeModel.defaults || {});
      watchMarkets = [];
      heatLayer = DEFAULT_HEAT_LAYER;
      saveHomePackage();
      render();
      return;
    }

    const toggleButton = event.target.closest("[data-home-toggle]");
    if (toggleButton) {
      const field = getField(toggleButton.dataset.homeToggle);
      const optionId = toggleButton.dataset.homeValue;
      if (!field || !optionId) {
        return;
      }
      if (field.type === "multi") {
        toggleHomeMultiValue(field, optionId);
        return;
      }
      commitHomeState({ [field.id]: optionId });
      return;
    }

    const heatButton = event.target.closest("[data-heat-layer]");
    if (heatButton) {
      commitUiState({ heatLayer: heatButton.dataset.heatLayer });
      return;
    }

    const marketButton = event.target.closest("[data-market-focus]");
    if (marketButton) {
      const marketId = marketButton.dataset.marketFocus;
      if (homeModel.worldMarketMap.has(marketId)) {
        commitHomeState({ country: marketId });
      }
      return;
    }

    const watchButton = event.target.closest("[data-watch-market]");
    if (watchButton) {
      toggleWatchMarket(watchButton.dataset.watchMarket);
    }
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-home-select]");
    if (!select) {
      return;
    }
    commitHomeState({ [select.dataset.homeSelect]: select.value });
  });
}

async function init() {
  [siteData, homeModel] = await Promise.all([loadAllData(), loadHomeModel()]);
  const saved = loadSavedHomePackage() || {};
  homeState = normalizeHomeState(homeModel.schema, saved);
  watchMarkets = normalizeArrayValue(saved._watchMarkets).filter((marketId) =>
    homeModel.worldMarketMap.has(marketId),
  );
  heatLayer = HEAT_LAYERS.some((layer) => layer.id === saved._heatLayer)
    ? saved._heatLayer
    : DEFAULT_HEAT_LAYER;

  bindEvents();
  render();
}

init();
