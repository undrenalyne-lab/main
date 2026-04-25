import { loadAllData } from "./data.js";
import {
  DEFAULT_SELECTION,
  GOALS,
  PROFILES,
  RANGE_FIELDS,
  SORT_OPTIONS,
  loadSavedSelection,
  matchesLaneSearch,
  mergeSelection,
  parseSelectionFromUrl,
  saveSelection,
  syncSelectionToUrl,
  toggleSelectionValue,
} from "./filters.js";
import { scoreLanes } from "./scoring.js";
import {
  accessTone,
  competitionTone,
  escapeHtml,
  laneHref,
  money,
  pill,
  renderEmptyState,
  scenarioBoxHtml,
  sectorIcon,
  stabilityTone,
  topAgentPills,
} from "./ui.js";

const goalFilters = document.getElementById("goalFilters");
const profileFilters = document.getElementById("profileFilters");
const sortFilters = document.getElementById("sortFilters");
const rangeControls = document.getElementById("rangeControls");
const routeSearch = document.getElementById("routeSearch");
const topResults = document.getElementById("topResults");
const allResults = document.getElementById("allResults");
const topSummary = document.getElementById("topSummary");
const resultsSummary = document.getElementById("resultsSummary");
const snapshotPills = document.getElementById("snapshotPills");
const briefPanel = document.getElementById("briefPanel");
const tradeoffPanel = document.getElementById("tradeoffPanel");
const decisionTablePanel = document.getElementById("decisionTablePanel");

let data;
let selection;

function commitSelection(partial) {
  selection = mergeSelection(selection, partial);
  saveSelection(selection);
  syncSelectionToUrl(selection);
  render();
}

function renderGoalFilters() {
  goalFilters.innerHTML = GOALS.map(
    (goal) => `
      <button
        class="chip ${selection.goal === goal.id ? "is-active" : ""}"
        type="button"
        data-goal="${goal.id}"
      >
        ${escapeHtml(goal.label)}
      </button>
    `,
  ).join("");
}

function renderProfileFilters() {
  profileFilters.innerHTML = PROFILES.map(
    (profile) => `
      <button
        class="chip ${selection.profiles.includes(profile.id) ? "is-active" : ""}"
        type="button"
        data-profile="${profile.id}"
      >
        ${escapeHtml(profile.label)}
      </button>
    `,
  ).join("");
}

function renderSortFilters() {
  sortFilters.innerHTML = SORT_OPTIONS.map(
    (option) => `
      <button
        class="chip ${selection.sort === option.id ? "is-active" : ""}"
        type="button"
        data-sort="${option.id}"
      >
        ${escapeHtml(option.label)}
      </button>
    `,
  ).join("");
}

function renderRangeControls() {
  rangeControls.innerHTML = RANGE_FIELDS.map(
    (field) => `
      <label class="range-field">
        <span class="range-label">
          <span>${escapeHtml(field.label)}</span>
          <strong>${selection[field.key]}</strong>
        </span>
        <input
          type="range"
          min="${field.min}"
          max="${field.max}"
          step="${field.step}"
          value="${selection[field.key]}"
          data-range="${field.key}"
        />
        <span class="range-help">${escapeHtml(field.help)}</span>
      </label>
    `,
  ).join("");
}

function entryWindow(lane) {
  return lane.entryTimeline?.firstJobWindow || "délai à confirmer";
}

function trainingWindow(lane) {
  return lane.entryTimeline?.trainingDuration || "séquence variable selon ticket";
}

function firstTicket(lane) {
  return data.ticketMap.get(lane.ticketsRequired[0]);
}

function firstTicketLabel(lane) {
  return firstTicket(lane)?.name || "ticket à confirmer";
}

function primaryTrap(lane) {
  return lane.doesNotOpen?.[0] || lane.notes?.[0] || "vérifie la vraie tâche avant d'acheter un ticket";
}

function cashDriverLabel(lane) {
  return lane.payoutModel?.slice(0, 2).join(" + ") || "base + variables chantier";
}

