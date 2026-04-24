import { loadAllData } from "./data.js";
import { confidenceTone, escapeHtml, pill } from "./ui.js";

const researchPanelsGrid = document.getElementById("researchPanelsGrid");
const glossaryGrid = document.getElementById("glossaryGrid");
const sourceGrid = document.getElementById("sourceGrid");

function renderResearchPanels(panels) {
  researchPanelsGrid.innerHTML = panels
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

async function init() {
  const data = await loadAllData();
  renderResearchPanels(data.researchPanels);
  renderGlossary(data.glossary);
  renderSources(data.sources);
}

init();
