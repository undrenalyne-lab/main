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

function routeCardHtml(result, featured = false) {
  const { lane } = result;
  const ticketLabels = lane.ticketsRequired
    .map((ticketId) => data.ticketMap.get(ticketId)?.name)
    .filter(Boolean)
    .slice(0, 3);
  const nextDoors = lane.opens.slice(0, featured ? 4 : 3);

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
      <div class="pill-row">${topAgentPills(result.agentScores)}</div>
      <div class="list">
        ${result.reasons
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
      <div>
        <span class="mini-label">Tickets d'entrée</span>
        <div class="inline-links">
          ${ticketLabels.length
            ? ticketLabels.map((ticket) => pill(ticket, "orange")).join("")
            : pill("À confirmer", "red")}
        </div>
      </div>
      <div>
        <span class="mini-label">Ce que ça ouvre ensuite</span>
        <div class="inline-links">
          ${nextDoors.map((door) => pill(door, "blue")).join("")}
        </div>
      </div>
      <div>
        <span class="mini-label">Potentiel stable</span>
        <strong>${money(lane.salaryStableScenario.estimatedPocket)}</strong>
      </div>
      <div class="button-row">
        <a class="button primary" href="${laneHref(lane.id)}">Ouvrir la fiche</a>
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
    pill(`${selection.profiles.length} profil(s) cochés`, "blue"),
    pill(`Tri: ${SORT_OPTIONS.find((option) => option.id === selection.sort)?.label}`, "gold"),
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

  const visibleLanes = data.lanes.filter((lane) =>
    matchesLaneSearch(lane, selection.search),
  );
  const ranked = scoreLanes(visibleLanes, selection);

  topSummary.textContent = `${ranked.length} voie(s) sur le radar actuel.`;
  resultsSummary.textContent = `${ranked.length} résultat(s) après tri et filtres.`;

  if (ranked.length === 0) {
    renderEmptyState(
      topResults,
      "Aucune voie ne remonte",
      "Elargis la recherche ou décoche quelques contraintes.",
    );
    allResults.innerHTML = "";
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
