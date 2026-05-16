"use client";

import type { ActionPlan, UserProfile } from "./types";

export const PROFILE_STORAGE_KEY = "backchannel-atlas-v2-profile";
export const PLANS_STORAGE_KEY = "backchannel-atlas-v2-plans";
export const PENDING_SYNC_KEY = "backchannel-atlas-v2-pending-sync";

export const optionLabels = {
  englishLevel: {
    none: "Aucun",
    basic: "Basique",
    functional: "Opérationnel",
    strong: "Solide",
    fluent: "Fluent",
  },
  physicalWork: {
    low: "Léger",
    medium: "Moyen",
    high: "Dur",
    extreme: "Extrême",
  },
  riskTolerance: {
    low: "Faible",
    medium: "Moyen",
    high: "Fort",
  },
  priority: {
    cash_fast: "Cash vite",
    cash_max: "Cash max",
    stability: "Stabilité",
    visa_path: "Visa path",
    new_life: "Nouvelle vie",
  },
};

export const defaultProfile: UserProfile = {
  id: "guest-profile",
  userId: null,
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
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export const demoProfiles = {
  kevin32: {
    ...defaultProfile,
    id: "demo-kevin-32",
    identity: {
      ...defaultProfile.identity,
      firstName: "Kevin",
      ageExact: 32,
    },
    mobility: {
      ...defaultProfile.mobility,
      acceptsPhysicalWork: "high",
    },
    skills: {
      ...defaultProfile.skills,
      experienceTags: ["terrain", "elec", "rail", "hauteur"],
      proofSignals: ["nuit", "gd", "chantier"],
      yearsExperience: 4,
    },
    money: {
      ...defaultProfile.money,
      availableCash: 4500,
      targetMonthlyNet: 6000,
    },
    preferences: {
      ...defaultProfile.preferences,
      priority: "cash_max",
      riskTolerance: "high",
    },
  },
  kevin37: {
    ...defaultProfile,
    id: "demo-kevin-37",
    identity: {
      ...defaultProfile.identity,
      firstName: "Kevin",
      ageExact: 37,
    },
    mobility: {
      ...defaultProfile.mobility,
      preferredRegions: ["europe", "middle-east"],
      acceptsFIFO: false,
    },
    skills: {
      ...defaultProfile.skills,
      experienceTags: ["terrain", "elec", "meca"],
      proofSignals: ["maintenance", "chantier"],
      yearsExperience: 8,
    },
    money: {
      ...defaultProfile.money,
      availableCash: 5500,
      targetMonthlyNet: 5000,
      minimumAcceptableNet: 3200,
    },
    preferences: {
      ...defaultProfile.preferences,
      timeHorizon: "180d",
      priority: "stability",
    },
    constraints: ["WHV age-sensitive"],
  },
} satisfies Record<string, UserProfile>;

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeNumber(value: unknown, fallback: number, min = 0, max = 999999) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeProfile(candidate: Partial<UserProfile> = {}): UserProfile {
  const profile: UserProfile = {
    ...defaultProfile,
    ...candidate,
    id: candidate.id && candidate.id !== "guest-profile" ? candidate.id : uuid(),
    userId: candidate.userId || null,
    identity: { ...defaultProfile.identity, ...(candidate.identity || {}) },
    mobility: { ...defaultProfile.mobility, ...(candidate.mobility || {}) },
    skills: { ...defaultProfile.skills, ...(candidate.skills || {}) },
    money: { ...defaultProfile.money, ...(candidate.money || {}) },
    preferences: { ...defaultProfile.preferences, ...(candidate.preferences || {}) },
    constraints: normalizeArray(candidate.constraints || defaultProfile.constraints),
    createdAt: candidate.createdAt || nowIso(),
    updatedAt: nowIso(),
  };

  profile.identity.ageExact = normalizeNumber(profile.identity.ageExact, 32, 16, 75);
  profile.identity.nationality = profile.identity.nationality || "FR";
  profile.identity.passportCountry = profile.identity.passportCountry || "FR";
  profile.identity.currentCountry = profile.identity.currentCountry || "FR";
  profile.mobility.preferredRegions = Array.from(new Set(normalizeArray(profile.mobility.preferredRegions)));
  profile.skills.experienceTags = Array.from(new Set(normalizeArray(profile.skills.experienceTags)));
  profile.skills.proofSignals = Array.from(new Set(normalizeArray(profile.skills.proofSignals)));
  profile.skills.yearsExperience = normalizeNumber(profile.skills.yearsExperience, 0, 0, 45);
  profile.money.availableCash = normalizeNumber(profile.money.availableCash, 0, 0, 250000);
  profile.money.monthlyBurn = normalizeNumber(profile.money.monthlyBurn, 0, 0, 50000);
  profile.money.targetMonthlyNet = normalizeNumber(profile.money.targetMonthlyNet, 5000, 0, 100000);
  profile.money.minimumAcceptableNet = normalizeNumber(profile.money.minimumAcceptableNet, 2500, 0, 100000);
  return profile;
}

export function loadProfile() {
  if (typeof window === "undefined") return normalizeProfile();
  try {
    const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return rawValue ? normalizeProfile(JSON.parse(rawValue) as Partial<UserProfile>) : normalizeProfile();
  } catch {
    return normalizeProfile();
  }
}

export function saveProfile(profile: Partial<UserProfile>) {
  const normalized = normalizeProfile(profile);
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function loadPlans() {
  if (typeof window === "undefined") return [] as ActionPlan[];
  try {
    return JSON.parse(window.localStorage.getItem(PLANS_STORAGE_KEY) || "[]") as ActionPlan[];
  } catch {
    return [];
  }
}

export function savePlans(plans: ActionPlan[]) {
  window.localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
}

export function upsertLocalPlan(plan: ActionPlan) {
  const plans = loadPlans();
  const index = plans.findIndex((item) => item.id === plan.id);
  const next = index >= 0 ? plans.map((item) => (item.id === plan.id ? plan : item)) : [plan, ...plans];
  savePlans(next);
  return plan;
}

export function deleteLocalPlan(planId: string) {
  savePlans(loadPlans().filter((plan) => plan.id !== planId));
}

export function markPendingSync() {
  window.localStorage.setItem(PENDING_SYNC_KEY, "1");
}

export function clearPendingSync() {
  window.localStorage.removeItem(PENDING_SYNC_KEY);
}

export function hasPendingSync() {
  return typeof window !== "undefined" && window.localStorage.getItem(PENDING_SYNC_KEY) === "1";
}

export function clearLocalProductData() {
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  window.localStorage.removeItem(PLANS_STORAGE_KEY);
  window.localStorage.removeItem(PENDING_SYNC_KEY);
}
