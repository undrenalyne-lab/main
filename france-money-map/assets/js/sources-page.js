import { loadAllData, loadSourceExtras } from "./data.js";
import { confidenceTone, escapeHtml, pill } from "./ui.js";

const intelGuidePanel = document.getElementById("intelGuidePanel");
const intelConfidencePanel = document.getElementById("intelConfidencePanel");
const intelPitfallPanel = document.getElementById("intelPitfallPanel");
const researchPanelsGrid = document.getElementById("researchPanelsGrid");
const australiaPanelsGrid = document.getElementById("australiaPanelsGrid");
const australiaPlaybooksGrid = document.getElementById("australiaPlaybooksGrid");
const glossaryGrid = document.getElementById("glossaryGrid");
const sourceFrancePanel = document.getElementById("sourceFrancePanel");
const sourceAustraliaPanel = document.getElementById("sourceAustraliaPanel");
const sourceProductPanel = document.getElementById("sourceProductPanel");
const sourceGrid = document.getElementById("sourceGrid");

function sourceGroup(source) {
  if (source.id?.startsWith("au-")) {
    return { label: "Australia beta", tone: "blue" };
  }
  if (!source.url) {
    return { label: "Produit / doctrine", tone: "gold" };
  }
  return { label: "France live", tone: "green" };
}

