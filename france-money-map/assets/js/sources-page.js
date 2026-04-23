import { loadAllData } from "./data.js";
import { escapeHtml, pill } from "./ui.js";

const sourceGrid = document.getElementById("sourceGrid");

async function init() {
  const data = await loadAllData();
  sourceGrid.innerHTML = data.sources
    .map(
      (source) => `
        <article class="card source-card">
          <div class="pill-row">
            ${pill(source.kind, "blue")}
            ${pill(source.confidenceLevel, "gold")}
          </div>
          <h3>${escapeHtml(source.title)}</h3>
          <p class="muted">${escapeHtml(source.note)}</p>
          <div class="button-row">
            <a class="button secondary" href="${source.url}" target="_blank" rel="noopener">Ouvrir</a>
          </div>
        </article>
      `,
    )
    .join("");
}

init();
