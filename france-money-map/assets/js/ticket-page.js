import { loadAllData } from "./data.js";
import { matchesTicketSearch } from "./filters.js";
import { replaceUrlParams } from "./router.js";
import {
  escapeHtml,
  laneHref,
  pill,
  renderEmptyState,
  sectorIcon,
} from "./ui.js";

const ticketSectorFilters = document.getElementById("ticketSectorFilters");
const ticketSearch = document.getElementById("ticketSearch");
const ticketGrid = document.getElementById("ticketGrid");

let data;
let state = {
  sector: "all",
  search: "",
};

function commitState(partial) {
  state = { ...state, ...partial };
  replaceUrlParams({
    sector: state.sector === "all" ? "" : state.sector,
    search: state.search,
  });
  render();
}

function renderSectorFilters() {
  ticketSectorFilters.innerHTML = [
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
}

function render() {
  renderSectorFilters();
  ticketSearch.value = state.search;

  const visibleTickets = data.tickets.filter((ticket) => {
    const sectorMatch =
      state.sector === "all" || ticket.sectorLinks.includes(state.sector);
    return sectorMatch && matchesTicketSearch(ticket, state.search);
  });

  if (visibleTickets.length === 0) {
    renderEmptyState(
      ticketGrid,
      "Aucun ticket ne remonte",
      "Elargis ton filtre ou change de secteur.",
    );
    return;
  }

  ticketGrid.innerHTML = visibleTickets
    .map((ticket) => {
      const linkedLanes = ticket.opensLaneIds
        .map((laneId) => data.laneMap.get(laneId))
        .filter(Boolean)
        .slice(0, 4);
      return `
        <article class="card ticket-card">
          <div class="pill-row">
            ${pill(ticket.type, "blue")}
            ${ticket.sectorLinks
              .map((sectorId) => data.sectorMap.get(sectorId))
              .filter(Boolean)
              .map((sector) => pill(`${sector.icon} ${sector.name}`, "orange"))
              .join("")}
          </div>
          <h3>${escapeHtml(ticket.name)}</h3>
          <p class="muted">${escapeHtml(ticket.notes)}</p>
          <div class="list">
            <div><span class="mini-label">Durée</span><div>${escapeHtml(ticket.duration)}</div></div>
            <div><span class="mini-label">Coût indicatif</span><div>${escapeHtml(ticket.costRange)}</div></div>
            <div><span class="mini-label">Pré requis</span><div>${escapeHtml(ticket.prerequisite)}</div></div>
          </div>
          <div>
            <span class="mini-label">Organismes types</span>
            <div class="pill-row">
              ${ticket.providerExamples.map((provider) => pill(provider, "gold")).join("")}
            </div>
          </div>
          <div>
            <span class="mini-label">Portes ouvertes</span>
            <div class="inline-links">
              ${linkedLanes.map((lane) => `<a class="link-chip" href="${laneHref(lane.id)}">${escapeHtml(lane.title)}</a>`).join("")}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

ticketSectorFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sector]");
  if (!button) {
    return;
  }
  commitState({ sector: button.dataset.sector });
});

ticketSearch.addEventListener("input", (event) => {
  commitState({ search: event.target.value });
});

async function init() {
  data = await loadAllData();
  const params = new URLSearchParams(window.location.search);
  state = {
    sector: params.get("sector") || "all",
    search: params.get("search") || "",
  };
  render();
}

init();