function renderPanelGrid(container, panels) {
  if (!container) {
    return;
  }

  container.innerHTML = panels
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

function renderAustraliaPlaybooks(playbooks) {
  if (!australiaPlaybooksGrid) {
    return;
  }

  australiaPlaybooksGrid.innerHTML = playbooks
    .map(
      (playbook) => `
        <article class="card source-card">
          <div class="pill-row">
            ${pill(playbook.track, playbook.tone || "blue")}
            ${pill(playbook.title, "gold")}
          </div>
          <p class="muted">${escapeHtml(playbook.summary)}</p>
          <div class="list">
            <div>
              <span class="mini-label">Temps avant d'être vendable</span>
              <div>${escapeHtml(playbook.timeToReady)}</div>
            </div>
            <div>
              <span class="mini-label">Portes d'entrée réelles</span>
              <div>${playbook.gates.map((gate) => `<div>${escapeHtml(gate)}</div>`).join("")}</div>
            </div>
            <div>
              <span class="mini-label">D'où vient le cash</span>
              <div>${escapeHtml(playbook.cashStack)}</div>
            </div>
            <div>
              <span class="mini-label">Étapes suivantes</span>
              <div>${playbook.nextMoves.map((move) => `<div>${escapeHtml(move)}</div>`).join("")}</div>
            </div>
            <div>
              <span class="mini-label">Pièges</span>
              <div>${playbook.redFlags.map((flag) => `<div>${escapeHtml(flag)}</div>`).join("")}</div>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderGlossary(glossary) {
  glossaryGrid.innerHTML = glossary
    .map(
      (entry) => `
        <article class="card source-card">
          <div class="pill-row">
            ${pill(entry.domain, "blue")}
            ${pill(entry.term, "gold")}
          </div>
          <p class="muted">${escapeHtml(entry.definition)}</p>
          <div class="list">
            <div><span class="mini-label">Portée</span><div>${escapeHtml(entry.scope)}</div></div>
            <div><span class="mini-label">Ce que ce n'est pas</span><div>${escapeHtml(entry.doesNotMean)}</div></div>
            <div><span class="mini-label">Étape suivante</span><div>${escapeHtml(entry.next)}</div></div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderSources(sources) {
  sourceGrid.innerHTML = sources
    .map(
      (source) => `
        <article class="card source-card">
          <div class="pill-row">
            ${pill(sourceGroup(source).label, sourceGroup(source).tone)}
            ${pill(source.kind, "blue")}
            ${pill(source.confidenceLevel, confidenceTone(source.confidenceLevel))}
          </div>
          <h3>${escapeHtml(source.title)}</h3>
          <p class="muted">${escapeHtml(source.note)}</p>
          ${
            source.url
              ? `
                <div class="button-row">
                  <a class="button secondary" href="${source.url}" target="_blank" rel="noopener">Ouvrir</a>
                </div>
              `
              : `<div class="muted">Synthèse intégrée directement dans cette version du site.</div>`
          }
        </article>
      `,
    )
    .join("");
}

function renderIntelPanels(data) {
  const laneConfidence = data.lanes.reduce(
    (totals, lane) => {
      const level = lane.confidenceLevel || "";
      if (level.includes("haut")) {
        totals.high += 1;
      } else if (level.includes("moyen")) {
        totals.medium += 1;
      } else {
        totals.low += 1;
      }
      return totals;
    },
    { high: 0, medium: 0, low: 0 },
  );
  const franceSources = data.sources.filter((source) => !source.id.startsWith("au-"));
  const australiaSources = data.sources.filter((source) => source.id.startsWith("au-"));
  const productSources = data.sources.filter((source) => !source.url);

  intelGuidePanel.innerHTML = `
    <span class="mini-label">Rôle d'Intel</span>
    <h3>Distribuer la preuve dans tout le produit.</h3>
    <div class="list">
      <div class="list-item">
        <span class="list-index">1</span>
        <div>Route: pourquoi ça sort, quel cash est lu, où sont les limites.</div>
      </div>
      <div class="list-item">
        <span class="list-index">2</span>
        <div>Ticket: ce que ça ouvre vraiment, ce que ça n'ouvre pas, et qui devrait le financer.</div>
      </div>
      <div class="list-item">
        <span class="list-index">3</span>
        <div>Employeur: quelle preuve soutient la cible, le canal et le discours de candidature.</div>
      </div>
    </div>
  `;

  intelConfidencePanel.innerHTML = `
    <span class="mini-label">Confiance actuelle</span>
    <h3>Le moteur annonce son niveau d'appui.</h3>
    <div class="pill-row">
      ${pill(`${laneConfidence.high} voies hautes`, "green")}
      ${pill(`${laneConfidence.medium} voies moyennes`, "gold")}
      ${pill(`${laneConfidence.low} voies basses`, "red")}
    </div>
    <p class="muted">
      Une voie peu sourcée peut rester utile comme piste, mais elle ne doit pas
      être lue comme une promesse proprement vérifiée.
    </p>
  `;

  intelPitfallPanel.innerHTML = `
    <span class="mini-label">Pièges à tuer</span>
    <h3>Les trois erreurs de lecture qui coûtent cher.</h3>
    <div class="list">
      <div class="list-item">
        <span class="list-index">A</span>
        <div>Confondre net salarial et indemnités de terrain.</div>
      </div>
      <div class="list-item">
        <span class="list-index">B</span>
        <div>Acheter un ticket sans vérifier la porte, le niveau et le financeur probable.</div>
      </div>
      <div class="list-item">
        <span class="list-index">C</span>
        <div>Prendre un mois max comme promesse de revenu stable.</div>
      </div>
    </div>
  `;

  sourceFrancePanel.innerHTML = `
    <span class="mini-label">France live</span>
    <h3>${franceSources.length} source(s) pour soutenir les routes opérationnelles.</h3>
    <p class="muted">
      On y range les offres, fiches métier, référentiels et documents qui
      soutiennent les portes, tickets et employeurs utilisés en France.
    </p>
  `;

  sourceAustraliaPanel.innerHTML = `
    <span class="mini-label">Australia beta</span>
    <h3>${australiaSources.length} source(s) pour les work rights et licences.</h3>
    <p class="muted">
      La couche Australie sert à vérifier des filtres durs: droit au travail,
      sécurité site, licences HRW, exigences charbon et logique remote.
    </p>
  `;

  sourceProductPanel.innerHTML = `
    <span class="mini-label">Produit / doctrine</span>
    <h3>${productSources.length} source(s) intégrées directement au moteur.</h3>
    <p class="muted">
      Ces entrées synthétisent des hypothèses ou des panneaux de recherche quand
      la preuve a déjà été distribuée dans le produit.
    </p>
  `;
}

async function init() {
  const [data, extras] = await Promise.all([loadAllData(), loadSourceExtras()]);
  renderIntelPanels(data);
  renderPanelGrid(researchPanelsGrid, data.researchPanels);
  renderPanelGrid(australiaPanelsGrid, extras.australiaPanels);
  renderAustraliaPlaybooks(extras.australiaPlaybooks);
  renderGlossary(data.glossary);
  renderSources(data.sources);
}

init();
