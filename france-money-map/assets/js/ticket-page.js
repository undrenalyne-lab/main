import { loadAllData } from "./data.js";
import { matchesTicketSearch } from "./filters.js";
import { replaceUrlParams } from "./router.js";
import {
  escapeHtml,
  laneHref,
  pill,
  renderEmptyState,
} from "./ui.js";

const ticketSectorFilters = document.getElementById("ticketSectorFilters");
const ticketSearch = document.getElementById("ticketSearch");
const ticketDetailPanel = document.getElementById("ticketDetailPanel");
const ticketGrid = document.getElementById("ticketGrid");

let data;
let state = {
  sector: "all",
  search: "",
  ticketId: "",
};

function commitState(partial) {
  state = { ...state, ...partial };
  replaceUrlParams({
    sector: state.sector === "all" ? "" : state.sector,
    search: state.search,
    id: state.ticketId,
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

function ticketLinkChips(ticketIds) {
  return ticketIds
    .map((ticketId) => data.ticketMap.get(ticketId))
    .filter(Boolean)
    .map(
      (ticket) => `
        <button class="link-chip" type="button" data-ticket-id="${ticket.id}">
          ${escapeHtml(ticket.name)}
        </button>
      `,
    )
    .join("");
}

function listItems(items) {
  return items
    .map(
      (item, index) => `
        <div class="list-item">
          <span class="list-index">${index + 1}</span>
          <div>${escapeHtml(item)}</div>
        </div>
      `,
    )
    .join("");
}

function detailFact(label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="detail-fact">
      <span class="mini-label">${escapeHtml(label)}</span>
      <div>${escapeHtml(value)}</div>
    </div>
  `;
}

function renderTicketDetail() {
  const ticket = data.ticketMap.get(state.ticketId);

  if (!ticket) {
    ticketDetailPanel.innerHTML = `
      <h3>Choisir un ticket</h3>
      <p class="muted">
        Clique une carte pour voir la séquence réelle, les prérequis, le délai
        avant premier job et ce que le ticket n'ouvre pas.
      </p>
    `;
    return;
  }

  const linkedLanes = ticket.opensLaneIds
    .map((laneId) => data.laneMap.get(laneId))
    .filter(Boolean);
  const sources = (ticket.sourceIds || [])
    .map((sourceId) => data.sourceMap.get(sourceId))
    .filter(Boolean);

  ticketDetailPanel.innerHTML = `
    <div class="ticket-detail-head">
      <div class="content-grid">
        <div class="pill-row">
          ${pill(ticket.type, "blue")}
          ${(ticket.sectorLinks || [])
            .map((sectorId) => data.sectorMap.get(sectorId))
            .filter(Boolean)
            .map((sector) => pill(`${sector.icon} ${sector.name}`, "orange"))
            .join("")}
        </div>
        <h3>${escapeHtml(ticket.name)}</h3>
        <p class="muted">${escapeHtml(ticket.summary || ticket.notes)}</p>
      </div>
      <div class="detail-facts">
        ${detailFact("Durée formation", ticket.duration)}
        ${detailFact("Avant premier job", ticket.jobReadiness)}
        ${detailFact("Mode d'accès", ticket.accessMode)}
        ${detailFact("Coût / financement", ticket.costRange)}
        ${detailFact("Validité / recyclage", ticket.validity)}
      </div>
    </div>
    <div class="detail-layout compact">
      <div class="detail-column">
        <article class="card ticket-detail-card">
          <span class="mini-label">Pré-requis concrets</span>
          <div class="list">
            ${listItems(ticket.accessChecks?.length ? ticket.accessChecks : [ticket.prerequisite])}
          </div>
        </article>
        <article class="card ticket-detail-card">
          <span class="mini-label">Capacités à avoir</span>
          <div class="list">
            ${listItems(
              ticket.capacityChecks?.length
                ? ticket.capacityChecks
                : ["Pré-requis à confirmer avec l'organisme et l'employeur."],
            )}
          </div>
        </article>
        <article class="card ticket-detail-card">
          <span class="mini-label">Modules / contenu utile</span>
          <div class="list">
            ${listItems(
              ticket.modules?.length
                ? ticket.modules
                : ["Le détail dépend du centre et du référentiel appliqué."],
            )}
          </div>
        </article>
      </div>
      <div class="detail-column">
        <article class="card ticket-detail-card">
          <span class="mini-label">Ce que ce ticket ouvre</span>
          <div class="inline-links">
            ${linkedLanes
              .map(
                (lane) =>
                  `<a class="link-chip" href="${laneHref(lane.id)}">${escapeHtml(
                    lane.title,
                  )}</a>`,
              )
              .join("")}
          </div>
          ${
            ticket.targetRoles?.length
              ? `
                <span class="mini-label">Rôles visés</span>
                <div class="pill-row">
                  ${ticket.targetRoles.map((role) => pill(role, "green")).join("")}
                </div>
              `
              : ""
          }
        </article>
        <article class="card ticket-detail-card">
          <span class="mini-label">Ce que ça n'ouvre pas</span>
          <div class="list">
            ${listItems(
              ticket.doesNotOpen?.length
                ? ticket.doesNotOpen
                : ["Vérifie toujours la tâche exacte visée ; un libellé large cache souvent plusieurs niveaux."],
            )}
          </div>
        </article>
        <article class="card ticket-detail-card">
          <span class="mini-label">Étape suivante</span>
          ${
            ticket.nextTicketIds?.length
              ? `<div class="inline-links">${ticketLinkChips(ticket.nextTicketIds)}</div>`
              : `<p class="muted">Pas d'étape suivante codée sur cette V1.</p>`
          }
        </article>
        <article class="card ticket-detail-card">
          <span class="mini-label">Sources</span>
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
              : `<p class="muted">Pas de source rattachée sur cette fiche pour l'instant.</p>`
          }
        </article>
      </div>
    </div>
  `;
}

function render() {
  renderSectorFilters();
  ticketSearch.value = state.search;

  const visibleTickets = data.tickets.filter((ticket) => {
    const sectorMatch =
      state.sector === "all" || ticket.sectorLinks.includes(state.sector);
    return sectorMatch && matchesTicketSearch(ticket, state.search);
  });

  renderTicketDetail();

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
      const isActive = state.ticketId === ticket.id;

      return `
        <article class="card ticket-card ${isActive ? "is-active" : ""}">
          <div class="pill-row">
            ${pill(ticket.type, "blue")}
            ${(ticket.sectorLinks || [])
              .map((sectorId) => data.sectorMap.get(sectorId))
              .filter(Boolean)
              .map((sector) => pill(`${sector.icon} ${sector.name}`, "orange"))
              .join("")}
          </div>
          <h3>${escapeHtml(ticket.name)}</h3>
          <p class="muted">${escapeHtml(ticket.summary || ticket.notes)}</p>
          <div class="list">
            <div><span class="mini-label">Durée</span><div>${escapeHtml(ticket.duration)}</div></div>
            <div><span class="mini-label">Coût indicatif</span><div>${escapeHtml(ticket.costRange)}</div></div>
            <div><span class="mini-label">Avant job</span><div>${escapeHtml(ticket.jobReadiness || ticket.prerequisite)}</div></div>
          </div>
          <div>
            <span class="mini-label">Portes ouvertes</span>
            <div class="inline-links">
              ${linkedLanes
                .map(
                  (lane) =>
                    `<a class="link-chip" href="${laneHref(lane.id)}">${escapeHtml(
                      lane.title,
                    )}</a>`,
                )
                .join("")}
            </div>
          </div>
          <div class="button-row">
            <button class="button secondary" type="button" data-ticket-id="${ticket.id}">
              ${isActive ? "Ticket affiché" : "Ouvrir le ticket"}
            </button>
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

ticketGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ticket-id]");
  if (!button) {
    return;
  }
  commitState({ ticketId: button.dataset.ticketId });
});

ticketDetailPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ticket-id]");
  if (!button) {
    return;
  }
  commitState({ ticketId: button.dataset.ticketId });
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
    ticketId: params.get("id") || "",
  };

  if (!state.ticketId && state.search) {
    const directMatch = data.tickets.find((ticket) =>
      matchesTicketSearch(ticket, state.search),
    );
    if (directMatch) {
      state.ticketId = directMatch.id;
    }
  }

  render();
}

init();
