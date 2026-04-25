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
const ticketGuidePanel = document.getElementById("ticketGuidePanel");
const ticketSequencePanel = document.getElementById("ticketSequencePanel");
const ticketRiskPanel = document.getElementById("ticketRiskPanel");
const ticketResultsSummary = document.getElementById("ticketResultsSummary");
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

function linkedLanes(ticket) {
  return ticket.opensLaneIds
    .map((laneId) => data.laneMap.get(laneId))
    .filter(Boolean);
}

function ticketSignals(ticket) {
  const text = [
    ticket.summary,
    ticket.notes,
    ticket.accessMode,
    ticket.jobReadiness,
    ticket.prerequisite,
    ...(ticket.doesNotOpen || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const opensCount = linkedLanes(ticket).length;
  const employerFunded =
    /employeur|france travail|sponsor|pack|prise en charge/.test(text) ||
    /employeur/.test((ticket.costRange || "").toLowerCase());
  const quickOpen = /premier poste|premières missions|premier pied|ouvre vite|déclencher/.test(
    text,
  );
  const badSoloBuy = /rarement le meilleur premier achat|sans réseau|si l'employeur te suit|pas.*solo|rarement/.test(
    text,
  );

  let role = { label: "Brique de passage", tone: "blue" };
  if (opensCount <= 2 || quickOpen) {
    role = { label: "Premier verrou", tone: "orange" };
  } else if ((ticket.nextTicketIds || []).length > 0 && opensCount >= 3) {
    role = { label: "Socle long terme", tone: "green" };
  } else if ((ticket.nextTicketIds || []).length === 0 && opensCount === 1) {
    role = { label: "Spécialisation", tone: "gold" };
  }

  let order = "À replacer dans la séquence visée";
  if (role.label === "Premier verrou") {
    order = employerFunded
      ? "À viser tôt, souvent via employeur ou dispositif porté"
      : "À traiter tôt si la porte cible est confirmée";
  } else if (role.label === "Spécialisation") {
    order = "À prendre après le socle, pas comme premier achat";
  } else if (role.label === "Socle long terme") {
    order = "Peut servir de base réutilisable sur plusieurs portes";
  }

  const warning = badSoloBuy
    ? "Mauvaise dépense si tu l'achètes sans boîte, sans chantier ou sans porte cible validée."
    : employerFunded
      ? "Vérifie d'abord si l'employeur, l'agence ou France Travail peuvent porter le ticket."
      : "Vérifie toujours la porte exacte avant achat; un intitulé large cache souvent plusieurs tâches.";

  return {
    role,
    employerFunded,
    quickOpen,
    badSoloBuy,
    order,
    warning,
    statusPills: [
      pill(role.label, role.tone),
      employerFunded ? pill("Souvent payé par employeur", "blue") : "",
      quickOpen ? pill("Ouvre vite", "green") : "",
      badSoloBuy ? pill("Mauvaise dépense si mal acheté", "red") : "",
      role.label === "Spécialisation" ? pill("Après socle", "gold") : "",
    ]
      .filter(Boolean)
      .join(""),
  };
}

function renderGuidePanels(visibleTickets) {
  const activeTicket = data.ticketMap.get(state.ticketId);
  const signals = activeTicket ? ticketSignals(activeTicket) : null;

  ticketGuidePanel.innerHTML = `
    <span class="mini-label">Doctrine ticket</span>
    <h3>Un ticket n'a de valeur que dans une séquence.</h3>
    <div class="list">
      <div class="list-item">
        <span class="list-index">1</span>
        <div>Commence par le ticket qui enlève le premier blocage d'entrée, pas par le badge le plus sexy.</div>
      </div>
      <div class="list-item">
        <span class="list-index">2</span>
        <div>Quand un ticket est souvent payé par employeur, l'acheter seul trop tôt augmente le risque de dépense morte.</div>
      </div>
      <div class="list-item">
        <span class="list-index">3</span>
        <div>Ce qui compte ici: ordre, capacité réelle, délai avant job, et ce que le ticket n'ouvre pas.</div>
      </div>
    </div>
    <div class="pill-row">
      ${pill(`${visibleTickets.length} ticket(s) visibles`, "blue")}
      ${activeTicket ? signals.statusPills : pill("Ouvre un ticket pour voir son rôle", "gold")}
    </div>
  `;

  ticketSequencePanel.innerHTML = activeTicket
    ? `
        <span class="mini-label">Séquence recommandée</span>
        <h3>${escapeHtml(activeTicket.name)}</h3>
        <div class="warning-card"><strong>Ordre recommandé:</strong> ${escapeHtml(signals.order)}</div>
        <div class="detail-facts">
          ${detailFact("Avant premier job", activeTicket.jobReadiness)}
          ${detailFact("Mode d'accès", activeTicket.accessMode)}
          ${detailFact("Durée", activeTicket.duration)}
          ${detailFact("Coût / financement", activeTicket.costRange)}
        </div>
        <div>
          <span class="mini-label">Étapes suivantes</span>
          ${
            activeTicket.nextTicketIds?.length
              ? `<div class="inline-links">${ticketLinkChips(activeTicket.nextTicketIds)}</div>`
              : `<p class="muted">Pas d'étape suivante codée: cela peut être une brique terminale ou dépendre de la boîte.</p>`
          }
        </div>
      `
    : `
        <span class="mini-label">Séquence recommandée</span>
        <h3>Choisis un ticket pour lire l'ordre réel</h3>
        <p class="muted">
          La bonne question n'est pas “ce ticket est-il utile ?” mais “à quel
          moment dois-je le prendre, et qui doit le porter ?”.
        </p>
      `;

  ticketRiskPanel.innerHTML = activeTicket
    ? `
        <span class="mini-label">Frontières</span>
        <h3>Ce que tu dois contrôler avant de payer</h3>
        <div class="warning-card"><strong>Alerte:</strong> ${escapeHtml(signals.warning)}</div>
        <div class="list">
          ${listItems(
            activeTicket.doesNotOpen?.length
              ? activeTicket.doesNotOpen
              : ["Ce ticket reste à contrôler contre la tâche exacte et le niveau attendu par la boîte."],
          )}
        </div>
      `
    : `
        <span class="mini-label">Frontières</span>
        <h3>Les pièges à tuer</h3>
        <div class="list">
          <div class="list-item">
            <span class="list-index">A</span>
            <div>Confondre ticket d'entrée et ticket de spécialisation.</div>
          </div>
          <div class="list-item">
            <span class="list-index">B</span>
            <div>Payer un ticket souvent porté par employeur sans promesse de chantier.</div>
          </div>
          <div class="list-item">
            <span class="list-index">C</span>
            <div>Lire un libellé large comme un accès à toute la filière.</div>
          </div>
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

  const lanes = linkedLanes(ticket);
  const sources = (ticket.sourceIds || [])
    .map((sourceId) => data.sourceMap.get(sourceId))
    .filter(Boolean);
  const signals = ticketSignals(ticket);

  ticketDetailPanel.innerHTML = `
    <div class="ticket-detail-head">
      <div class="content-grid">
        <div class="pill-row">
          ${signals.statusPills}
          ${pill(ticket.type, "blue")}
          ${(ticket.sectorLinks || [])
            .map((sectorId) => data.sectorMap.get(sectorId))
            .filter(Boolean)
            .map((sector) => pill(`${sector.icon} ${sector.name}`, "orange"))
            .join("")}
        </div>
        <h3>${escapeHtml(ticket.name)}</h3>
        <p class="muted">${escapeHtml(ticket.summary || ticket.notes)}</p>
        <div class="warning-card">
          <strong>Ordre recommandé:</strong>
          ${escapeHtml(signals.order)}
        </div>
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
            ${lanes
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

  ticketResultsSummary.textContent = `${visibleTickets.length} ticket(s) après filtres. Cherche d'abord le premier verrou, puis seulement les spécialisations et tickets adjacents.`;
  renderGuidePanels(visibleTickets);
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
      const lanes = linkedLanes(ticket).slice(0, 4);
      const isActive = state.ticketId === ticket.id;
      const signals = ticketSignals(ticket);

      return `
        <article class="card ticket-card ${isActive ? "is-active" : ""}">
          <div class="pill-row">
            ${signals.statusPills}
            ${pill(ticket.type, "blue")}
            ${(ticket.sectorLinks || [])
              .map((sectorId) => data.sectorMap.get(sectorId))
              .filter(Boolean)
              .map((sector) => pill(`${sector.icon} ${sector.name}`, "orange"))
              .join("")}
          </div>
          <h3>${escapeHtml(ticket.name)}</h3>
          <p class="muted">${escapeHtml(ticket.summary || ticket.notes)}</p>
          <div class="warning-card">
            <strong>Ordre recommandé:</strong>
            ${escapeHtml(signals.order)}
          </div>
          <div class="list">
            <div><span class="mini-label">Durée</span><div>${escapeHtml(ticket.duration)}</div></div>
            <div><span class="mini-label">Coût indicatif</span><div>${escapeHtml(ticket.costRange)}</div></div>
            <div><span class="mini-label">Avant job</span><div>${escapeHtml(ticket.jobReadiness || ticket.prerequisite)}</div></div>
          </div>
          <div>
            <span class="mini-label">Portes ouvertes</span>
            <div class="inline-links">
              ${lanes
                .map(
                  (lane) =>
                    `<a class="link-chip" href="${laneHref(lane.id)}">${escapeHtml(
                      lane.title,
                    )}</a>`,
                )
                .join("")}
            </div>
          </div>
          ${
            signals.badSoloBuy
              ? `<div class="warning-card"><strong>Attention:</strong> ${escapeHtml(signals.warning)}</div>`
              : ""
          }
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
  const requestedTicket = params.get("id") || "";
  state = {
    sector: params.get("sector") || "all",
    search: params.get("search") || "",
    ticketId: data.ticketMap.has(requestedTicket) ? requestedTicket : "",
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
