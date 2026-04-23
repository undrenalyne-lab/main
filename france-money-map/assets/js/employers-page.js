import { loadAllData } from "./data.js";
import { matchesEmployerSearch } from "./filters.js";
import { replaceUrlParams } from "./router.js";
import { escapeHtml, laneHref, pill, renderEmptyState } from "./ui.js";

const employerSectorFilters = document.getElementById("employerSectorFilters");
const employerBranchFilters = document.getElementById("employerBranchFilters");
const employerSearch = document.getElementById("employerSearch");
const employerGrid = document.getElementById("employerGrid");

let data;
let state = {
  sector: "all",
  branch: "all",
  search: "",
};

function commitState(partial) {
  state = { ...state, ...partial };
  replaceUrlParams({
    sector: state.sector === "all" ? "" : state.sector,
    branch: state.branch === "all" ? "" : state.branch,
    search: state.search,
  });
  render();
}

function visibleBranches() {
  const employers = data.employers.filter(
    (employer) => state.sector === "all" || employer.sectors.includes(state.sector),
  );
  return Array.from(new Set(employers.flatMap((employer) => employer.branches))).sort(
    (left, right) => left.localeCompare(right, "fr"),
  );
}

function renderFilters() {
  employerSectorFilters.innerHTML = [
    `<button class="chip ${state.sector === "all" ? "is-active" : ""}" type="button" data-sector="all">Tous</button>`,
    ...data.sectors.map(
      (sector) => `
        <button
          class="chip ${state.sector === sector.id ? "is-active" : ""}"
          type="button"
          data-sector="${sector.id}"
        >
          ${escapeHtml(`${sector.icon} ${sector.name}`)}
        </button>
      `,
    ),
  ].join("");

  employerBranchFilters.innerHTML = [
    `<button class="chip ${state.branch === "all" ? "is-active" : ""}" type="button" data-branch="all">Toutes les branches</button>`,
    ...visibleBranches().slice(0, 14).map(
      (branch) => `
        <button
          class="chip ${state.branch === branch ? "is-active" : ""}"
          type="button"
          data-branch="${escapeHtml(branch)}"
        >
          ${escapeHtml(branch)}
        </button>
      `,
    ),
  ].join("");
  employerSearch.value = state.search;
}

function render() {
  renderFilters();

  const employers = data.employers.filter((employer) => {
    const sectorMatch =
      state.sector === "all" || employer.sectors.includes(state.sector);
    const branchMatch =
      state.branch === "all" || employer.branches.includes(state.branch);
    return sectorMatch && branchMatch && matchesEmployerSearch(employer, state.search);
  });

  if (employers.length === 0) {
    renderEmptyState(
      employerGrid,
      "Aucun employeur ne remonte",
      "Change de secteur, de branche ou élargis la recherche.",
    );
    return;
  }

  employerGrid.innerHTML = employers
    .map((employer) => {
      const lanes = employer.laneIds
        .map((laneId) => data.laneMap.get(laneId))
        .filter(Boolean)
        .slice(0, 4);
      return `
        <article class="card employer-card">
          <div class="pill-row">
            ${pill(employer.category, "orange")}
            ${employer.sectors
              .map((sectorId) => data.sectorMap.get(sectorId))
              .filter(Boolean)
              .map((sector) => pill(`${sector.icon} ${sector.name}`, "blue"))
              .join("")}
          </div>
          <h3>${escapeHtml(employer.name)}</h3>
          <p class="muted">${escapeHtml(employer.applyChannel)}</p>
          <div>
            <span class="mini-label">Branches liées</span>
            <div class="pill-row">
              ${employer.branches.slice(0, 4).map((branch) => pill(branch, "gold")).join("")}
            </div>
          </div>
          <div>
            <span class="mini-label">Portes liées</span>
            <div class="inline-links">
              ${lanes.map((lane) => `<a class="link-chip" href="${laneHref(lane.id)}">${escapeHtml(lane.title)}</a>`).join("")}
            </div>
          </div>
          <div class="button-row">
            ${
              employer.url
                ? `<a class="button primary" href="${employer.url}" target="_blank" rel="noopener">Site carrière</a>`
                : ""
            }
            <a class="button secondary" href="./parcours.html?q=${encodeURIComponent(employer.name)}">
              Rechercher cette boîte
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

employerSectorFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sector]");
  if (!button) {
    return;
  }
  commitState({ sector: button.dataset.sector, branch: "all" });
});

employerBranchFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-branch]");
  if (!button) {
    return;
  }
  commitState({ branch: button.dataset.branch });
});

employerSearch.addEventListener("input", (event) => {
  commitState({ search: event.target.value });
});

async function init() {
  data = await loadAllData();
  const params = new URLSearchParams(window.location.search);
  state = {
    sector: params.get("sector") || "all",
    branch: params.get("branch") || "all",
    search: params.get("search") || "",
  };
  render();
}

init();
