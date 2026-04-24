import { readSearchParams, replaceUrlParams } from "./router.js";

export const STORAGE_KEY = "france-money-map-selection-v1";

export const GOALS = [
  {
    id: "argent-vite",
    label: "Argent vite",
    description: "Je veux un ticket d'entrée court et un cash qui démarre vite.",
  },
  {
    id: "cash-max",
    label: "Cash max",
    description: "Je vise le haut de fourchette plausible.",
  },
  {
    id: "stabilite",
    label: "Stabilité",
    description: "Je préfère une voie régulière à un mois jackpot puis un mois creux.",
  },
  {
    id: "anti-concurrence",
    label: "Anti-concurrence",
    description: "Je veux des voies moins saturées et moins racontées partout.",
  },
  {
    id: "long-terme",
    label: "Long terme",
    description: "Je veux un arbre de progression qui tient sur plusieurs années.",
  },
  {
    id: "recycler-passe",
    label: "Recycler mon passé",
    description: "Je veux capitaliser sur ce que je sais déjà faire.",
  },
];

export const PROFILES = [
  { id: "securite", label: "Sécurité" },
  { id: "elec", label: "Élec" },
  { id: "meca", label: "Méca" },
  { id: "automation", label: "Automatisme" },
  { id: "terrain", label: "Terrain" },
  { id: "rail", label: "Rail" },
  { id: "nuclear", label: "Nucléaire" },
  { id: "cvc", label: "CVC" },
  { id: "hauteur", label: "Hauteur" },
  { id: "logistique", label: "Logistique" },
  { id: "gestion", label: "Gestion" },
  { id: "admin", label: "Admin" },
  { id: "itinérance", label: "Itinérance" },
  { id: "anglais", label: "Anglais" },
  { id: "industrie", label: "Industrie" },
];

export const PROFILE_LABELS = Object.fromEntries(
  PROFILES.map((profile) => [profile.id, profile.label]),
);

export const SORT_OPTIONS = [
  { id: "score", label: "Score global" },
  { id: "cash-max", label: "Cash max" },
  { id: "cash-stable", label: "Cash stable" },
  { id: "speed", label: "Vitesse" },
  { id: "anti-foule", label: "Faible concurrence" },
  { id: "long-terme", label: "Robustesse" },
];

export const RANGE_FIELDS = [
  {
    key: "stabilityNeed",
    label: "Besoin de stabilité",
    min: 0,
    max: 100,
    step: 5,
    help: "Monte-le si tu veux éviter les mois trop irréguliers.",
  },
  {
    key: "speedNeed",
    label: "Vitesse d'entrée",
    min: 0,
    max: 100,
    step: 5,
    help: "Monte-le si tu veux du cash plus tôt même avec moins d'upside futur.",
  },
  {
    key: "physicalTolerance",
    label: "Tolérance physique",
    min: 0,
    max: 100,
    step: 5,
    help: "Bas = tu veux éviter les voies les plus dures physiquement.",
  },
  {
    key: "mobilityTolerance",
    label: "Tolérance mobilité",
    min: 0,
    max: 100,
    step: 5,
    help: "Bas = tu veux limiter grand déplacement, découchés et itinérance.",
  },
];