function routeRiskPills(lane) {
  const pills = [];
  if (lane.workPattern?.summary) {
    pills.push(pill("rythme terrain", "red"));
  }
  if ((lane.ticketsRequired || []).length >= 3) {
    pills.push(pill("plusieurs verrous", "orange"));
  }
  if ((lane.rebounds || []).length >= 3) {
    pills.push(pill("bons rebonds", "green"));
  }
  return pills.join("");
}

function renderBriefPanel() {
  const goalLabel =
    GOALS.find((goal) => goal.id === selection.goal)?.label || selection.goal;
  const profileLabels = selection.profiles
    .map((profileId) => PROFILES.find((profile) => profile.id === profileId)?.label)
    .filter(Boolean);

  briefPanel.innerHTML = `
    <span class="mini-label">Brief actuel</span>
    <h3>Ce que tu demandes vraiment au moteur</h3>
    <p class="muted">
      Ce résumé sert à vérifier que tu n'essaies pas d'optimiser des choses
      contradictoires sans le voir.
    </p>
    <div class="detail-facts">
      <div class="detail-fact">
        <span class="mini-label">Objectif pilote</span>
        <div>${escapeHtml(goalLabel)}</div>
      </div>
      <div class="detail-fact">
        <span class="mini-label">Avant premier job</span>
        <div>${selection.speedNeed >= 70 ? "tu veux du rapide" : "tu acceptes un peu de délai"}</div>
      </div>
      <div class="detail-fact">
        <span class="mini-label">Besoin de régularité</span>
        <div>${selection.stabilityNeed >= 70 ? "élevé" : selection.stabilityNeed <= 40 ? "faible" : "moyen"}</div>
      </div>
      <div class="detail-fact">
        <span class="mini-label">Mobilité acceptée</span>
        <div>${selection.mobilityTolerance >= 75 ? "nationale / découchés possibles" : selection.mobilityTolerance <= 35 ? "plutôt locale" : "intermédiaire"}</div>
      </div>
    </div>
    <div>
      <span class="mini-label">Signaux déjà vendables</span>
      <div class="pill-row">
        ${profileLabels.length
          ? profileLabels.map((label) => pill(label, "blue")).join("")
          : pill("aucun signal fort", "red")}
      </div>
    </div>
    ${
      selection.search
        ? `<div class="warning-card"><strong>Recherche en cours:</strong> ${escapeHtml(selection.search)}</div>`
        : ""
    }
  `;
}

function buildTradeoffNotes() {
  const notes = [];

  if (selection.speedNeed >= 70 && selection.stabilityNeed >= 70) {
    notes.push(
      "Tu demandes à la fois de la vitesse et de la régularité. Le moteur va souvent favoriser des routes moins explosives mais plus réalistes.",
    );
  } else if (selection.speedNeed >= 70) {
    notes.push(
      "Tu privilégies l'entrée rapide. Le moteur tolère davantage des routes plus courtes à l'entrée, même si leur plafond long terme est moins propre.",
    );
  } else if (selection.stabilityNeed >= 70) {
    notes.push(
      "Tu privilégies la régularité. Les routes trop dépendantes du jackpot chantier ou d'un mois exceptionnel perdent du terrain.",
    );
  }

  if (selection.mobilityTolerance <= 35) {
    notes.push(
      "Mobilité basse: tu élimines une bonne partie des routes où le cash tient surtout aux découchés, au grand déplacement ou aux roster lourds.",
    );
  } else if (selection.mobilityTolerance >= 75) {
    notes.push(
      "Mobilité haute: le moteur peut te proposer des routes où l'argent vient fortement des déplacements, des nuits et des week-ends.",
    );
  }

  if (selection.physicalTolerance <= 35) {
    notes.push(
      "Tolérance physique basse: certaines voies très payantes mais abrasives descendent volontairement dans le classement.",
    );
  }

  if (selection.profiles.length === 0) {
    notes.push(
      "Sans signal d'expérience, les tickets et la friction d'entrée pèsent plus lourd que d'habitude.",
    );
  }

  if (notes.length === 0) {
    notes.push(
      "Ton brief est relativement équilibré. Le moteur cherche donc des routes qui tiennent à la fois sur le cash stable, l'accès réel et les rebonds.",
    );
  }

  return notes.slice(0, 3);
}

