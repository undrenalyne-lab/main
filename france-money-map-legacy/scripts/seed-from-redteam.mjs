import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import Engine from "publicodes";
import socialModel from "modele-social";
import {
  extraSources,
  laneOverrides,
  manualTickets,
  scenarioPresetOverrides,
  ticketOverrides,
} from "./seed-overrides.mjs";
import {
  atlasEmployers,
  atlasLaneSeeds,
  atlasSources,
  atlasTickets,
} from "./manual-atlas-data.mjs";

const SOURCE_HTML =
  "/Users/undrenalyne/Downloads/france_money_map_v4_redteam.html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../assets/data");
const STANDARD_MONTHLY_HOURS = 151.67;
const FIRST_OVERTIME_BAND_HOURS = 8;
const FIRST_OVERTIME_MULTIPLIER = 1.25;
const SECOND_OVERTIME_MULTIPLIER = 1.5;

const sectorMeta = {
  ferro: {
    id: "ferro",
    name: "Ferro privé",
    icon: "🚂",
    description:
      "Sécurité chantier, voie, caténaire, signalisation et sous-stations avec logique tickets -> branche -> employeurs.",
  },
  nuclear: {
    id: "nuclear",
    name: "Nucléaire",
    icon: "☢️",
    description:
      "Radioprotection, CND, maintenance, logistique et environnements à forte contrainte procédurale.",
  },
  industrial: {
    id: "industrial",
    name: "Industrie critique",
    icon: "⚙️",
    description:
      "Maintenance postée, automatisme, CVC industriel et itinérance technique pour sites sensibles.",
  },
  renewables: {
    id: "renewables",
    name: "Éolien / ENR",
    icon: "🌬️",
    description:
      "Maintenance éolienne, HTA et raccordement pour filières où la sécurité et la mobilité font la différence.",
  },
  special: {
    id: "special",
    name: "Travaux spéciaux",
    icon: "🧗",
    description:
      "Cordes, levage et tuyauterie grand déplacement avec variable cash très dépendante des conditions de mission.",
  },
  critical: {
    id: "critical",
    name: "Data centers / environnements critiques",
    icon: "🖥️",
    description:
      "Maintenance CVC, électrique et facility pour sites où la stabilité et la continuité de service priment.",
  },
  construction: {
    id: "construction",
    name: "BTP / TP",
    icon: "🏗️",
    description:
      "Grand déplacement, tunnels, VRD et génie civil lourd où l'IGD et les heures chantier changent tout.",
  },
  energy: {
    id: "energy",
    name: "Énergie / HT",
    icon: "⚡",
    description:
      "Réseaux aériens, postes, dépannage et astreintes pour monteurs réseaux et lignards.",
  },
  maritime: {
    id: "maritime",
    name: "Maritime / Offshore",
    icon: "🚢",
    description:
      "Naval, embarqué et offshore où la rotation, l'isolement et les contraintes embarquées pèsent sur la paie.",
  },
  aero: {
    id: "aero",
    name: "Aéronautique / Défense",
    icon: "✈️",
    description:
      "Maintenance MRO et environnements défense plus lents à débloquer, mais techniquement solides.",
  },
  transport: {
    id: "transport",
    name: "Transport spécialisé",
    icon: "🚛",
    description:
      "SPL, ADR, convois et découchés où la réglementation et l'endurance font le différentiel.",
  },
  environment: {
    id: "environment",
    name: "Environnement / Dépollution",
    icon: "♻️",
    description:
      "Dépollution, amiante, déchets dangereux et interventions sales ou réglementées.",
  },
  security: {
    id: "security",
    name: "Sécurité spécialisée",
    icon: "🛡️",
    description:
      "Sites sensibles, sûreté nucléaire et nuits/week-ends qui paient mieux que la sécurité standard.",
  },
  health: {
    id: "health",
    name: "Santé technique",
    icon: "🏥",
    description:
      "Routes longues mais puissantes quand l'intérim, la nuit et les services tendus prennent le relais.",
  },
  agro: {
    id: "agro",
    name: "Agro-industrie",
    icon: "🌾",
    description:
      "Process continu, 5x8, froid et usines qui valorisent vraiment les horaires décalés.",
  },
};

