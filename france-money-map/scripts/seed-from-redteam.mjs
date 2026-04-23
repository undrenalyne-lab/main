import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SOURCE_HTML =
  "/Users/undrenalyne/Downloads/france_money_map_v4_redteam.html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../assets/data");

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
  "colasrail.com": "medium",
  "tso.fr": "medium",
};

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
  const baseNet = baseGrossMonthly * pay.netRatio;
  const night = preset.nightShifts * pay.nightNet;
  const weekend = preset.weekendShifts * pay.weekendNet;
  const overtime = preset.overtimeHours * pay.otNet;
  const grandDeplacement = preset.gdDays * gdRate;
  const panier = preset.panierDays * pay.panier;
  const risk = preset.riskEnabled ? pay.risk : 0;
  const estimatedPayslipNet =
    baseNet + night + weekend + overtime + grandDeplacement + panier + risk;
  const estimatedPocket = Math.max(0, estimatedPayslipNet - pay.living);

  return {
    baseNetEstimate: round(baseNet),
    nightBonus: round(night),
    weekendBonus: round(weekend),
    overtimeBonus: round(overtime),
    grandDeplacementBonus: round(grandDeplacement),
    panierBonus: round(panier),
    riskBonus: round(risk),
    estimatedPayslipNet: round(estimatedPayslipNet),
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

  return {
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
    salaryBaseNetEstimate: round(sourceLane.baseGrossMed * sourceLane.pay.netRatio),
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

  const sources = db.sources.map((source) => ({
    id: slugify(source.title),
    title: source.title,
    url: source.url,
    note: source.note,
    kind: "public-source",
    confidenceLevel: sourceConfidence(source.url),
  }));

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
      netRatio: lane.pay.netRatio,
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
        `Fourchette pocket observée: ${lane.floor} -> ${lane.intense}`,
      ],
    };
  });

  const compensationByLaneId = new Map(
    compensationRules.map((rule) => [rule.laneId, rule]),
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

  const tickets = Object.entries(db.catalog)
    .map(([id, ticket]) => {
      const usage = ticketUsage.get(id) || {
        sectors: new Set(),
        branches: new Set(),
        lanes: new Set(),
      };

      return {
        id,
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
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));

  const employers = Array.from(employerAccumulator.values())
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
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));

  const sectors = Object.values(sectorMeta).map((sector) => {
    const sectorLanes = lanes.filter((lane) => lane.sector === sector.id);
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

  writeJsonFile("lanes.json", lanes);
  writeJsonFile("tickets.json", tickets);
  writeJsonFile("employers.json", employers);
  writeJsonFile("compensation_rules.json", compensationRules);
  writeJsonFile("sources.json", sources);
  writeJsonFile("sectors.json", sectors);

  console.log(
    JSON.stringify(
      {
        lanes: lanes.length,
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
