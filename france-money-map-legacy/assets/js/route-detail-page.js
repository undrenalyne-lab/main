import { loadAllData } from "./data.js";
import {
  DEFAULT_SELECTION,
  loadSavedSelection,
  mergeSelection,
  parseSelectionFromUrl,
  PROFILE_LABELS,
} from "./filters.js";
import {
  SCENARIO_META,
  applyScenarioPreset,
  calculatePayroll,
  createPayrollState,
} from "./payroll.js";
import { readSearchParams } from "./router.js";
import { scoreLanes, scoreSingleLane } from "./scoring.js";
import {
  accessTone,
  competitionTone,
  escapeHtml,
  laneHref,
  linkChip,
  money,
  pill,
  renderAgentBreakdown,
  renderEmptyState,
  scenarioBoxHtml,
  sectorIcon,
  stabilityTone,
} from "./ui.js";

const routeHero = document.getElementById("routeHero");
const matchPanel = document.getElementById("matchPanel");
const simulatorPanel = document.getElementById("simulatorPanel");
const pathPanel = document.getElementById("pathPanel");
const ticketsPanel = document.getElementById("ticketsPanel");
const employersPanel = document.getElementById("employersPanel");
const scorePanel = document.getElementById("scorePanel");
const reboundsPanel = document.getElementById("reboundsPanel");
const limitsPanel = document.getElementById("limitsPanel");
const sourcesPanel = document.getElementById("sourcesPanel");

let data;
let lane;
let rule;
let payrollState;
let rankedLane;
let ranking;

function renderHero() {
  routeHero.innerHTML = `
    <div class="content-grid">
      <span class="eyebrow">${sectorIcon(lane.sector)} ${escapeHtml(lane.sectorLabel)}</span>
      <h1 class="display-title">${escapeHtml(lane.title)}</h1>
      <p class="hero-copy">${escapeHtml(lane.shortDescription)}</p>
      <div class="pill-row">
        ${pill(lane.stabilityLevel, stabilityTone(lane.stabilityLevel))}
        ${pill(lane.competitionLevel, competitionTone(lane.competitionLevel))}
        ${pill(
          `Accès ${lane.accessDifficulty.label}`,
          accessTone(lane.accessDifficulty.score),
        )}
        ${pill(`Confiance ${lane.confidenceLevel}`, "gold")}
      </div>
      <div class="button-row">
        <a class="button secondary" href="./parcours.html">Retour au tri</a>
        <a class="button secondary" href="./tickets.html?id=${encodeURIComponent(lane.ticketsRequired[0] || "")}">
          Voir les tickets
        </a>
      </div>
    </div>
    <div class="metric-strip">
      <article class="metric-card">
        <span class="metric-label">Cash bas</span>
        <strong class="metric-value">${money(lane.salaryLowScenario.estimatedCashAvailable)}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">Cash stable</span>
        <strong class="metric-value">${money(lane.salaryStableScenario.estimatedCashAvailable)}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">Cash max plausible</span>
        <strong class="metric-value">${money(lane.salaryMaxScenario.estimatedCashAvailable)}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">Net sur fiche stable</span>
        <strong class="metric-value">${money(lane.salaryStableScenario.estimatedPayslipNet)}</strong>
      </article>
    </div>
  `;
}