const profileLabels = {
  securite: "Sécurité",
  terrain: "Terrain",
  elec: "Électricité",
  meca: "Mécanique",
  automation: "Automatisme",
  rail: "Rail",
  industrie: "Industrie",
  nuclear: "Nucléaire",
  cvc: "CVC",
  hauteur: "Hauteur",
  logistique: "Logistique",
  gestion: "Gestion",
  admin: "Admin",
  anglais: "Anglais",
  "itinérance": "Itinérance",
  itinerance: "Itinérance",
};

const employerCategoryOverrides = {
  "ETF Services": "major",
  ETF: "major",
  Sferis: "major",
  "Colas Rail": "major",
  "TSO Signalisation": "major",
  TSO: "major",
  Nuvia: "major",
  Orano: "major",
  Endel: "major",
  "GE Vernova": "major",
  Vestas: "major",
  Dalkia: "major",
  Equans: "major",
  "SPIE Facilities": "major",
  "Sodexo FM": "major",
  Assystem: "major",
  Prestafer: "specialist",
  SavoirFer: "specialist",
  "PME FM critiques": "specialist",
};

const publicSourceConfidence = {
  "francetravail.fr": "high",
  "francecompetences.fr": "high",
  "emploi.sncf.com": "high",
  "sncf-reseau.com": "high",
  "omnifer.fr": "high",
  "campusfer.com": "medium",
  "sferis.fr": "medium",
  "colasrail.com": "medium",
  "tso.fr": "medium",
};

const baseNetCache = new Map();
const overtimeRatioCache = new Map();
const defaultSliderBounds = {
  gdDays: { min: 0, max: 31, step: 1 },
  panierDays: { min: 0, max: 31, step: 1 },
  nightShifts: { min: 0, max: 31, step: 1 },
  weekendShifts: { min: 0, max: 8, step: 1 },
  overtimeHours: { min: 0, max: 50, step: 2 },
  livingCost: { min: 300, max: 2000, step: 50 },
};

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function withMutedConsole(run) {
  const warn = console.warn;
  const error = console.error;
  console.warn = () => {};
  console.error = () => {};

  try {
    return run();
  } finally {
    console.warn = warn;
    console.error = error;
  }
}

const socialEngine = withMutedConsole(() => new Engine(socialModel));

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function round(value) {
  return Math.round(value);
}

