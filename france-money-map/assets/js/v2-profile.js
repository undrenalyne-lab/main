export const PROFILE_STORAGE_KEY = "backchannel-atlas-v2-profile";
export const PLANS_STORAGE_KEY = "backchannel-atlas-v2-plans";
export const PLAN_TASKS_STORAGE_KEY = "backchannel-atlas-v2-plan-tasks";

export const DEMO_PROFILES = {
  kevin32: {
    identity: {
      firstName: "Kevin",
      ageExact: 32,
      nationality: "FR",
      passportCountry: "FR",
      currentCountry: "FR",
    },
    mobility: {
      willingToRelocate: true,
      preferredRegions: ["europe", "oceania"],
      acceptsRemoteSites: true,
      acceptsFIFO: true,
      acceptsNightShift: true,
      acceptsPhysicalWork: "high",
    },
    skills: {
      englishLevel: "functional",
      educationLevel: "trade",
      drivingLicence: "car",
      experienceTags: ["terrain", "elec", "rail", "hauteur"],
      proofSignals: ["nuit", "gd", "chantier"],
      yearsExperience: 4,
    },
    money: {
      availableCash: 4500,
      monthlyBurn: 1100,
      targetMonthlyNet: 6000,
      minimumAcceptableNet: 3000,
      currency: "EUR",
    },
    preferences: {
      timeHorizon: "90d",
      riskTolerance: "high",
      priority: "cash_max",
    },
    constraints: [],
  },
  kevin37: {
    identity: {
      firstName: "Kevin",
      ageExact: 37,
      nationality: "FR",
      passportCountry: "FR",
      currentCountry: "FR",
    },
    mobility: {
      willingToRelocate: true,
      preferredRegions: ["europe", "middle-east"],
      acceptsRemoteSites: true,
      acceptsFIFO: false,
      acceptsNightShift: true,
      acceptsPhysicalWork: "medium",
    },
    skills: {
      englishLevel: "functional",
      educationLevel: "trade",
      drivingLicence: "car",
      experienceTags: ["terrain", "elec", "meca"],
      proofSignals: ["maintenance", "chantier"],
      yearsExperience: 8,
    },
    money: {
      availableCash: 5500,
      monthlyBurn: 1400,
      targetMonthlyNet: 5000,
      minimumAcceptableNet: 3200,
      currency: "EUR",
    },
    preferences: {
      timeHorizon: "180d",
      riskTolerance: "medium",
      priority: "stability",
    },
    constraints: ["WHV age-sensitive"],
  },
};

export const DEFAULT_PROFILE = {
  identity: {
    firstName: "",
    ageExact: 32,
    nationality: "FR",
    passportCountry: "FR",
    currentCountry: "FR",
  },
  mobility: {
    willingToRelocate: true,
    preferredRegions: ["europe", "oceania"],
    acceptsRemoteSites: true,
    acceptsFIFO: true,
    acceptsNightShift: true,
    acceptsPhysicalWork: "medium",
  },
  skills: {
    englishLevel: "functional",
    educationLevel: "trade",
    drivingLicence: "car",
    experienceTags: ["terrain", "elec"],
    proofSignals: [],
    yearsExperience: 3,
  },
  money: {
    availableCash: 3000,
    monthlyBurn: 1000,
    targetMonthlyNet: 5000,
    minimumAcceptableNet: 2800,
    currency: "EUR",
  },
  preferences: {
    timeHorizon: "90d",
    riskTolerance: "medium",
    priority: "cash_fast",
  },
  constraints: [],
};

export const optionLabels = {
  englishLevel: {
    none: "Aucun",
    basic: "Basique",
    functional: "Operationnel",
    strong: "Solide",
    fluent: "Fluent",
  },
  physicalWork: {
    low: "Leger",
    medium: "Moyen",
    high: "Dur",
    extreme: "Extreme",
  },
  riskTolerance: {
    low: "Faible",
    medium: "Moyen",
    high: "Fort",
  },
  priority: {
    cash_fast: "Cash vite",
    cash_max: "Cash max",
    stability: "Stabilite",
    visa_path: "Visa path",
    new_life: "Nouvelle vie",
  },
};

export function nowIso() {
  return new Date().toISOString();
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeNumber(value, fallback, min = 0, max = 999999) {
  const next = Number(value);
  if (!Number.isFinite(next)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, next));
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (!value) {
    return [];
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeProfile(candidate = {}) {
  const base = deepClone(DEFAULT_PROFILE);
  const profile = {
    id: candidate.id || crypto.randomUUID(),
    userId: candidate.userId || null,
    identity: { ...base.identity, ...(candidate.identity || {}) },
    mobility: { ...base.mobility, ...(candidate.mobility || {}) },
    skills: { ...base.skills, ...(candidate.skills || {}) },
    money: { ...base.money, ...(candidate.money || {}) },
    preferences: { ...base.preferences, ...(candidate.preferences || {}) },
    constraints: normalizeArray(candidate.constraints || base.constraints),
    createdAt: candidate.createdAt || nowIso(),
    updatedAt: nowIso(),
  };

  profile.identity.ageExact = normalizeNumber(profile.identity.ageExact, 32, 16, 75);
  profile.identity.nationality = profile.identity.nationality || "FR";
  profile.identity.passportCountry = profile.identity.passportCountry || "FR";
  profile.identity.currentCountry = profile.identity.currentCountry || "FR";
  profile.skills.yearsExperience = normalizeNumber(profile.skills.yearsExperience, 0, 0, 45);
  profile.skills.experienceTags = Array.from(new Set(normalizeArray(profile.skills.experienceTags)));
  profile.skills.proofSignals = Array.from(new Set(normalizeArray(profile.skills.proofSignals)));
  profile.mobility.preferredRegions = Array.from(new Set(normalizeArray(profile.mobility.preferredRegions)));
  profile.money.availableCash = normalizeNumber(profile.money.availableCash, 0, 0, 250000);
  profile.money.monthlyBurn = normalizeNumber(profile.money.monthlyBurn, 0, 0, 50000);
  profile.money.targetMonthlyNet = normalizeNumber(profile.money.targetMonthlyNet, 5000, 0, 100000);
  profile.money.minimumAcceptableNet = normalizeNumber(profile.money.minimumAcceptableNet, 2500, 0, 100000);

  return profile;
}

export function loadProfile() {
  try {
    const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return rawValue ? normalizeProfile(JSON.parse(rawValue)) : normalizeProfile();
  } catch (error) {
    return normalizeProfile();
  }
}

export function saveProfile(profile) {
  const normalized = normalizeProfile(profile);
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearProfile() {
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function applyDemoProfile(key) {
  return saveProfile(DEMO_PROFILES[key] || DEFAULT_PROFILE);
}

export function loadPlans() {
  try {
    return JSON.parse(window.localStorage.getItem(PLANS_STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

export function savePlans(plans) {
  window.localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
}

export function upsertPlan(plan) {
  const plans = loadPlans();
  const index = plans.findIndex((item) => item.id === plan.id);
  if (index >= 0) {
    plans[index] = plan;
  } else {
    plans.unshift(plan);
  }
  savePlans(plans);
  return plan;
}

export function deletePlan(planId) {
  savePlans(loadPlans().filter((plan) => plan.id !== planId));
}

export function exportLocalData() {
  return {
    profile: loadProfile(),
    plans: loadPlans(),
    exportedAt: nowIso(),
    storage: "localStorage",
  };
}

export function clearLocalProductData() {
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  window.localStorage.removeItem(PLANS_STORAGE_KEY);
  window.localStorage.removeItem(PLAN_TASKS_STORAGE_KEY);
}
