const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("fr-FR");

const sectorIcons = {
  ferro: "🚂",
  nuclear: "☢️",
  industrial: "⚙️",
  renewables: "🌬️",
  special: "🧗",
  critical: "🖥️",
  construction: "🏗️",
  energy: "⚡",
  maritime: "🚢",
  aero: "✈️",
  transport: "🚛",
  environment: "♻️",
  security: "🛡️",
  health: "🏥",
  agro: "🌾",
};

const agentMeta = {
  cash: { label: "CASH", tone: "green" },
  tickets: { label: "TICKETS", tone: "blue" },
  saturation: { label: "SATURATION", tone: "orange" },
  rebounds: { label: "REBONDS", tone: "gold" },
  stability: { label: "STABILITÉ", tone: "green" },
};

export function money(value) {
  return currencyFormatter.format(Math.round(Number(value) || 0));
}

export function integer(value) {
  return integerFormatter.format(Math.round(Number(value) || 0));
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function truncate(value = "", maxLength = 140) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

export function sectorIcon(sectorId) {
  return sectorIcons[sectorId] || "•";
}

export function laneHref(id) {
  return `./porte.html?id=${encodeURIComponent(id)}`;
}

export function pill(text, tone = "") {
  const toneClass = tone ? ` is-${tone}` : "";
  return `<span class="pill${toneClass}">${escapeHtml(text)}</span>`;
}

export function linkChip(label, href) {
  return `<a class="link-chip" href="${href}">${escapeHtml(label)}</a>`;
}

export function scenarioBoxHtml(label, scenario, tone = "", options = {}) {
  const className = tone ? `money-value is-${tone}` : "money-value";
  const primaryValue =
    options.primaryValue ??
    scenario.estimatedCashAvailable ??
    scenario.estimatedPocket;
  const subline =
    options.subline ??
    (scenario.estimatedExpenseCoverage !== undefined
      ? `fiche ${money(scenario.estimatedPayslipNet)} · indemnités ${money(
          scenario.estimatedExpenseCoverage,
        )}`
      : `fiche ${money(scenario.estimatedPayslipNet)}`);
  return `
    <div class="money-box">
      <span class="mini-label">${escapeHtml(label)}</span>
      <strong class="${className}">${money(primaryValue)}</strong>
      <div class="muted">${escapeHtml(subline)}</div>
    </div>
  `;
}

export function confidenceTone(level = "") {
  if (level.includes("haut") || level === "high") {
    return "green";
  }
  if (level.includes("moyen") || level === "medium") {
    return "gold";
  }
  return "red";
}

export function accessTone(score = 3) {
  if (score <= 2) {
    return "green";
  }
  if (score <= 4) {
    return "gold";
  }
  return "red";
}

export function stabilityTone(label = "") {
  if (label.includes("stable")) {
    return "green";
  }
  if (label.includes("moyen")) {
    return "gold";
  }
  return "red";
}

export function competitionTone(label = "") {
  if (label.includes("faible")) {
    return "green";
  }
  if (label.includes("moyen")) {
    return "gold";
  }
  return "red";
}

export function topAgentPills(agentScores) {
  return Object.entries(agentScores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key, value]) => {
      const meta = agentMeta[key];
      return pill(`Agent ${meta.label} ${Math.round(value)}`, meta.tone);
    })
    .join("");
}

export function renderAgentBreakdown(agentScores) {
  return `
    <div class="score-grid">
      ${Object.entries(agentScores)
        .map(([key, value]) => {
          const meta = agentMeta[key];
          return `
            <div class="score-row">
              <div class="score-meta">
                <strong>${meta.label}</strong>
                <span>${Math.round(value)}/100</span>
              </div>
              <div class="score-track">
                <div class="score-fill" style="width:${Math.min(100, Math.max(0, value))}%"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderEmptyState(container, title, copy) {
  container.innerHTML = `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(copy)}</p>
    </div>
  `;
}
