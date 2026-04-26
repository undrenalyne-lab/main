import { loadAllData, loadHomeModel, loadSourceExtras } from "./data.js";
import { escapeHtml, linkChip, pill } from "./ui.js";

const HOME_STORAGE_KEY = "backchannel-atlas-home-onboarding-v1";
const LEGACY_HOME_STORAGE_KEYS = ["france-money-map-home-onboarding-v1"];

const auSnapshotPanel = document.getElementById("auSnapshotPanel");
const auGatesPanel = document.getElementById("auGatesPanel");
const auWarningsPanel = document.getElementById("auWarningsPanel");
const auPlaybookGrid = document.getElementById("auPlaybookGrid");
const auPanelGrid = document.getElementById("auPanelGrid");
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

function playbookTone(score) {
  if (score >= 72) {
    return "green";
  }
  if (score >= 58) {
    return "gold";
  }
  return "red";
}

function buildRecommendations(countryConfig, homeState, playbooks, sourceMap) {
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

function renderGuidePanels(fieldMap, homeState, insights, recommendations) {
  const topMatch = recommendations[0];

  auSnapshotPanel.innerHTML = `
    <span class="mini-label">Snapshot compact</span>
    <h3>Le marché Australie dépend d'abord du droit d'entrée.</h3>
    <div class="pill-row">
      ${pill(getOptionLabel(fieldMap, "nationality", homeState.nationality), "orange")}
      ${pill(getOptionLabel(fieldMap, "ageBand", homeState.ageBand), "blue")}
      ${pill(getOptionLabel(fieldMap, "mobility", homeState.mobility), "green")}
      ${pill(getOptionLabel(fieldMap, "english", homeState.english), "gold")}
    </div>
    <div class="warning-card">
      <strong>Meilleur match actuel:</strong>
      ${topMatch ? `${escapeHtml(topMatch.playbook.title)} · match ${topMatch.matchScore}` : "règle d'abord ton profil compact sur le hub"}
    </div>
    ${
      topMatch
        ? `
          <div class="detail-facts">
            <div class="detail-fact">
              <span class="mini-label">Temps pour être prêt</span>
              <div>${escapeHtml(topMatch.playbook.timeToReady)}</div>
            </div>
            <div class="detail-fact">
              <span class="mini-label">Cash stable</span>
              <div>${escapeHtml(topMatch.playbook.salarySignals?.stable || "à confirmer")}</div>
            </div>
          </div>
        `
        : ""
    }
  `;

  auGatesPanel.innerHTML = `
    <span class="mini-label">Gates</span>
    <h3>Les filtres qui bloquent vraiment le marché.</h3>
    <div class="list">
      ${(insights.length ? insights : [
        {
          title: "Profil non réglé",
          body: "Passe par le hub pour régler nationalité, âge, mobilité et anglais avant d'interpréter les playbooks.",
        },
      ])
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

  auWarningsPanel.innerHTML = `
    <span class="mini-label">Red flags</span>
    <h3>Les raccourcis à tuer avant départ.</h3>
    <div class="list">
      <div class="list-item">
        <span class="list-index">A</span>
        <div>UE ≠ droit automatique de travailler en Australie.</div>
      </div>
      <div class="list-item">
        <span class="list-index">B</span>
        <div>White Card seule ≠ FIFO ni cash élevé.</div>
      </div>
      <div class="list-item">
        <span class="list-index">C</span>
        <div>Sans mobilité roster, anglais opérationnel et vraie expérience site, le marché se ferme vite.</div>
      </div>
    </div>
  `;
}

function renderPlaybooks(recommendations) {
  auPlaybookGrid.innerHTML = recommendations
    .map(
      (result) => `
        <article class="card source-card au-playbook-card">
          <div class="pill-row">
            ${pill(result.playbook.track, "blue")}
            ${pill(`Match ${result.matchScore}`, playbookTone(result.matchScore))}
            ${pill(result.playbook.confidenceLevel || "beta", "gold")}
          </div>
          <h3>${escapeHtml(result.playbook.title)}</h3>
          <p class="muted">${escapeHtml(result.playbook.summary)}</p>
          <div class="detail-facts">
            <div class="detail-fact">
              <span class="mini-label">Temps pour être prêt</span>
              <div>${escapeHtml(result.playbook.timeToReady)}</div>
            </div>
            <div class="detail-fact">
              <span class="mini-label">D'où vient le cash</span>
              <div>${escapeHtml(result.playbook.cashStack)}</div>
            </div>
          </div>
          <div class="playbook-sections">
            <section class="playbook-section">
              <span class="mini-label">Pour qui cette route colle</span>
              <div class="pill-row">
                ${(result.playbook.fitFor || []).map((item) => pill(item, "green")).join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">À éviter si</span>
              <div class="list">
                ${(result.playbook.avoidIf || [])
                  .map(
                    (item, index) => `
                      <div class="list-item">
                        <span class="list-index">${index + 1}</span>
                        <div>${escapeHtml(item)}</div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Ordre réel</span>
              <div class="route-timeline">
                ${(result.playbook.pathStages || [])
                  .map(
                    (stage) => `
                      <article class="timeline-step">
                        <span class="pill is-orange">${escapeHtml(stage.label)}</span>
                        <p>${escapeHtml(stage.body)}</p>
                      </article>
                    `,
                  )
                  .join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Gates</span>
              <div class="list">
                ${result.playbook.gates
                  .map(
                    (gate, index) => `
                      <div class="list-item">
                        <span class="list-index">${index + 1}</span>
                        <div>${escapeHtml(gate)}</div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Tickets dans l'ordre</span>
              <div class="ticket-stack">
                ${(result.playbook.requiredTickets || [])
                .map(
                  (ticket, index) => `
                    <article class="detail-fact">
                      <span class="mini-label">${index + 1}. ${escapeHtml(ticket.type)}</span>
                      <strong>${escapeHtml(ticket.name)}</strong>
                      <div class="muted">${escapeHtml(ticket.why)}</div>
                    </article>
                  `,
                )
                .join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Tickets à ajouter seulement si la mission les demande</span>
              <div class="inline-links">
                ${(result.playbook.optionalTickets || []).map((ticket) => pill(ticket, "blue")).join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Premiers rôles crédibles</span>
              <div class="inline-links">
                ${(result.playbook.firstRoles || []).map((role) => pill(role, "gold")).join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Signal salaire</span>
              <div class="salary-ladder">
                <div class="salary-ladder-row">
                  <span>Bas</span>
                  <strong>${escapeHtml(result.playbook.salarySignals?.low || "—")}</strong>
                </div>
                <div class="salary-ladder-row">
                  <span>Stable</span>
                  <strong>${escapeHtml(result.playbook.salarySignals?.stable || "—")}</strong>
                </div>
                <div class="salary-ladder-row">
                  <span>Upside</span>
                  <strong>${escapeHtml(result.playbook.salarySignals?.upside || "—")}</strong>
                </div>
                <div class="salary-ladder-row">
                  <span>Repère annuel</span>
                  <strong>${escapeHtml(result.playbook.salarySignals?.annualSignal || "—")}</strong>
                </div>
              </div>
              <div class="list">
                ${(result.playbook.salaryNotes || [])
                  .map(
                    (note, index) => `
                      <div class="list-item">
                        <span class="list-index">${index + 1}</span>
                        <div>${escapeHtml(note)}</div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Ce que tu fais cette semaine</span>
              <div class="list">
                ${(result.playbook.firstWeekActions || [])
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
            </section>
            <section class="playbook-section">
              <span class="mini-label">Angle recruteur</span>
              <div class="inline-links">
                ${(result.playbook.recruiterAngles || []).map((item) => pill(item, "orange")).join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Ce que ça n'ouvre pas</span>
              <div class="list">
                ${(result.playbook.whatItDoesNotOpen || [])
                  .map(
                    (item, index) => `
                      <div class="list-item">
                        <span class="list-index">${index + 1}</span>
                        <div>${escapeHtml(item)}</div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Étapes suivantes</span>
              <div class="inline-links">
                ${result.playbook.nextMoves.map((move) => pill(move, "gold")).join("")}
              </div>
            </section>
            <section class="playbook-section">
              <div class="warning-card">
                <strong>Pièges:</strong>
                ${escapeHtml(result.playbook.redFlags.join(" · "))}
              </div>
            </section>
            <section class="playbook-section">
              <span class="mini-label">Sources à contrôler</span>
              <div class="inline-links">
                ${result.recommendedSources
                  .map((source) => linkChip(source.title.split("—")[0].trim(), source.url))
                  .join("")}
              </div>
            </section>
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
  const recommendations = buildRecommendations(
    countryConfig,
    homeState,
    extras.australiaPlaybooks,
    data.sourceMap,
  );
  const australiaSources = data.sources.filter((source) => source.id.startsWith("au-"));

  renderGuidePanels(fieldMap, homeState, insights, recommendations);
  renderPlaybooks(recommendations);
  renderPanels(extras.australiaPanels);
  renderSources(australiaSources);
}

init();
