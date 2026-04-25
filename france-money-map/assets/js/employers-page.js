import { loadAllData } from "./data.js";
import { matchesEmployerSearch } from "./filters.js";
import { replaceUrlParams } from "./router.js";
import { escapeHtml, laneHref, pill, renderEmptyState } from "./ui.js";

const employerSectorFilters = document.getElementById("employerSectorFilters");
const employerBranchFilters = document.getElementById("employerBranchFilters");
const employerSearch = document.getElementById("employerSearch");
const employerGuidePanel = document.getElementById("employerGuidePanel");
const employerContextPanel = document.getElementById("employerContextPanel");
const employerTacticsPanel = document.getElementById("employerTacticsPanel");
const employerResultsSummary = document.getElementById("employerResultsSummary");
const employerGrid = document.getElementById("employerGrid");

let data;
let state = {
  sector: "all",
  branch: "all",
  search: "",
  route: "",
};

function commitState(partial) {
  state = { ...state, ...partial };
  replaceUrlParams({
    sector: state.sector === "all" ? "" : state.sector,
    branch: state.branch === "all" ? "" : state.branch,
    search: state.search,
    route: state.route,
  });
  render();
}

function currentRoute() {
  return state.route ? data.laneMap.get(state.route) : null;
}

function filteredEmployers() {
  return data.employers.filter((employer) => {
    const sectorMatch =
      state.sector === "all" || employer.sectors.includes(state.sector);
    const branchMatch =
      state.branch === "all" || employer.branches.includes(state.branch);
    const routeMatch = !state.route || employer.laneIds.includes(state.route);
    return sectorMatch && branchMatch && routeMatch && matchesEmployerSearch(employer, state.search);
  });
}