function renderMatchPanel() {
  const matchedProfiles = rankedLane.profileMatch.matches.map(
    (profile) => PROFILE_LABELS[profile] || profile,
  );
  const rankIndex = ranking.findIndex((item) => item.lane.id === lane.id) + 1;

  matchPanel.innerHTML = `
    <h3>Pourquoi cette voie remonte</h3>
    <p class="muted">
      Position actuelle: <strong>#${rankIndex}</strong> sur ${ranking.length} voies
      dans ton snapshot sauvegardé.
    </p>
    <div class="pill-row">
      ${matchedProfiles.length
        ? matchedProfiles.map((label) => pill(`Match ${label}`, "blue")).join("")
        : pill("Peu de recyclage direct", "red")}
    </div>
    <div class="list">
      ${rankedLane.reasons
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
}

function renderScorePanel() {
  scorePanel.innerHTML = `
    <h3>Breakdown des agents</h3>
    <p class="muted">
      Vue compacte du moteur: cash, tickets, saturation, rebonds et stabilité.
    </p>
    ${renderAgentBreakdown(rankedLane.agentScores)}
  `;
}

function renderPathPanel() {
  const routeList = lane.careerQuest?.length ? lane.careerQuest : lane.entryPath;

  pathPanel.innerHTML = `
    <h3>Route d'entrée</h3>
    ${
      lane.entryTimeline
        ? `
          <div class="detail-facts">
            <div class="detail-fact">
              <span class="mini-label">Temps de formation</span>
              <div>${escapeHtml(lane.entryTimeline.trainingDuration)}</div>
            </div>
            <div class="detail-fact">
              <span class="mini-label">Avant premier job</span>
              <div>${escapeHtml(lane.entryTimeline.firstJobWindow)}</div>
            </div>
            <div class="detail-fact">
              <span class="mini-label">Mode d'accès crédible</span>
              <div>${escapeHtml(lane.entryTimeline.accessMode)}</div>
            </div>
          </div>
        `
        : ""
    }
    <div class="list">
      ${routeList
        .map(
          (step, index) => `
            <div class="list-item">
              <span class="list-index">${index + 1}</span>
              <div>${escapeHtml(step)}</div>
            </div>
          `,
        )
        .join("")}
    </div>
    ${
      lane.fitChecks?.length
        ? `
          <div>
            <span class="mini-label">Capacités à cocher</span>
            <div class="pill-row">
              ${lane.fitChecks.map((item) => pill(item, "blue")).join("")}
            </div>
          </div>
        `
        : ""
    }
    <div class="warning-card">
      <strong>Modèle de paie dominant:</strong>
      ${escapeHtml(lane.payoutModel.join(" · "))}
    </div>
    ${
      lane.workPattern
        ? `
          <div class="warning-card">
            <strong>Rythme de vie probable:</strong>
            ${escapeHtml(lane.workPattern.summary)}
            <br />
            ${escapeHtml(lane.workPattern.stablePreset || "")}
          </div>
        `
        : ""
    }
  `;
}

function renderTicketsPanel() {
  const required = lane.ticketsRequired
    .map((ticketId) => data.ticketMap.get(ticketId))
    .filter(Boolean);
  const recommended = lane.ticketsRecommended
    .map((ticketId) => data.ticketMap.get(ticketId))
    .filter(Boolean);

  ticketsPanel.innerHTML = `
    <h3>Tickets à débloquer</h3>
    <p class="muted">Les tickets d'entrée ne sont pas interchangeables avec toute la filière.</p>
    <div class="ticket-grid compact-grid">
      ${required
        .map(
          (ticket, index) => `
            <article class="card ticket-detail-card">
              <div class="pill-row">
                ${pill(`Étape ${index + 1}`, "gold")}
                ${pill(ticket.type, "blue")}
              </div>
              <div>
                <strong>${escapeHtml(ticket.name)}</strong>
                <div class="muted">${escapeHtml(ticket.type)} · ${escapeHtml(ticket.duration)}</div>
                <div class="muted">${escapeHtml(ticket.costRange)}</div>
              </div>
              <p class="muted">${escapeHtml(ticket.summary || ticket.notes)}</p>
              ${
                ticket.jobReadiness
                  ? `<div><span class="mini-label">Avant job</span><div>${escapeHtml(ticket.jobReadiness)}</div></div>`
                  : ""
              }
              ${
                ticket.accessMode
                  ? `<div><span class="mini-label">Mode d'accès</span><div>${escapeHtml(ticket.accessMode)}</div></div>`
                  : ""
              }
              ${
                ticket.accessChecks?.length
                  ? `
                    <div>
                      <span class="mini-label">Pré-requis concrets</span>
                      <div class="pill-row">
                        ${ticket.accessChecks.slice(0, 3).map((item) => pill(item, "orange")).join("")}
                      </div>
                    </div>
                  `
                  : ""
              }
              <div class="button-row">
                <a class="button secondary" href="./tickets.html?id=${encodeURIComponent(ticket.id)}">
                  Ouvrir le ticket
                </a>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
    ${
      recommended.length
        ? `
          <div>
            <span class="mini-label">Tickets recommandés</span>
            <div class="inline-links">
              ${recommended
                .map((ticket) =>
                  linkChip(
                    ticket.name,
                    `./tickets.html?id=${encodeURIComponent(ticket.id)}`,
                  ),
                )
                .join("")}
            </div>
          </div>
        `
        : ""
    }
  `;
}

function renderEmployersPanel() {
  const employers = lane.employerIds
    .map((employerId) => data.employerMap.get(employerId))
    .filter(Boolean);

  employersPanel.innerHTML = `
    <h3>Où postuler</h3>
    <div class="list">
      ${employers
        .map(
          (employer, index) => `
            <div class="list-item">
              <span class="list-index">${index + 1}</span>
              <div>
                <strong>${escapeHtml(employer.name)}</strong>
                <div class="muted">${escapeHtml(employer.applyChannel)}</div>
                <div class="pill-row">
                  ${employer.branches.slice(0, 2).map((branch) => pill(branch, "blue")).join("")}
                </div>
                ${
                  employer.url
                    ? `<div class="button-row"><a class="button secondary" href="${employer.url}" target="_blank" rel="noopener">Site carrière</a></div>`
                    : ""
                }
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderReboundsPanel() {
  reboundsPanel.innerHTML = `
    <h3>Ce que cette porte ouvre</h3>
    <div class="pill-row">
      ${lane.rebounds.map((item) => pill(item, "blue")).join("")}
    </div>
    <div>
      <span class="mini-label">Progression verticale</span>
      <div class="pill-row">
        ${lane.verticalProgression.map((item) => pill(item, "orange")).join("")}
      </div>
    </div>
    <div>
      <span class="mini-label">Canaux de candidature</span>
      <div class="pill-row">
        ${lane.applicationChannels.map((item) => pill(item, "green")).join("")}
      </div>
    </div>
  `;
}

function renderLimitsPanel() {
  limitsPanel.innerHTML = `
    <h3>Frontières et pièges</h3>
    <div class="warning-card">
      <strong>Ce que cette voie n'ouvre pas:</strong>
      ${escapeHtml(lane.doesNotOpen.join(" "))}
    </div>
    <div class="list">
      ${lane.notes
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
  `;
}

function renderSourcesPanel() {
  const sources = lane.sourceIds
    .map((sourceId) => data.sourceMap.get(sourceId))
    .filter(Boolean);

  sourcesPanel.innerHTML = `
    <h3>Sources liées</h3>
    ${
      sources.length
        ? `
            <div class="list">
              ${sources
                .map(
                  (source, index) => `
                    <div class="list-item">
                      <span class="list-index">${index + 1}</span>
                      <div>
                        <strong>${escapeHtml(source.title)}</strong>
                        <div class="muted">${escapeHtml(source.note)}</div>
                        <div class="button-row">
                          <a class="button secondary" href="${source.url}" target="_blank" rel="noopener">Ouvrir</a>
                        </div>
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          `
        : `<p class="muted">Pas de correspondance directe supplémentaire dans cette V1.</p>`
    }
  `;
}

function simulatorRange(field, label, value, min, max, step, help) {
  return `
    <label class="range-field">
      <span class="range-label">
        <span>${escapeHtml(label)}</span>
        <strong>${value}</strong>
      </span>
      <input
        type="range"
        min="${min}"
        max="${max}"
        step="${step}"
        value="${value}"
        data-payroll-range="${field}"
      />
      <span class="range-help">${escapeHtml(help)}</span>
    </label>
  `;
}

function renderSimulatorPanel() {
  const payroll = calculatePayroll(rule, payrollState);
  const gdBounds = rule.sliderBounds?.gdDays || { min: 0, max: 31, step: 1 };
  const panierBounds = rule.sliderBounds?.panierDays || { min: 0, max: 31, step: 1 };
  const nightBounds = rule.sliderBounds?.nightShifts || { min: 0, max: 31, step: 1 };
  const weekendBounds = rule.sliderBounds?.weekendShifts || { min: 0, max: 8, step: 1 };
  const overtimeBounds = rule.sliderBounds?.overtimeHours || { min: 0, max: 50, step: 2 };
  const livingBounds = rule.sliderBounds?.livingCost || { min: 300, max: 2000, step: 50 };
  const scenarioPatternNote =
    payrollState.scenario === "max"
      ? rule.patternNotes?.maxPreset
      : rule.patternNotes?.stablePreset;

  simulatorPanel.innerHTML = `
    <h3>Simulateur de fiche de paie</h3>
    <p class="muted">
      Lecture propre: net sur fiche d'un côté, indemnités chantier de l'autre, puis reste après tes dépenses.
    </p>
    ${
      rule.patternNotes?.summary
        ? `
          <div class="warning-card">
            <strong>Pattern métier:</strong>
            ${escapeHtml(rule.patternNotes.summary)}
            ${scenarioPatternNote ? `<br />${escapeHtml(scenarioPatternNote)}` : ""}
          </div>
        `
        : ""
    }
    <div class="scenario-strip">
      ${SCENARIO_META.map(
        (scenario) => `
          <button
            class="scenario-button ${payrollState.scenario === scenario.id ? "is-active" : ""}"
            type="button"
            data-scenario="${scenario.id}"
          >
            ${escapeHtml(scenario.label)}
          </button>
        `,
      ).join("")}
    </div>
    <div class="money-row">
      ${scenarioBoxHtml(
        "Net sur fiche",
        {
          estimatedCashAvailable: payroll.estimatedPayslipNet,
          estimatedPayslipNet: payroll.estimatedPayslipNet,
        },
        "gold",
        {
          subline: `base ${money(payroll.baseNetEstimate)} · variables ${money(
            payroll.taxableVariableNet,
          )}`,
        },
      )}
      ${scenarioBoxHtml(
        "Indemnités",
        {
          estimatedCashAvailable: payroll.estimatedExpenseCoverage,
          estimatedPayslipNet: payroll.estimatedPayslipNet,
        },
        "blue",
        {
          subline: `GD ${money(payroll.grandDeplacementBonus)} · repas ${money(
            payroll.panierBonus,
          )}`,
        },
      )}
      ${scenarioBoxHtml(
        "Cash avant dépenses",
        {
          estimatedCashAvailable: payroll.estimatedCashAvailable,
          estimatedPayslipNet: payroll.estimatedPayslipNet,
          estimatedExpenseCoverage: payroll.estimatedExpenseCoverage,
        },
        "green",
      )}
      ${scenarioBoxHtml(
        "Reste après dépenses",
        {
          estimatedCashAvailable: payroll.pocketAfterLiving,
          estimatedPayslipNet: payroll.estimatedPayslipNet,
        },
        "blue",
        {
          subline: `coût de vie ${money(payroll.livingCost)}`,
        },
      )}
    </div>
    <div class="range-grid">
      ${simulatorRange("gdDays", "Grand déplacement", payrollState.gdDays, gdBounds.min, gdBounds.max, gdBounds.step, "Jours indemnisés hors salaire net.")}
      ${simulatorRange("panierDays", "Paniers", payrollState.panierDays, panierBounds.min, panierBounds.max, panierBounds.step, "Repas / chantier remboursés.")}
      ${simulatorRange("nightShifts", "Nuits", payrollState.nightShifts, nightBounds.min, nightBounds.max, nightBounds.step, "Primes nettes estimées par shift.")}
      ${simulatorRange("weekendShifts", "Week-end", payrollState.weekendShifts, weekendBounds.min, weekendBounds.max, weekendBounds.step, "Majoration nette estimée.")}
      ${simulatorRange("overtimeHours", "Heures sup", payrollState.overtimeHours, overtimeBounds.min, overtimeBounds.max, overtimeBounds.step, "Calculées avec majoration 25 % puis 50 %.")}
      ${simulatorRange("livingCost", "Coût de vie", payrollState.livingCost, livingBounds.min, livingBounds.max, livingBounds.step, "Dépenses perso mensuelles estimées.")}
    </div>
    <div class="button-row">
      <button
        class="toggle-button ${payrollState.zone === "province" ? "is-active" : ""}"
        type="button"
        data-zone="province"
      >
        Zone province
      </button>
      <button
        class="toggle-button ${payrollState.zone === "paris" ? "is-active" : ""}"
        type="button"
        data-zone="paris"
      >
        Zone Paris
      </button>
      <button
        class="toggle-button ${payrollState.riskEnabled ? "is-active" : ""}"
        type="button"
        data-risk-toggle="true"
      >
        Prime environnement
      </button>
    </div>
    <table class="breakdown-table">
      <tr><td>Base nette estimée</td><td>${money(payroll.baseNetEstimate)}</td></tr>
      <tr><td>Prime nuit estimée</td><td>${money(payroll.nightBonus)}</td></tr>
      <tr><td>Week-end / fériés estimés</td><td>${money(payroll.weekendBonus)}</td></tr>
      <tr><td>Heures sup estimées</td><td>${money(payroll.overtimeBonus)}</td></tr>
      <tr><td>Prime environnement</td><td>${money(payroll.riskBonus)}</td></tr>
      <tr><td><strong>Net sur fiche estimé</strong></td><td><strong>${money(payroll.estimatedPayslipNet)}</strong></td></tr>
      <tr><td>Indemnités grand déplacement</td><td>${money(payroll.grandDeplacementBonus)}</td></tr>
      <tr><td>Indemnités repas / paniers</td><td>${money(payroll.panierBonus)}</td></tr>
      <tr><td><strong>Cash avant dépenses</strong></td><td><strong>${money(payroll.estimatedCashAvailable)}</strong></td></tr>
      <tr><td>Coût de vie</td><td>- ${money(payroll.livingCost)}</td></tr>
      <tr><td><strong>Reste après dépenses</strong></td><td><strong>${money(payroll.pocketAfterLiving)}</strong></td></tr>
    </table>
    <p class="muted">
      Le grand déplacement et les paniers sont traités ici comme indemnités de frais.
      Ils ne remplacent pas le net salarial de la fiche.
    </p>
  `;
}

simulatorPanel.addEventListener("click", (event) => {
  const scenarioButton = event.target.closest("[data-scenario]");
  if (scenarioButton) {
    payrollState = applyScenarioPreset(rule, scenarioButton.dataset.scenario, payrollState);
    renderSimulatorPanel();
    return;
  }

  const zoneButton = event.target.closest("[data-zone]");
  if (zoneButton) {
    payrollState = { ...payrollState, zone: zoneButton.dataset.zone };
    renderSimulatorPanel();
    return;
  }

  if (event.target.closest("[data-risk-toggle]")) {
    payrollState = { ...payrollState, riskEnabled: !payrollState.riskEnabled };
    renderSimulatorPanel();
  }
});

simulatorPanel.addEventListener("input", (event) => {
  const input = event.target.closest("[data-payroll-range]");
  if (!input) {
    return;
  }
  payrollState = {
    ...payrollState,
    [input.dataset.payrollRange]: Number(input.value),
  };
  renderSimulatorPanel();
});

async function init() {
  data = await loadAllData();

  const laneId = readSearchParams().get("id");
  lane = data.laneMap.get(laneId);

  if (!lane) {
    renderEmptyState(
      routeHero,
      "Porte introuvable",
      "Retourne dans le tri et rouvre une voie valide.",
    );
    [matchPanel, simulatorPanel, pathPanel, ticketsPanel, employersPanel, scorePanel, reboundsPanel, limitsPanel, sourcesPanel].forEach(
      (panel) => {
        panel.innerHTML = "";
      },
    );
    return;
  }

  rule = data.compensationMap.get(lane.id);
  const selection = mergeSelection(
    DEFAULT_SELECTION,
    loadSavedSelection(),
    parseSelectionFromUrl(),
  );
  const initialScenario = selection.goal === "cash-max" ? "max" : "stable";
  payrollState = createPayrollState(rule, initialScenario);
  ranking = scoreLanes(data.lanes, selection);
  rankedLane = scoreSingleLane(lane, data.lanes, selection);

  renderHero();
  renderMatchPanel();
  renderScorePanel();
  renderSimulatorPanel();
  renderPathPanel();
  renderTicketsPanel();
  renderEmployersPanel();
  renderReboundsPanel();
  renderLimitsPanel();
  renderSourcesPanel();
}

init();
