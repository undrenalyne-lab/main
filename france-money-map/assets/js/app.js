import { loadAllData } from "./data.js";
import { DEFAULT_SELECTION, GOALS } from "./filters.js";
import { scoreLanes } from "./scoring.js";
import {
  competitionTone,
  escapeHtml,
  laneHref,
  money,
  pill,
  scenarioBoxHtml,
  sectorIcon,
  stabilityTone,
} from "./ui.js";

const statsRoot = document.getElementById("heroStats");
const goalCards = document.getElementById("goalCards");
const sectorCards = document.getElementById("sectorCards");
const featuredRoutes = document.getElementById("featuredRoutes");

function renderGoalCards() {
  goalCards.innerHTML = GOALS.map(
    (goal) => `
      <article class="card">
        <h3>${escapeHtml(goal.label)}</h3>
        <p class="muted">${escapeHtml(goal.description)}</p>
        <div class="button-row">
          <a class="button primary" href="./parcours.html?goal=${encodeURIComponent(goal.id)}">
            Lancer avec cet angle
          </a>
        </div>
      </article>
    `,
  ).join("");
}

function renderStats(data) {
  statsRoot.querySelector('[data-stat="lanes"]').textContent = data.lanes.length;
  statsRoot.querySelector('[data-stat="tickets"]').textContent = data.tickets.length;
  statsRoot.querySelector('[data-stat="employers"]').textContent =
    data.employers.length;
  statsRoot.querySelector('[data-stat="sectors"]').textContent = data.sectors.length;
}

function renderSectors(sectors) {
  sectorCards.innerHTML = sectors
    .map(
      (sector) => `
        <article class="card">
          <div class="pill-row">
            ${pill(`${sector.icon} ${sector.name}`, "blue")}
            ${pill(`${sector.laneCount} portes`, "orange")}
            ${pill(`${sector.ticketCount} tickets`, "gold")}
          </div>
          <h3>${escapeHtml(sector.name)}</h3>
          <p class="muted">${escapeHtml(sector.description)}</p>
          <div class="button-row">
            <a class="button secondary" href="./parcours.html?q=${encodeURIComponent(sector.name)}">
              Explorer
            </a>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderFeatured(ranked) {
  featuredRoutes.innerHTML = ranked
    .slice(0, 4)
    .map(
      ({ lane }) => `
        <article class="result-card">
          <div class="pill-row">
            ${pill(`${sectorIcon(lane.sector)} ${lane.sectorLabel}`, "blue")}
            ${pill(lane.stabilityLevel, stabilityTone(lane.stabilityLevel))}
            ${pill(lane.competitionLevel, competitionTone(lane.competitionLevel))}
          </div>
          <h3 class="result-title">${escapeHtml(lane.title)}</h3>
          <p class="result-subtitle">${escapeHtml(lane.branch)}</p>
          <div class="money-row">
            ${scenarioBoxHtml("Bas", lane.salaryLowScenario, "blue")}
            ${scenarioBoxHtml("Stable", lane.salaryStableScenario, "gold")}
            ${scenarioBoxHtml("Max", lane.salaryMaxScenario, "green")}
          </div>
          <p class="muted">${escapeHtml(lane.shortDescription)}</p>
          <div class="button-row">
            <a class="button primary" href="${laneHref(lane.id)}">Voir la porte</a>
          </div>
        </article>
      `,
    )
    .join("");
}

async function init() {
  const data = await loadAllData();
  renderGoalCards();
  renderStats(data);
  renderSectors(data.sectors);
  renderFeatured(scoreLanes(data.lanes, DEFAULT_SELECTION));
}

init();