function visibleBranches() {
  const employers = data.employers.filter(
    (employer) =>
      (state.sector === "all" || employer.sectors.includes(state.sector)) &&
      (!state.route || employer.laneIds.includes(state.route)),
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

function employerSignals(employer) {
  const route = currentRoute();
  const routeMatch = route ? employer.laneIds.includes(route.id) : false;

  let priority = { label: "À scanner", tone: "blue" };
  if (routeMatch && ["major", "specialist"].includes(employer.category)) {
    priority = { label: "À viser d'abord", tone: "green" };
  } else if (routeMatch && employer.category === "interim") {
    priority = { label: "Scanner large", tone: "gold" };
  } else if (employer.category === "training") {
    priority = { label: "Support / formation", tone: "red" };
  } else if (employer.category === "major") {
    priority = { label: "Cible directe", tone: "green" };
  } else if (employer.category === "interim") {
    priority = { label: "Boîte à scanner", tone: "gold" };
  }

  let entryMode = "Candidature directe ou veille active";
  if (employer.category === "interim") {
    entryMode = "Passer par agence, mobilité et dispo rapide.";
  } else if (employer.category === "training") {
    entryMode = "Utile pour comprendre ou monter un ticket, pas pour signer un contrat terrain.";
  } else if ((employer.applyChannel || "").toLowerCase().includes("direct")) {
    entryMode = "Angle direct: site carrière, formulaire interne ou contact boîte.";
  }

  let tacticalAngle = "Présente un signal exploitable, une mobilité claire et la tâche visée.";
  if (routeMatch && route) {
    tacticalAngle = `Angle route: montre pourquoi ton profil colle à ${route.title.toLowerCase()} et au rythme de cette branche.`;
  } else if (employer.category === "interim") {
    tacticalAngle = "Vends disponibilité, mobilité et tickets déjà actifs. L'agence trie vite.";
  } else if (employer.category === "specialist") {
    tacticalAngle = "Vends la niche, la tâche précise et le contexte chantier. Les spécialistes recrutent rarement pour “tout faire”.";
  }

  return {
    routeMatch,
    priority,
    entryMode,
    tacticalAngle,
    statusPills: [
      pill(priority.label, priority.tone),
      pill(employer.category, "orange"),
      routeMatch ? pill("Route liée", "blue") : "",
    ]
      .filter(Boolean)
      .join(""),
  };
}

function renderGuidePanels(employers) {
  const route = currentRoute();
  const directCount = employers.filter((employer) =>
    ["major", "specialist"].includes(employer.category),
  ).length;
  const scannerCount = employers.filter(
    (employer) => employer.category === "interim",
  ).length;

  employerGuidePanel.innerHTML = `
    <span class="mini-label">Doctrine prospection</span>
    <h3>Une boîte n'a de valeur que si tu sais comment l'attaquer.</h3>
    <div class="list">
      <div class="list-item">
        <span class="list-index">1</span>
        <div>Commence par les cibles directes quand la route est claire; garde les agences pour élargir le terrain.</div>
      </div>
      <div class="list-item">
        <span class="list-index">2</span>
        <div>Le canal d'entrée change le discours: site carrière, agence, réseau chantier, sourcing manuel.</div>
      </div>
      <div class="list-item">
        <span class="list-index">3</span>
        <div>Une boîte de formation n'est pas une sortie emploi. Ne mélange pas support et recrutement.</div>
      </div>
    </div>
    <div class="pill-row">
      ${pill(`${employers.length} boîte(s) visibles`, "blue")}
      ${pill(`${directCount} cible(s) directes`, "green")}
      ${pill(`${scannerCount} boîte(s) à scanner`, "gold")}
    </div>
  `;

  employerContextPanel.innerHTML = route
    ? `
        <span class="mini-label">Contexte actif</span>
        <h3>${escapeHtml(route.title)}</h3>
        <p class="muted">${escapeHtml(route.shortDescription)}</p>
        <div class="warning-card">
          <strong>Branche:</strong> ${escapeHtml(route.branch)}
          <br />
          <strong>Tickets d'entrée:</strong> ${escapeHtml(String(route.ticketCount || route.ticketsRequired.length))}
        </div>
        <div class="button-row">
          <a class="button secondary" href="${laneHref(route.id)}">Voir la route</a>
          <button class="button secondary" type="button" data-clear-route>
            Enlever le contexte route
          </button>
        </div>
      `
    : `
        <span class="mini-label">Contexte actif</span>
        <h3>Prospection large</h3>
        <p class="muted">
          Sans route active, cette page sert à scanner un marché ou une branche.
          Passe par une route si tu veux savoir qui viser d'abord.
        </p>
      `;

  employerTacticsPanel.innerHTML = `
    <span class="mini-label">Tactiques</span>
    <h3>Où commencer selon ton niveau</h3>
    <div class="list">
      <div class="list-item">
        <span class="list-index">A</span>
        <div><strong>Débutant:</strong> cible les boîtes où l'entrée passe par pack porté, agence ou dispositif sponsorisé.</div>
      </div>
      <div class="list-item">
        <span class="list-index">B</span>
        <div><strong>Avec socle:</strong> vise d'abord spécialistes et majors qui recrutent la tâche précise que tu sais vendre.</div>
      </div>
      <div class="list-item">
        <span class="list-index">C</span>
        <div><strong>Si la boîte est floue:</strong> repars de la branche, de la route liée et du canal d'entrée avant d'envoyer un CV générique.</div>
      </div>
    </div>
  `;
}

function render() {
  renderFilters();
  const employers = filteredEmployers();
  renderGuidePanels(employers);
  employerResultsSummary.textContent = `${employers.length} employeur(s) après filtres${state.route ? " dans le contexte route actif" : ""}. Lis la priorité de ciblage avant d'envoyer une candidature large.`;

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
      const signals = employerSignals(employer);
      return `
        <article class="card employer-card">
          <div class="pill-row">
            ${signals.statusPills}
            ${employer.sectors
              .map((sectorId) => data.sectorMap.get(sectorId))
              .filter(Boolean)
              .map((sector) => pill(`${sector.icon} ${sector.name}`, "blue"))
              .join("")}
          </div>
          <h3>${escapeHtml(employer.name)}</h3>
          <p class="muted">${escapeHtml(employer.applyChannel)}</p>
          <div class="warning-card">
            <strong>Angle d'entrée:</strong>
            ${escapeHtml(signals.entryMode)}
            <br />
            ${escapeHtml(signals.tacticalAngle)}
          </div>
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
            ${
              lanes[0]
                ? `<a class="button secondary" href="${laneHref(lanes[0].id)}">Voir une route liée</a>`
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

employerContextPanel.addEventListener("click", (event) => {
  if (event.target.closest("[data-clear-route]")) {
    commitState({ route: "" });
  }
});

async function init() {
  data = await loadAllData();
  const params = new URLSearchParams(window.location.search);
  const requestedRoute = params.get("route") || "";
  state = {
    sector: params.get("sector") || "all",
    branch: params.get("branch") || "all",
    search: params.get("search") || "",
    route: data.laneMap.has(requestedRoute) ? requestedRoute : "",
  };
  render();
}

init();