function renderTradeoffPanel(ranked) {
  const notes = buildTradeoffNotes();
  const best = ranked[0]?.lane;

  tradeoffPanel.innerHTML = `
    <span class="mini-label">Compromis visibles</span>
    <h3>Ce que ton brief favorise ou pénalise</h3>
    <div class="list">
      ${notes
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
    ${
      best
        ? `
          <div class="warning-card">
            <strong>Signal dominant du Top 1:</strong>
            ${escapeHtml(best.shortDescription)}
          </div>
        `
        : ""
    }
  `;
}

function renderDecisionTable(ranked) {
  const topThree = ranked.slice(0, 3);

  if (!topThree.length) {
    decisionTablePanel.innerHTML = "";
    return;
  }

  decisionTablePanel.innerHTML = `
    <span class="mini-label">Comparateur express</span>
    <h3>Comparer les trois premières sans ouvrir trois onglets</h3>
    <div class="table-wrap">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Route</th>
            <th>Stable</th>
            <th>Avant job</th>
            <th>Premier verrou</th>
            <th>Piège principal</th>
          </tr>
        </thead>
        <tbody>
          ${topThree
            .map(
              ({ lane }) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(lane.title)}</strong>
                    <div class="muted">${escapeHtml(lane.branch)}</div>
                  </td>
                  <td>${money(lane.salaryStableScenario.estimatedCashAvailable)}</td>
                  <td>${escapeHtml(entryWindow(lane))}</td>
                  <td>${escapeHtml(firstTicketLabel(lane))}</td>
                  <td>${escapeHtml(primaryTrap(lane))}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function routeCardHtml(result, featured = false) {
  const { lane } = result;
  const ticketLabels = lane.ticketsRequired
    .map((ticketId) => data.ticketMap.get(ticketId)?.name)
    .filter(Boolean)
    .slice(0, 3);
  const nextDoors = lane.opens.slice(0, featured ? 4 : 3);
  const topReason = result.reasons[0] || "la route sort surtout sur le compromis global";
  const ticketHref = firstTicket(lane)
    ? `./tickets.html?id=${encodeURIComponent(firstTicket(lane).id)}`
    : "./tickets.html";
  const employerHref = `./employeurs.html?route=${encodeURIComponent(lane.id)}`;

  return `
    <article class="result-card">
      <div class="pill-row">
        ${pill(`${sectorIcon(lane.sector)} ${lane.sectorLabel}`, "blue")}
        ${pill(lane.stabilityLevel, stabilityTone(lane.stabilityLevel))}
        ${pill(lane.competitionLevel, competitionTone(lane.competitionLevel))}
        ${pill(
          `Accès ${lane.accessDifficulty.label}`,
          accessTone(lane.accessDifficulty.score),
        )}
      </div>
      <h3 class="result-title">${escapeHtml(lane.title)}</h3>
      <p class="result-subtitle">
        ${escapeHtml(lane.branch)} · ${escapeHtml(lane.subBranch)}
      </p>
      <div class="money-row">
        ${scenarioBoxHtml("Bas", lane.salaryLowScenario, "blue")}
        ${scenarioBoxHtml("Stable", lane.salaryStableScenario, "gold")}
        ${scenarioBoxHtml("Max", lane.salaryMaxScenario, "green")}
      </div>
      <div class="pill-row">${topAgentPills(result.agentScores)}${routeRiskPills(lane)}</div>
      <article class="decision-note">
        <span class="mini-label">Pourquoi cette route sort</span>
        <p>${escapeHtml(topReason)}</p>
      </article>
      <div class="decision-meta-grid">
        <div class="decision-meta-card">
          <span class="mini-label">Avant premier job</span>
          <strong>${escapeHtml(entryWindow(lane))}</strong>
          <div class="muted">${escapeHtml(trainingWindow(lane))}</div>
        </div>
        <div class="decision-meta-card">
          <span class="mini-label">Premier verrou</span>
          <strong>${escapeHtml(firstTicketLabel(lane))}</strong>
          <div class="muted">${ticketLabels.length ? `${ticketLabels.length} ticket(s) clés` : "ticket à confirmer"}</div>
        </div>
        <div class="decision-meta-card">
          <span class="mini-label">Le cash tient surtout à</span>
          <strong>${escapeHtml(cashDriverLabel(lane))}</strong>
          <div class="muted">${escapeHtml(primaryTrap(lane))}</div>
        </div>
      </div>
      <div>
        <span class="mini-label">Ce que ça ouvre ensuite</span>
        <div class="inline-links">
          ${nextDoors.length
            ? nextDoors.map((door) => pill(door, "blue")).join("")
            : pill("rebonds à confirmer", "red")}
        </div>
      </div>
      <div class="button-row">
        <a class="button primary" href="${laneHref(lane.id)}">Ouvrir la fiche</a>
        <a class="button secondary" href="${ticketHref}">Voir le verrou</a>
        <a class="button secondary" href="${employerHref}">Prospecter</a>
      </div>
    </article>
  `;
}

function renderSnapshot() {
  snapshotPills.innerHTML = [
    pill(
      GOALS.find((goal) => goal.id === selection.goal)?.label || selection.goal,
      "orange",
    ),
    pill(`${selection.profiles.length} signal(s) vendables`, "blue"),
    pill(
      `Tri: ${SORT_OPTIONS.find((option) => option.id === selection.sort)?.label}`,
      "gold",
    ),
    pill(`Stabilité ${selection.stabilityNeed}`, "green"),
    pill(`Physique ${selection.physicalTolerance}`, "green"),
    pill(`Mobilité ${selection.mobilityTolerance}`, "green"),
  ].join("");
}

function render() {
  renderGoalFilters();
  renderProfileFilters();
  renderSortFilters();
  renderRangeControls();
  routeSearch.value = selection.search;
  renderSnapshot();
  renderBriefPanel();

  const visibleLanes = data.lanes.filter((lane) =>
    matchesLaneSearch(lane, selection.search),
  );
  const ranked = scoreLanes(visibleLanes, selection);

  renderTradeoffPanel(ranked);
  renderDecisionTable(ranked);

  topSummary.textContent = `${ranked.length} voie(s) sur le radar. Le Top 3 sert à arbitrer vite, pas à te faire oublier les coûts cachés.`;
  resultsSummary.textContent = `${ranked.length} résultat(s) après tri et filtres. La liste complète sert à scanner les alternatives proches sans repartir de zéro.`;

  if (ranked.length === 0) {
    renderEmptyState(
      topResults,
      "Aucune voie ne remonte",
      "Elargis la recherche ou décoche quelques contraintes.",
    );
    allResults.innerHTML = "";
    decisionTablePanel.innerHTML = "";
    return;
  }

  topResults.innerHTML = ranked.slice(0, 3).map((item) => routeCardHtml(item, true)).join("");
  allResults.innerHTML = ranked.map((item) => routeCardHtml(item)).join("");
}

goalFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-goal]");
  if (!button) {
    return;
  }
  commitSelection({ goal: button.dataset.goal });
});

profileFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile]");
  if (!button) {
    return;
  }
  commitSelection({
    profiles: toggleSelectionValue(selection.profiles, button.dataset.profile),
  });
});

sortFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sort]");
  if (!button) {
    return;
  }
  commitSelection({ sort: button.dataset.sort });
});

rangeControls.addEventListener("input", (event) => {
  const input = event.target.closest("[data-range]");
  if (!input) {
    return;
  }
  commitSelection({ [input.dataset.range]: Number(input.value) });
});

routeSearch.addEventListener("input", (event) => {
  commitSelection({ search: event.target.value });
});

async function init() {
  data = await loadAllData();
  selection = mergeSelection(
    DEFAULT_SELECTION,
    loadSavedSelection(),
    parseSelectionFromUrl(),
  );
  render();
}

init();
