import { loadAllData, loadHomeModel, loadSourceExtras } from "./data.js";
import { escapeHtml, linkChip, pill } from "./ui.js";

const HOME_STORAGE_KEY = "backchannel-atlas-home-onboarding-v1";
const LEGACY_HOME_STORAGE_KEYS = ["france-money-map-home-onboarding-v1"];

const auSnapshotPanel = document.getElementById("auSnapshotPanel");
const auRightsPanel = document.getElementById("auRightsPanel");
const auWarningsPanel = document.getElementById("auWarningsPanel");
const auMissionGrid = document.getElementById("auMissionGrid");
const auTicketGrid = document.getElementById("auTicketGrid");
const auSequenceGrid = document.getElementById("auSequenceGrid");
const auChannelGrid = document.getElementById("auChannelGrid");
const auPanelGrid = document.getElementById("auPanelGrid");
const auTrapGrid = document.getElementById("auTrapGrid");
const auSourceGrid = document.getElementById("auSourceGrid");

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

function loadSavedHomeState() {
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

function normalizeFieldValue(field, rawValue, fallbackValue) {
  const allowedIds = new Set(field.options.map((option) => option.id));

  if (field.id === "country") {
    return rawValue ?? fallbackValue ?? "australia";
  }

  if (field.type === "multi") {
    const values = normalizeArrayValue(rawValue ?? fallbackValue).filter((value) =>
      allowedIds.has(value),
    );
    const maxSelected = field.maxSelected || values.length || field.options.length;
    return Array.from(new Set(values)).slice(0, maxSelected);
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

function getFieldOption(fieldMap, fieldId, optionId) {
  return fieldMap.get(fieldId)?.options.find((option) => option.id === optionId);
}

function getOptionLabel(fieldMap, fieldId, optionId) {
  return getFieldOption(fieldMap, fieldId, optionId)?.label || optionId;
}

function matchesInsightRule(rule, homeState) {
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
    when.experienceTagsAny &&
    !homeState.experienceTags.some((tag) => when.experienceTagsAny.includes(tag))
  ) {
    return false;
  }
  if (when.goalsAny && !homeState.goals.some((goal) => when.goalsAny.includes(goal))) {
    return false;
  }

  return true;
}

function scoreWeightMap(weightMap = {}, selectedValue) {
  return weightMap[selectedValue] || 0;
}

function scoreMultiWeightMap(weightMap = {}, selectedValues = []) {
  return selectedValues.reduce((total, value) => total + (weightMap[value] || 0), 0);
}

function buildPlaybookRecommendations(countryConfig, homeState, playbooks, sourceMap) {
  return (countryConfig.playbookWeights || [])
    .map((rule) => {
      const playbook = playbooks.find((item) => item.title === rule.title);
      if (!playbook) {
        return null;
      }

      const weights = rule.weights || {};
      const rawScore =
        scoreWeightMap(weights.nationality, homeState.nationality) +
        scoreWeightMap(weights.ageBand, homeState.ageBand) +
        scoreWeightMap(weights.mobility, homeState.mobility) +
        scoreWeightMap(weights.english, homeState.english) +
        scoreMultiWeightMap(weights.experienceTags, homeState.experienceTags) +
        scoreMultiWeightMap(weights.goals, homeState.goals);

      return {
        playbook,
        matchScore: Math.max(0, Math.min(99, 50 + rawScore)),
        recommendedSources: (rule.recommendedSourceIds || [])
          .map((sourceId) => sourceMap.get(sourceId))
          .filter(Boolean),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.matchScore - left.matchScore);
}

function scoreMission(homeState, mission) {
  let score = 46;

  if (mission.id === "track-protection-officer") {
    score += homeState.experienceTags.includes("rail") ? 18 : 0;
    score += homeState.experienceTags.includes("securite") ? 10 : 0;
    score += homeState.experienceTags.includes("elec") ? 8 : 0;
    score += ["functional", "strong"].includes(homeState.english) ? 10 : -10;
    score += ["national", "remote-roster"].includes(homeState.mobility) ? 8 : -4;
    score += homeState.goals.includes("cash-upside") ? 10 : 0;
  } else if (mission.id === "track-maintainer") {
    score += homeState.experienceTags.includes("terrain") ? 14 : 0;
    score += homeState.experienceTags.includes("rail") ? 12 : 0;
    score += homeState.goals.includes("fast-entry") ? 10 : 0;
    score += ["regional", "national", "remote-roster"].includes(homeState.mobility)
      ? 8
      : -4;
  } else if (mission.id === "fifo-process-operator") {
    score += homeState.mobility === "remote-roster" ? 18 : -8;
    score += ["functional", "strong"].includes(homeState.english) ? 10 : -12;
    score += homeState.goals.includes("cash-upside") ? 14 : 0;
    score += homeState.experienceTags.includes("meca") ? 10 : 0;
    score += homeState.experienceTags.includes("logistique") ? 8 : 0;
  } else if (mission.id === "civil-labourer-traffic") {
    score += homeState.goals.includes("fast-entry") ? 16 : 0;
    score += homeState.experienceTags.includes("terrain") ? 10 : 0;
    score += ["local", "regional", "national"].includes(homeState.mobility) ? 8 : 0;
  }

  if (["eu", "sponsor"].includes(homeState.nationality)) {
    score -= mission.id === "fifo-process-operator" ? 10 : 0;
    score -= mission.id === "track-protection-officer" ? 6 : 0;
  }

  return Math.max(0, Math.min(99, score));
}

function rankMissions(homeState, guide) {
  return (guide.missions || [])
    .map((mission) => ({
      mission,
      matchScore: scoreMission(homeState, mission),
    }))
    .sort((left, right) => right.matchScore - left.matchScore);
}

function missionDifficultyTone(level) {
  if (level === "high") {
    return "red";
  }
  if (level === "medium") {
    return "gold";
  }
  return "green";
}

function playbookTone(score) {
  if (score >= 72) {
    return "green";
  }
  if (score >= 58) {
    return "gold";
  }
  return "red";
}

function renderGuidePanels(fieldMap, homeState, insights, topMission, topPlaybook, guide) {
  auSnapshotPanel.innerHTML = `
    <span class="mini-label">Snapshot compact</span>
    <h3>Le marche Australie se lit d'abord par droits, age reel, anglais et mobilite.</h3>
    <div class="pill-row">
      ${pill(getOptionLabel(fieldMap, "nationality", homeState.nationality), "orange")}
      ${pill(getOptionLabel(fieldMap, "ageBand", homeState.ageBand), "blue")}
      ${pill(getOptionLabel(fieldMap, "mobility", homeState.mobility), "green")}
      ${pill(getOptionLabel(fieldMap, "english", homeState.english), "gold")}
    </div>
    <div class="data-row">
      <span class="data-value">${escapeHtml(topMission?.label || "profil a regler")}</span>
      <span class="data-label">${
        topMission
          ? escapeHtml(`Mission la plus propre maintenant · ${topMission.salaryYear1}`)
          : "Regle le profil sur le hub pour lire une mission propre."
      }</span>
    </div>
    ${
      topPlaybook
        ? `
          <div class="warning-card">
            <strong>Lecture du moment:</strong> ${escapeHtml(topPlaybook.playbook.title)} · match ${topPlaybook.matchScore}
          </div>
        `
        : ""
    }
  `;

  auRightsPanel.innerHTML = `
    <span class="mini-label">Work rights block</span>
    <h3>La voie la plus propre reste: droit au travail, puis porte Perth-based, puis roster plus dur.</h3>
    <div class="route-timeline">
      ${(guide.workRightsFlow || [])
        .map(
          (item) => `
            <article class="timeline-step">
              <span class="badge badge--beta">${escapeHtml(item.label)}</span>
              <p>${escapeHtml(item.body)}</p>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="warning-card">
      <strong>Point de controle:</strong> ${escapeHtml(
        homeState.ageBand === "35-44" || homeState.ageBand === "45+"
          ? "verifie la realite de la voie visa avant tout achat terrain"
          : "la voie working holiday ou sponsorship doit etre verifiee avant tickets chers",
      )}
    </div>
  `;

  auWarningsPanel.innerHTML = `
    <span class="mini-label">Reality check</span>
    <h3>${escapeHtml(guide.warning.title)}</h3>
    <p class="muted">${escapeHtml(guide.warning.body)}</p>
    <div class="list">
      ${(insights.length ? insights : [])
        .slice(0, 3)
        .map(
          (insight, index) => `
            <div class="list-item">
              <span class="list-index">${index + 1}</span>
              <div>
                <strong>${escapeHtml(insight.title)}</strong>
                <div>${escapeHtml(insight.body)}</div>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderMissions(rankedMissions) {
  auMissionGrid.innerHTML = rankedMissions
    .map(
      (entry) => `
        <article class="card source-card card--mission au-playbook-card">
          <div class="pill-row">
            <span class="badge ${entry.mission.status === "live" ? "badge--live" : entry.mission.status === "beta" ? "badge--beta" : "badge--data"}">${escapeHtml(entry.mission.status)}</span>
            ${pill(`Match ${entry.matchScore}`, playbookTone(entry.matchScore))}
            ${pill(entry.mission.difficulty, missionDifficultyTone(entry.mission.difficulty))}
          </div>
          <h3>${escapeHtml(entry.mission.label)}</h3>
          <div class="detail-facts">
            <div class="detail-fact">
              <span class="mini-label">Preparation</span>
              <div>${escapeHtml(`${entry.mission.prepWeeks} semaines`)}</div>
            </div>
            <div class="detail-fact">
              <span class="mini-label">Cash annee 1</span>
              <div>${escapeHtml(entry.mission.salaryYear1)}</div>
            </div>
          </div>
          <div class="warning-card">
            <strong>Ticket bloquant:</strong> ${escapeHtml(entry.mission.blockingTicket)}
          </div>
          <div class="data-row">
            <span class="data-value">${escapeHtml(entry.mission.whyGood)}</span>
            <span class="data-label">Pourquoi cette porte peut etre rentable et plus propre que le fantasme FIFO direct</span>
          </div>
          <div class="playbook-sections">
            <section class="playbook-section">
              <span class="mini-label">Entree via</span>
              <p class="muted">${escapeHtml(entry.mission.entryVia)}</p>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Next step</span>
              <p class="muted">${escapeHtml(entry.mission.nextStep)}</p>
            </section>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTicketStages(stages) {
  auTicketGrid.innerHTML = stages
    .map(
      (stage) => `
        <article class="card source-card card--ticket">
          <div class="pill-row">${pill(stage.stage, "blue")}</div>
          <div class="list">
            ${stage.items
              .map(
                (item, index) => `
                  <div class="list-item">
                    <span class="list-index">${index + 1}</span>
                    <div>
                      <strong>${escapeHtml(item.name)}</strong>
                      <div>${escapeHtml(`${item.cost} · ${item.duration}`)}</div>
                      <div class="muted">${escapeHtml(item.note)}</div>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderSequence(timeline) {
  auSequenceGrid.innerHTML = timeline
    .map(
      (step) => `
        <article class="card source-card">
          <div class="pill-row"><span class="badge badge--data">${escapeHtml(step.label)}</span></div>
          <p class="muted">${escapeHtml(step.body)}</p>
        </article>
      `,
    )
    .join("");
}

function renderChannels(channels) {
  auChannelGrid.innerHTML = channels
    .map(
      (channel) => `
        <article class="panel">
          <span class="mini-label">${escapeHtml(channel.label)}</span>
          <div class="inline-links">
            ${channel.items.map((item) => pill(item, "blue")).join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPanels(panels) {
  auPanelGrid.innerHTML = panels
    .map(
      (panel) => `
        <article class="card source-card">
          <div class="pill-row">${pill(panel.title, panel.tone || "blue")}</div>
          <div class="list">
            ${panel.points
              .map(
                (point, index) => `
                  <div class="list-item">
                    <span class="list-index">${index + 1}</span>
                    <div>${escapeHtml(point)}</div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTraps(traps) {
  auTrapGrid.innerHTML = traps
    .map(
      (trap) => `
        <article class="card source-card card--trap">
          <div class="pill-row">
            <span class="badge badge--warning">${escapeHtml(trap.label)}</span>
          </div>
          <h3>${escapeHtml(trap.claim)}</h3>
          <p class="muted">${escapeHtml(trap.reality)}</p>
        </article>
      `,
    )
    .join("");
}

function renderSources(sources) {
  auSourceGrid.innerHTML = sources
    .map(
      (source) => `
        <article class="card source-card">
          <div class="pill-row">
            ${pill(source.kind, "blue")}
            ${pill(source.confidenceLevel, "gold")}
          </div>
          <h3>${escapeHtml(source.title)}</h3>
          <p class="muted">${escapeHtml(source.note)}</p>
          <div class="button-row">
            <a class="button secondary" href="${source.url}" target="_blank" rel="noreferrer">
              Ouvrir
            </a>
          </div>
        </article>
      `,
    )
    .join("");
}

async function init() {
  const [data, homeModel, extras] = await Promise.all([
    loadAllData(),
    loadHomeModel(),
    loadSourceExtras(),
  ]);

  const homeState = normalizeHomeState(homeModel.schema, loadSavedHomeState() || {});
  const fieldMap = new Map(homeModel.fields.map((field) => [field.id, field]));
  const countryConfig = homeModel.countryMap.get("australia");
  const insights = (countryConfig.insightRules || []).filter((rule) =>
    matchesInsightRule(rule, homeState),
  );
  const playbookRecommendations = buildPlaybookRecommendations(
    countryConfig,
    homeState,
    extras.australiaPlaybooks,
    data.sourceMap,
  );
  const rankedMissions = rankMissions(homeState, extras.australiaGuide);
  const australiaSources = data.sources.filter((source) => source.id.startsWith("au-"));

  renderGuidePanels(
    fieldMap,
    homeState,
    insights,
    rankedMissions[0]?.mission || null,
    playbookRecommendations[0] || null,
    extras.australiaGuide,
  );
  renderMissions(rankedMissions);
  renderTicketStages(extras.australiaGuide.ticketStages || []);
  renderSequence(extras.australiaGuide.timeline || []);
  renderChannels(extras.australiaGuide.channels || []);
  renderPanels(extras.australiaPanels || []);
  renderTraps(extras.australiaGuide.traps || []);
  renderSources(australiaSources);
}

init();
