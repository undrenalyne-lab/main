export type CountryStatus = "live" | "beta" | "locked";
export type ScoreStatus = "green" | "orange" | "red" | "locked";
export type VisaStatus = "eligible" | "conditional" | "blocked" | "unknown";
export type AgeGate = "eligible" | "deadline_soon" | "too_young" | "too_old" | "not_relevant" | "unknown";

export type UserProfile = {
  id: string;
  userId: string | null;
  identity: {
    firstName?: string;
    ageExact: number;
    nationality: string;
    passportCountry: string;
    currentCountry: string;
    secondPassport?: string;
  };
  mobility: {
    willingToRelocate: boolean;
    preferredRegions: string[];
    acceptsRemoteSites: boolean;
    acceptsFIFO: boolean;
    acceptsNightShift: boolean;
    acceptsPhysicalWork: "low" | "medium" | "high" | "extreme";
  };
  skills: {
    englishLevel: "none" | "basic" | "functional" | "strong" | "fluent";
    educationLevel: "none" | "trade" | "bachelor" | "master" | "other";
    drivingLicence: "none" | "car" | "truck" | "international";
    experienceTags: string[];
    proofSignals: string[];
    yearsExperience: number;
  };
  money: {
    availableCash: number;
    monthlyBurn: number;
    targetMonthlyNet: number;
    minimumAcceptableNet: number;
    currency: "EUR" | "AUD" | "CAD" | "USD" | "CHF" | "AED";
  };
  preferences: {
    timeHorizon: "30d" | "90d" | "180d" | "12m";
    riskTolerance: "low" | "medium" | "high";
    priority: "cash_fast" | "cash_max" | "stability" | "visa_path" | "new_life";
  };
  constraints: string[];
  createdAt: string;
  updatedAt: string;
};

export type CashPath = {
  id: string;
  title: string;
  targetRoles: string[];
  monthlyRangeLow: number;
  monthlyRangeStable: number;
  monthlyRangeUpside: number;
  entryCostLow: number;
  entryCostHigh: number;
  timeToFirstPayWeeks: [number, number];
  requiredTickets: string[];
  optionalTickets: string[];
  doNotBuyYet: string[];
  mainRisks: string[];
  sourceIds: string[];
};

export type CountryProfile = {
  id: string;
  slug: string;
  iso3: string;
  name: string;
  status: CountryStatus;
  geo?: { lon: number; lat: number };
  currency: UserProfile["money"]["currency"];
  netOrGross: "net" | "gross" | "mixed";
  summary: string;
  bestFor: string[];
  badFor: string[];
  fitSignals: string[];
  priorityBoosts: Partial<Record<UserProfile["preferences"]["priority"], number>>;
  mobilityBoosts: Record<string, number>;
  englishNeed: UserProfile["skills"]["englishLevel"];
  cashPaths: CashPath[];
  sourceIds: string[];
  lastUpdated: string;
  confidence: "high" | "medium" | "low";
};

export type VisaRule = {
  id: string;
  passportCountry: string;
  countryId: string;
  routeType: string;
  label: string;
  minAge: number | null;
  maxAge: number | null;
  statusWhenEligible: VisaStatus;
  summary: string;
  sourceIds: string[];
};

export type Source = {
  id: string;
  title: string;
  url: string;
  type: "official" | "government" | "job_board" | "recruiter" | "forum" | "estimate";
  countryId?: string;
  lastChecked: string;
  confidence: "high" | "medium" | "low";
  note?: string;
};

export type CountryScore = {
  countryId: string;
  slug: string;
  name: string;
  status: ScoreStatus;
  totalScore: number;
  accessScore: number;
  cashScore: number;
  speedScore: number;
  fitScore: number;
  riskScore: number;
  visaFit: VisaStatus;
  ageGate: AgeGate;
  visaLabel: string;
  realisticMonthlyRange: {
    low: number;
    stable: number;
    upside: number;
    currency: string;
    netOrGross: "net" | "gross" | "mixed";
  };
  entryCost: {
    low: number;
    high: number;
    currency: string;
    items: string[];
  };
  timeToFirstPay: {
    lowWeeks: number;
    highWeeks: number;
  };
  mainBlockers: string[];
  whyRecommended: string[];
  whyDangerous: string[];
  nextAction: string;
  sourceIds: string[];
};

export type PlanTask = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "todo" | "done";
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ActionPlan = {
  id: string;
  userId: string | null;
  profileId: string;
  countryId: string;
  title: string;
  verdict: string;
  phases: { label: "7 jours" | "30 jours" | "90 jours"; tasks: PlanTask[] }[];
  killConditions: string[];
  budget: { label: string; amount: number; currency: string }[];
  sourceIds: string[];
  progress: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type WorldFeature = {
  type: "Feature";
  properties?: { name?: string; iso3?: string };
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};