export const DEFAULT_SELECTION = {
  goal: "argent-vite",
  profiles: ["terrain", "elec"],
  sort: "score",
  search: "",
  stabilityNeed: 65,
  speedNeed: 60,
  physicalTolerance: 60,
  mobilityTolerance: 60,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeProfiles(value) {
  if (!value) {
    return [];
  }

  const rawValues = Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return Array.from(
    new Set(rawValues.filter((item) => PROFILE_LABELS[item])),
  );
}

function normalizeChoice(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function normalizeNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function mergeSelection(...values) {
  return values.reduce(
    (selection, partial) => ({
      ...selection,
      ...(partial || {}),
      profiles:
        partial && "profiles" in partial
          ? normalizeProfiles(partial.profiles)
          : selection.profiles,
      goal:
        partial && "goal" in partial
          ? normalizeChoice(
              partial.goal,
              GOALS.map((goal) => goal.id),
              selection.goal,
            )
          : selection.goal,
      sort:
        partial && "sort" in partial
          ? normalizeChoice(
              partial.sort,
              SORT_OPTIONS.map((option) => option.id),
              selection.sort,
            )
          : selection.sort,
      stabilityNeed:
        partial && "stabilityNeed" in partial
          ? clamp(normalizeNumber(partial.stabilityNeed, selection.stabilityNeed), 0, 100)
          : selection.stabilityNeed,
      speedNeed:
        partial && "speedNeed" in partial
          ? clamp(normalizeNumber(partial.speedNeed, selection.speedNeed), 0, 100)
          : selection.speedNeed,
      physicalTolerance:
        partial && "physicalTolerance" in partial
          ? clamp(
              normalizeNumber(partial.physicalTolerance, selection.physicalTolerance),
              0,
              100,
            )
          : selection.physicalTolerance,
      mobilityTolerance:
        partial && "mobilityTolerance" in partial
          ? clamp(
              normalizeNumber(partial.mobilityTolerance, selection.mobilityTolerance),
              0,
              100,
            )
          : selection.mobilityTolerance,
    }),
    { ...DEFAULT_SELECTION },
  );
}

export function parseSelectionFromUrl(search = window.location.search) {
  const params = readSearchParams(search);

  return mergeSelection({
    goal: params.get("goal"),
    profiles: params.get("profiles"),
    sort: params.get("sort"),
    search: params.get("q") || "",
    stabilityNeed: params.get("stability"),
    speedNeed: params.get("speed"),
    physicalTolerance: params.get("physical"),
    mobilityTolerance: params.get("mobility"),
  });
}

export function loadSavedSelection() {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }
    return mergeSelection(JSON.parse(rawValue));
  } catch (error) {
    return null;
  }
}

export function saveSelection(selection) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch (error) {
    // No-op on storage errors.
  }
}

export function syncSelectionToUrl(selection) {
  replaceUrlParams({
    goal: selection.goal,
    profiles: selection.profiles,
    sort: selection.sort === "score" ? "" : selection.sort,
    q: selection.search,
    stability:
      selection.stabilityNeed === DEFAULT_SELECTION.stabilityNeed
        ? ""
        : selection.stabilityNeed,
    speed:
      selection.speedNeed === DEFAULT_SELECTION.speedNeed ? "" : selection.speedNeed,
    physical:
      selection.physicalTolerance === DEFAULT_SELECTION.physicalTolerance
        ? ""
        : selection.physicalTolerance,
    mobility:
      selection.mobilityTolerance === DEFAULT_SELECTION.mobilityTolerance
        ? ""
        : selection.mobilityTolerance,
  });
}

export function toggleSelectionValue(values, targetValue) {
  return values.includes(targetValue)
    ? values.filter((value) => value !== targetValue)
    : [...values, targetValue];
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function matchesLaneSearch(lane, search) {
  if (!search.trim()) {
    return true;
  }

  const haystack = normalizeText(
    [
      lane.title,
      lane.branch,
      lane.subBranch,
      ...(lane.tags || []),
      ...(lane.notes || []),
      ...(lane.payoutModel || []),
      ...(lane.applicationChannels || []),
    ].join(" "),
  );

  return haystack.includes(normalizeText(search.trim()));
}

export function matchesTicketSearch(ticket, search) {
  if (!search.trim()) {
    return true;
  }

  const haystack = normalizeText(
    [
      ticket.name,
      ticket.type,
      ticket.duration,
      ticket.costRange,
      ticket.prerequisite,
      ticket.notes,
      ticket.summary,
      ticket.accessMode,
      ticket.jobReadiness,
      ticket.validity,
      ...(ticket.providerExamples || []),
      ...(ticket.branchLinks || []),
      ...(ticket.accessChecks || []),
      ...(ticket.capacityChecks || []),
      ...(ticket.modules || []),
      ...(ticket.doesNotOpen || []),
      ...(ticket.targetRoles || []),
    ].join(" "),
  );

  return haystack.includes(normalizeText(search.trim()));
}

export function matchesEmployerSearch(employer, search) {
  if (!search.trim()) {
    return true;
  }

  const haystack = normalizeText(
    [
      employer.name,
      employer.category,
      employer.applyChannel,
      ...(employer.sectors || []),
      ...(employer.branches || []),
      ...(employer.notes || []),
    ].join(" "),
  );

  return haystack.includes(normalizeText(search.trim()));
}