function roundTo(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function salarySituation(baseGrossMonthly, extra = {}) {
  return {
    "salarié . contrat": "'CDI'",
    "salarié . contrat . salaire brut": `${round(baseGrossMonthly)} €/mois`,
    ...extra,
  };
}

function evaluateEmployeeNet(baseGrossMonthly, extra = {}) {
  return withMutedConsole(() =>
    socialEngine
      .setSituation(salarySituation(baseGrossMonthly, extra))
      .evaluate("salarié . rémunération . net . à payer avant impôt").nodeValue,
  );
}

function estimateBaseNetMonthly(baseGrossMonthly) {
  const cacheKey = round(baseGrossMonthly);
  if (!baseNetCache.has(cacheKey)) {
    baseNetCache.set(cacheKey, evaluateEmployeeNet(baseGrossMonthly));
  }
  return baseNetCache.get(cacheKey);
}

function estimateOvertimeNetRatio(baseGrossMonthly) {
  const cacheKey = round(baseGrossMonthly);
  if (!overtimeRatioCache.has(cacheKey)) {
    const baseNet = estimateBaseNetMonthly(baseGrossMonthly);
    const overtimeNet =
      evaluateEmployeeNet(baseGrossMonthly, {
        "salarié . temps de travail . heures supplémentaires": "1 heure/mois",
      }) - baseNet;
    const overtimeGross =
      (baseGrossMonthly / STANDARD_MONTHLY_HOURS) * FIRST_OVERTIME_MULTIPLIER;
    overtimeRatioCache.set(
      cacheKey,
      overtimeGross > 0 ? overtimeNet / overtimeGross : 0.9,
    );
  }
  return overtimeRatioCache.get(cacheKey);
}

function calculateOvertimeNet(baseGrossMonthly, overtimeHours) {
  const safeHours = Math.max(0, Number(overtimeHours) || 0);
  const hourlyGross = baseGrossMonthly / STANDARD_MONTHLY_HOURS;
  const firstBandHours = Math.min(FIRST_OVERTIME_BAND_HOURS, safeHours);
  const secondBandHours = Math.max(0, safeHours - FIRST_OVERTIME_BAND_HOURS);
  const overtimeGross =
    firstBandHours * hourlyGross * FIRST_OVERTIME_MULTIPLIER +
    secondBandHours * hourlyGross * SECOND_OVERTIME_MULTIPLIER;

  return overtimeGross * estimateOvertimeNetRatio(baseGrossMonthly);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function levelFromFive(value) {
  if (value <= 1) return "très faible";
  if (value === 2) return "faible";
  if (value === 3) return "moyen";
  if (value === 4) return "élevé";
  return "très élevé";
}

function stabilityLabel(value) {
  if (value >= 8) return "stable";
  if (value >= 6) return "plutôt stable";
  if (value >= 4) return "moyen";
  if (value >= 2) return "instable";
  return "très instable";
}

function inferAccessDifficulty(speed, ticketCount) {
  const score = Math.min(
    5,
    Math.max(1, Math.round((6 - speed) + ticketCount / 2)),
  );
  return {
    score,
    label: levelFromFive(score),
  };
}

function inferTicketConfidence(type) {
  if (/RNCP|Titre professionnel|Qualification SNCF/i.test(type)) {
    return "high";
  }
  if (/habilitation|sécurité|GWO|CACES/i.test(type)) {
    return "medium";
  }
  return "medium";
}

function inferPrerequisite(type) {
  if (/GWO/i.test(type)) {
    return "Aptitude médicale, hauteur et organisme certifié.";
  }
  if (/habilitation électrique/i.test(type)) {
    return "Socle électrique ou employeur prêt à te former sur le périmètre visé.";
  }
  if (/Qualification SNCF|Sécurité ferro/i.test(type)) {
    return "Accès généralement porté par un employeur ou un organisme ferro habilité.";
  }
  if (/Titre professionnel|RNCP/i.test(type)) {
    return "Temps de formation plus long, financement ou dispositif de reconversion à prévoir.";
  }
  return "Pré requis variables selon organisme, contexte chantier et employeur.";
}

function buildWorkPatternNotes(lane, scenarioPresets) {
  const override = laneOverrides[lane.id]?.workPattern;
  if (override) {
    return override;
  }

  const stable = scenarioPresets.stable;
  const max = scenarioPresets.max;

  return {
    summary: `${lane.branch} est piloté par ${((lane.model || lane.payoutModel || []).join(" · ")).toLowerCase()}.`,
    stablePreset: `Preset stable: ${stable.gdDays} GD, ${stable.panierDays} paniers, ${stable.nightShifts} nuits, ${stable.weekendShifts} week-ends, ${stable.overtimeHours} h sup.`,
    maxPreset: `Preset max: ${max.gdDays} GD, ${max.panierDays} paniers, ${max.nightShifts} nuits, ${max.weekendShifts} week-ends, ${max.overtimeHours} h sup.`,
  };
}

function buildCompensationRuleFromSeed(seed) {
  const scenarioPresets = {
    low: seed.scenarioPresets.low,
    stable: seed.scenarioPresets.stable,
    max: seed.scenarioPresets.max,
  };

  return {
    laneId: seed.id,
    baseGrossMonthly: round(seed.pay.baseGrossMonthly),
    baseNetMonthly: round(estimateBaseNetMonthly(seed.pay.baseGrossMonthly)),
    netRatio: roundTo(
      estimateBaseNetMonthly(seed.pay.baseGrossMonthly) / seed.pay.baseGrossMonthly,
      2,
    ),
    ratios: {
      overtimeNet: Number(
        estimateOvertimeNetRatio(seed.pay.baseGrossMonthly).toFixed(3),
      ),
    },
    mobility: {
      provinceDaily: seed.pay.gdProvince,
      parisDaily: seed.pay.gdParis,
    },
    allowances: {
      nightPerShiftNet: seed.pay.nightNet,
      weekendPerShiftNet: seed.pay.weekendNet,
      overtimePerHourNet: seed.pay.otNet,
      panierPerDayNet: seed.pay.panier,
      environmentMonthlyNet: seed.pay.risk,
    },
    livingCostDefault: seed.pay.living,
    regularityIndex: seed.pay.regularity,
    scenarioPresets,
    sliderBounds: defaultSliderBounds,
    patternNotes: buildWorkPatternNotes(seed, scenarioPresets),
    scenarioOutputs: {
      low: calculateScenario(seed.pay.baseGrossMonthly, seed.pay, scenarioPresets.low),
      stable: calculateScenario(
        seed.pay.baseGrossMonthly,
        seed.pay,
        scenarioPresets.stable,
      ),
      max: calculateScenario(seed.pay.baseGrossMonthly, seed.pay, scenarioPresets.max),
    },
    payoutModel: seed.payoutModel,
    notes: [
      `Base manuelle atlas: ${seed.salaryBaseBrutRange.min}–${seed.salaryBaseBrutRange.max} brut mensuel.`,
      "Net de base recalé via modele-social (moteur Mon Entreprise / Urssaf).",
      "Les grands déplacements et paniers sont traités comme indemnités de frais, pas comme net salarial.",
      "Preset dérivé des notes atlas fournies par l'utilisateur.",
    ],
  };
}

function buildManualLane(seed, compensationRule) {
  return {
    id: seed.id,
    sector: seed.sector,
    sectorLabel: sectorMeta[seed.sector].name,
    branch: seed.branch,
    subBranch: seed.subBranch,
    title: seed.title,
    shortDescription: seed.shortDescription,
    tags: seed.tags,
    hypeLevel: seed.hypeLevel || "sobre",
    competitionLevel: levelFromFive(seed.scores.competition),
    saturationLevel: levelFromFive(seed.scores.competition),
    stabilityLevel: stabilityLabel(seed.scores.stability),
    fatigueLevel: levelFromFive(seed.scores.fatigue),
    accessDifficulty: inferAccessDifficulty(
      seed.scores.speed,
      seed.ticketsRequired.length + seed.ticketsRecommended.length,
    ),
    confidenceLevel: seed.confidenceLevel,
    targetProfiles: seed.targetProfiles,
    ticketsRequired: seed.ticketsRequired,
    ticketsRecommended: seed.ticketsRecommended,
    entryPath: seed.entryPath,
    entryTimeline: seed.entryTimeline,
    fitChecks: seed.fitChecks,
    careerQuest: seed.careerQuest,
    opens: seed.opens,
    doesNotOpen: seed.doesNotOpen,
    rebounds: seed.rebounds,
    verticalProgression: seed.verticalProgression,
    employerIds: seed.employerIds,
    salaryBaseBrutRange: seed.salaryBaseBrutRange,
    salaryBaseNetEstimate: compensationRule.baseNetMonthly,
    salaryLowScenario: compensationRule.scenarioOutputs.low,
    salaryStableScenario: compensationRule.scenarioOutputs.stable,
    salaryMaxScenario: compensationRule.scenarioOutputs.max,
    payoutModel: seed.payoutModel,
    applicationChannels: seed.applicationChannels,
    scores: seed.scores,
    managerTrack: seed.managerTrack,
    ticketCount: seed.ticketsRequired.length + seed.ticketsRecommended.length,
    sourceIds: seed.sourceIds,
    notes: seed.notes,
  };
}

function extractDb(source) {
  const start = source.indexOf("const DB = ");
  const end = source.indexOf("const state=");
  if (start === -1 || end === -1) {
    throw new Error("Impossible de trouver le bloc DB dans le HTML source.");
  }

  const expression = source
    .slice(start + "const DB = ".length, end)
    .trim()
    .replace(/;\s*$/, "");

  return vm.runInNewContext(`(${expression})`, {});
}

function scenarioPresetForLane(lane, tier) {
  const override = scenarioPresetOverrides[lane.id];
  if (override?.[tier]) {
    return override[tier];
  }

  const isCritical = lane.sector === "critical";
  const presets = {
    low: {
      gdDays: isCritical ? 0 : 4,
      panierDays: 6,
      nightShifts: isCritical ? 5 : 2,
      weekendShifts: 1,
      overtimeHours: 4,
      zone: "province",
      riskEnabled: true,
    },
    stable: {
      gdDays: isCritical ? 0 : 10,
      panierDays: 10,
      nightShifts: isCritical ? 8 : 5,
      weekendShifts: 2,
      overtimeHours: 8,
      zone: "province",
      riskEnabled: true,
    },
    max: {
      gdDays: isCritical ? 0 : 18,
      panierDays: 14,
      nightShifts: isCritical ? 10 : 8,
      weekendShifts: 3,
      overtimeHours: 16,
      zone: "province",
      riskEnabled: true,
    },
  };

  return presets[tier];
}

function calculateScenario(baseGrossMonthly, pay, preset) {
  const gdRate = preset.zone === "paris" ? pay.gdParis : pay.gdProvince;
  const baseNet = estimateBaseNetMonthly(baseGrossMonthly);
  const night = preset.nightShifts * pay.nightNet;
  const weekend = preset.weekendShifts * pay.weekendNet;
  const overtime = calculateOvertimeNet(baseGrossMonthly, preset.overtimeHours);
  const grandDeplacement = preset.gdDays * gdRate;
  const panier = preset.panierDays * pay.panier;
  const risk = preset.riskEnabled ? pay.risk : 0;
  const estimatedPayslipNet = baseNet + night + weekend + overtime + risk;
  const estimatedExpenseCoverage = grandDeplacement + panier;
  const estimatedCashAvailable = estimatedPayslipNet + estimatedExpenseCoverage;
  const estimatedPocket = Math.max(0, estimatedCashAvailable - pay.living);

  return {
    baseNetEstimate: round(baseNet),
    nightBonus: round(night),
    weekendBonus: round(weekend),
    overtimeBonus: round(overtime),
    grandDeplacementBonus: round(grandDeplacement),
    panierBonus: round(panier),
    riskBonus: round(risk),
    taxableVariableNet: round(night + weekend + overtime + risk),
    estimatedPayslipNet: round(estimatedPayslipNet),
    estimatedExpenseCoverage: round(estimatedExpenseCoverage),
    estimatedCashAvailable: round(estimatedCashAvailable),
    estimatedPocket: round(estimatedPocket),
    livingCostDefault: round(pay.living),
  };
}

function sourceConfidence(url) {
  const matchedDomain = Object.keys(publicSourceConfidence).find((domain) =>
    url.includes(domain),
  );

  return matchedDomain ? publicSourceConfidence[matchedDomain] : "medium";
}

function parseProviderExamples(providers) {
  return providers
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeLane(sourceLane, laneEmployerIds, sourceIds, compensationRule) {
  const requiredCount =
    sourceLane.ticketKeys.length <= 2 ? sourceLane.ticketKeys.length : 2;
  const accessDifficulty = inferAccessDifficulty(
    sourceLane.speed,
    sourceLane.ticketKeys.length,
  );

  const baseLane = {
    id: sourceLane.id,
    sector: sourceLane.sector,
    sectorLabel: sectorMeta[sourceLane.sector].name,
    branch: sourceLane.branch,
    subBranch: sourceLane.sub,
    title: sourceLane.title,
    shortDescription: sourceLane.cashWhy,
    tags: Array.from(
      new Set([
        ...sourceLane.needs,
        ...sourceLane.past.map((profile) => profileLabels[profile] || profile),
      ]),
    ),
    hypeLevel: sourceLane.hype ? "élevé" : "sobre",
    competitionLevel: levelFromFive(sourceLane.crowd),
    saturationLevel: levelFromFive(sourceLane.crowd),
    stabilityLevel: stabilityLabel(sourceLane.stability),
    fatigueLevel: levelFromFive(sourceLane.fatigue),
    accessDifficulty,
    confidenceLevel: sourceLane.confidence,
    targetProfiles: sourceLane.past,
    ticketsRequired: sourceLane.ticketKeys.slice(0, requiredCount),
    ticketsRecommended: sourceLane.ticketKeys.slice(requiredCount),
    entryPath: sourceLane.path,
    opens: Array.from(new Set([...sourceLane.rebounds, ...sourceLane.opens])),
    doesNotOpen: [sourceLane.notOpen],
    rebounds: sourceLane.rebounds,
    verticalProgression: sourceLane.opens,
    employerIds: laneEmployerIds,
    salaryBaseBrutRange: {
      min: round(sourceLane.baseRange[0] * 1000),
      max: round(sourceLane.baseRange[1] * 1000),
    },
    salaryBaseNetEstimate: compensationRule.baseNetMonthly,
    salaryLowScenario: compensationRule.scenarioOutputs.low,
    salaryStableScenario: compensationRule.scenarioOutputs.stable,
    salaryMaxScenario: compensationRule.scenarioOutputs.max,
    payoutModel: sourceLane.model,
    applicationChannels: sourceLane.applyRoutes,
    scores: {
      speed: sourceLane.speed,
      competition: sourceLane.crowd,
      stability: sourceLane.stability,
      durability: sourceLane.durability,
      fatigue: sourceLane.fatigue,
      volatility: sourceLane.volatility,
    },
    managerTrack: sourceLane.manager,
    ticketCount: sourceLane.ticketKeys.length,
    sourceIds,
    notes: [
      sourceLane.cashWhy,
      `Limite déclarée: ${sourceLane.notOpen}`,
      `Balises source: ${sourceLane.sourceTags.join(", ")}`,
    ],
  };

  const override = laneOverrides[sourceLane.id] || {};

  return {
    ...baseLane,
    ...override,
    tags: uniqueValues([...(baseLane.tags || []), ...(override.tags || [])]),
    ticketsRequired: override.ticketsRequired || baseLane.ticketsRequired,
    ticketsRecommended:
      override.ticketsRecommended || baseLane.ticketsRecommended,
    entryPath: override.entryPath || baseLane.entryPath,
    opens: uniqueValues([...(baseLane.opens || []), ...(override.opens || [])]),
    doesNotOpen: uniqueValues([
      ...(baseLane.doesNotOpen || []),
      ...(override.doesNotOpen || []),
    ]),
    rebounds: uniqueValues([
      ...(baseLane.rebounds || []),
      ...(override.rebounds || []),
    ]),
    verticalProgression: uniqueValues([
      ...(baseLane.verticalProgression || []),
      ...(override.verticalProgression || []),
    ]),
    applicationChannels: uniqueValues([
      ...(baseLane.applicationChannels || []),
      ...(override.applicationChannels || []),
    ]),
    sourceIds: uniqueValues([...(baseLane.sourceIds || []), ...(override.sourceIds || [])]),
    notes: uniqueValues([...(baseLane.notes || []), ...(override.notes || [])]),
  };
}

function normalizeTicketRecord(ticket, usage = null) {
  const base = usage
    ? {
        id: ticket.id,
        name: ticket.name,
        type: ticket.type,
        sectorLinks: Array.from(usage.sectors),
        branchLinks: Array.from(usage.branches),
        duration: ticket.duration,
        costRange: ticket.cost,
        prerequisite: inferPrerequisite(ticket.type),
        opensLaneIds: Array.from(usage.lanes),
        notes: `Ouvre surtout: ${ticket.opens.join(" · ")}`,
        confidenceLevel: inferTicketConfidence(ticket.type),
        providerExamples: parseProviderExamples(ticket.providers),
      }
    : { ...ticket };

  const override = ticketOverrides[base.id] || {};

  return {
    ...base,
    ...override,
    sectorLinks: uniqueValues([
      ...(override.sectorLinks || base.sectorLinks || []),
    ]),
    branchLinks: uniqueValues([
      ...(override.branchLinks || base.branchLinks || []),
    ]),
    opensLaneIds: uniqueValues([
      ...(override.opensLaneIds || base.opensLaneIds || []),
    ]),
    providerExamples: uniqueValues([
      ...(override.providerExamples || base.providerExamples || []),
    ]),
    sourceIds: uniqueValues(override.sourceIds || base.sourceIds || []),
    accessChecks: uniqueValues([
      ...(override.accessChecks || base.accessChecks || []),
    ]),
    capacityChecks: uniqueValues([
      ...(override.capacityChecks || base.capacityChecks || []),
    ]),
    modules: uniqueValues([...(override.modules || base.modules || [])]),
    doesNotOpen: uniqueValues([
      ...(override.doesNotOpen || base.doesNotOpen || []),
    ]),
    nextTicketIds: uniqueValues([
      ...(override.nextTicketIds || base.nextTicketIds || []),
    ]),
    targetRoles: uniqueValues([
      ...(override.targetRoles || base.targetRoles || []),
    ]),
  };
}

function inferEmployerCategory(name, count) {
  if (employerCategoryOverrides[name]) {
    return employerCategoryOverrides[name];
  }
  if (/Manpower|Adecco|Randstad|Crit/i.test(name)) {
    return "interim";
  }
  if (/AFPA|centre|formation/i.test(name)) {
    return "training";
  }
  return count > 1 ? "major" : "specialist";
}

function findSourceIds(sourceTags, sources) {
  const normalizedTags = sourceTags.map((value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
  );

  return sources
    .filter((source) => {
      const haystack = `${source.title} ${source.note}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return normalizedTags.some((tag) => haystack.includes(tag));
    })
    .map((source) => source.id);
}

function writeJsonFile(filename, data) {
  fs.writeFileSync(
    path.join(DATA_DIR, filename),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

function main() {
  ensureDir(DATA_DIR);

  const html = fs.readFileSync(SOURCE_HTML, "utf8");
  const db = extractDb(html);

  const sources = uniqueValues([
    ...db.sources.map((source) =>
      JSON.stringify({
        id: slugify(source.title),
        title: source.title,
        url: source.url,
        note: source.note,
        kind: "public-source",
        confidenceLevel: sourceConfidence(source.url),
      }),
    ),
    ...extraSources.map((source) => JSON.stringify(source)),
    ...atlasSources.map((source) => JSON.stringify(source)),
  ]).map((value) => JSON.parse(value));

  const employerAccumulator = new Map();
  const laneSourceIdMap = new Map();

  db.lanes.forEach((lane) => {
    const sourceIds = findSourceIds(lane.sourceTags, sources);
    laneSourceIdMap.set(lane.id, sourceIds);

    lane.companies.forEach((company) => {
      const employerId = slugify(company.name);
      const bucket = employerAccumulator.get(employerId) || {
        id: employerId,
        name: company.name,
        sectors: new Set(),
        branches: new Set(),
        laneIds: new Set(),
        url: company.url || "",
        applyChannel: company.apply,
        notes: new Set(),
      };

      bucket.sectors.add(lane.sector);
      bucket.branches.add(lane.branch);
      bucket.laneIds.add(lane.id);
      bucket.notes.add(`Porte liée: ${lane.title}`);

      if (!bucket.url && company.url) {
        bucket.url = company.url;
      }

      if (!bucket.applyChannel && company.apply) {
        bucket.applyChannel = company.apply;
      }

      employerAccumulator.set(employerId, bucket);
    });
  });

  const compensationRules = db.lanes.map((lane) => {
    const scenarioPresets = {
      low: scenarioPresetForLane(lane, "low"),
      stable: scenarioPresetForLane(lane, "stable"),
      max: scenarioPresetForLane(lane, "max"),
    };

    return {
      laneId: lane.id,
      baseGrossMonthly: round(lane.baseGrossMed),
      baseNetMonthly: round(estimateBaseNetMonthly(lane.baseGrossMed)),
      netRatio: lane.pay.netRatio,
      ratios: {
        overtimeNet: Number(
          estimateOvertimeNetRatio(lane.baseGrossMed).toFixed(3),
        ),
      },
      mobility: {
        provinceDaily: lane.pay.gdProvince,
        parisDaily: lane.pay.gdParis,
      },
      allowances: {
        nightPerShiftNet: lane.pay.nightNet,
        weekendPerShiftNet: lane.pay.weekendNet,
        overtimePerHourNet: lane.pay.otNet,
        panierPerDayNet: lane.pay.panier,
        environmentMonthlyNet: lane.pay.risk,
      },
      livingCostDefault: lane.pay.living,
      regularityIndex: lane.pay.regularity,
      scenarioPresets,
      sliderBounds: defaultSliderBounds,
      patternNotes: buildWorkPatternNotes(lane, scenarioPresets),
      scenarioOutputs: {
        low: calculateScenario(lane.baseGrossMed, lane.pay, scenarioPresets.low),
        stable: calculateScenario(
          lane.baseGrossMed,
          lane.pay,
          scenarioPresets.stable,
        ),
        max: calculateScenario(lane.baseGrossMed, lane.pay, scenarioPresets.max),
      },
      payoutModel: lane.model,
      notes: [
        `Base visée depuis la source Red Team: ${lane.base}`,
        `Net de base recalé via modele-social (moteur Mon Entreprise / Urssaf).`,
        `Les grands déplacements et paniers sont traités comme indemnités de frais, pas comme net salarial.`,
        `Fourchette pocket observée dans la base source: ${lane.floor} -> ${lane.intense}`,
      ],
    };
  });

  const compensationByLaneId = new Map(
    compensationRules.map((rule) => [rule.laneId, rule]),
  );

  const atlasCompensationRules = atlasLaneSeeds.map((seed) =>
    buildCompensationRuleFromSeed(seed),
  );
  atlasCompensationRules.forEach((rule) =>
    compensationByLaneId.set(rule.laneId, rule),
  );

  const lanes = db.lanes.map((lane) => {
    const employerIds = lane.companies.map((company) => slugify(company.name));
    return normalizeLane(
      lane,
      employerIds,
      laneSourceIdMap.get(lane.id) || [],
      compensationByLaneId.get(lane.id),
    );
  });
  const atlasLanes = atlasLaneSeeds.map((seed) =>
    buildManualLane(seed, compensationByLaneId.get(seed.id)),
  );
  const allLanes = [...lanes, ...atlasLanes];

  const ticketUsage = new Map();

  db.lanes.forEach((lane) => {
    lane.ticketKeys.forEach((ticketId) => {
      const usage = ticketUsage.get(ticketId) || {
        sectors: new Set(),
        branches: new Set(),
        lanes: new Set(),
      };

      usage.sectors.add(lane.sector);
      usage.branches.add(lane.branch);
      usage.lanes.add(lane.id);
      ticketUsage.set(ticketId, usage);
    });
  });

  atlasLaneSeeds.forEach((lane) => {
    [...lane.ticketsRequired, ...lane.ticketsRecommended].forEach((ticketId) => {
      const usage = ticketUsage.get(ticketId) || {
        sectors: new Set(),
        branches: new Set(),
        lanes: new Set(),
      };
      usage.sectors.add(lane.sector);
      usage.branches.add(lane.branch);
      usage.lanes.add(lane.id);
      ticketUsage.set(ticketId, usage);
    });
  });

  const generatedTickets = Object.entries(db.catalog).map(([id, ticket]) => {
    const usage = ticketUsage.get(id) || {
      sectors: new Set(),
      branches: new Set(),
      lanes: new Set(),
    };

    return normalizeTicketRecord({ id, ...ticket }, usage);
  });

  const tickets = [
    ...generatedTickets,
    ...manualTickets.map((ticket) => normalizeTicketRecord(ticket)),
    ...atlasTickets.map((ticket) => normalizeTicketRecord(ticket)),
  ]
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));

  const employers = [
    ...Array.from(employerAccumulator.values())
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: inferEmployerCategory(entry.name, entry.laneIds.size),
      sectors: Array.from(entry.sectors),
      branches: Array.from(entry.branches),
      url: entry.url,
      applyChannel: entry.applyChannel || "Candidature directe",
      notes: Array.from(entry.notes),
      confidenceLevel: entry.url ? "medium" : "low",
      laneIds: Array.from(entry.laneIds),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "fr")),
    ...atlasEmployers,
  ].sort((left, right) => left.name.localeCompare(right.name, "fr"));

  const sectors = Object.values(sectorMeta).map((sector) => {
    const sectorLanes = allLanes.filter((lane) => lane.sector === sector.id);
    return {
      ...sector,
      laneCount: sectorLanes.length,
      laneIds: sectorLanes.map((lane) => lane.id),
      branchCount: new Set(sectorLanes.map((lane) => lane.branch)).size,
      ticketCount: new Set(
        sectorLanes.flatMap((lane) => [...lane.ticketsRequired, ...lane.ticketsRecommended]),
      ).size,
    };
  });

  const allCompensationRules = [...compensationRules, ...atlasCompensationRules];

  writeJsonFile("lanes.json", allLanes);
  writeJsonFile("tickets.json", tickets);
  writeJsonFile("employers.json", employers);
  writeJsonFile("compensation_rules.json", allCompensationRules);
  writeJsonFile("sources.json", sources);
  writeJsonFile("sectors.json", sectors);

  console.log(
    JSON.stringify(
      {
        lanes: allLanes.length,
        tickets: tickets.length,
        employers: employers.length,
        sources: sources.length,
        sectors: sectors.length,
      },
      null,
      2,
    ),
  );
}

main();
