import { escapeHtml } from "./ui.js";

export function currency(value, code = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
}

export function rangeLabel(range) {
  return `${currency(range.low, range.currency)} / ${currency(range.stable, range.currency)} / ${currency(range.upside, range.currency)}`;
}

export function statusTone(status) {
  return {
    green: "green",
    orange: "gold",
    red: "red",
    locked: "red",
    live: "green",
    beta: "blue",
  }[status] || "blue";
}

export function sourceBadge(source) {
  if (!source) {
    return "";
  }
  const tone = source.confidence === "high" ? "green" : source.confidence === "medium" ? "gold" : "red";
  return `<a class="source-badge is-${tone}" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">
    ${escapeHtml(source.type)} · ${escapeHtml(source.lastChecked)} · ${escapeHtml(source.confidence)}
  </a>`;
}

export function sourceBadges(sourceIds = [], sourceMap) {
  return sourceIds
    .map((sourceId) => sourceBadge(sourceMap.get(sourceId)))
    .filter(Boolean)
    .join("");
}

export function scoreGauge(score, label = "Score") {
  return `
    <div class="v2-score-gauge" style="--score:${Math.max(0, Math.min(100, score))}%">
      <div class="score-meta">
        <span class="mini-label">${escapeHtml(label)}</span>
        <strong>${Math.round(score)}/100</strong>
      </div>
      <div class="score-track"><div class="score-fill"></div></div>
    </div>
  `;
}

export function countryScoreCard(country, score, options = {}) {
  const href = `./country.html?country=${encodeURIComponent(country.slug || country.id)}`;
  const tone = statusTone(score.status);
  return `
    <article class="card v2-country-card">
      <div class="country-card-head">
        <div>
          <span class="mini-label">${escapeHtml(country.status)} · ${escapeHtml(score.visaLabel)}</span>
          <h3>${escapeHtml(country.name)}</h3>
        </div>
        <span class="pill is-${tone}">${score.status === "locked" ? "Locked" : `${score.totalScore}/100`}</span>
      </div>
      ${scoreGauge(score.totalScore, "Verdict")}
      <div class="cash-strip">
        <div>
          <span class="mini-label">Cash stable</span>
          <strong>${currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)}</strong>
          <small>${escapeHtml(score.realisticMonthlyRange.netOrGross)}</small>
        </div>
        <div>
          <span class="mini-label">Upside</span>
          <strong>${currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)}</strong>
          <small>mois plausible</small>
        </div>
        <div>
          <span class="mini-label">Premiere paie</span>
          <strong>${score.timeToFirstPay.lowWeeks}-${score.timeToFirstPay.highWeeks} sem.</strong>
          <small>estimation</small>
        </div>
      </div>
      <p class="muted">${escapeHtml(country.summary)}</p>
      <div class="warning-card">
        <strong>Next action:</strong> ${escapeHtml(score.nextAction)}
      </div>
      <div class="pill-row">
        ${score.mainBlockers.slice(0, 3).map((item) => `<span class="pill is-red">${escapeHtml(item)}</span>`).join("")}
      </div>
      <div class="button-row">
        <a class="button primary" href="${href}">Voir le plan pays</a>
        ${
          options.saveButton
            ? `<button class="button secondary" type="button" data-save-plan="${escapeHtml(country.id)}">Sauvegarder plan</button>`
            : ""
        }
      </div>
    </article>
  `;
}

export function profileSummary(profile) {
  return `
    <div class="v2-profile-summary">
      <span class="pill is-blue">${escapeHtml(profile.identity.passportCountry)} · ${profile.identity.ageExact} ans</span>
      <span class="pill is-gold">${escapeHtml(profile.skills.englishLevel)}</span>
      <span class="pill is-green">${currency(profile.money.availableCash, profile.money.currency)} capital</span>
      <span class="pill is-orange">${escapeHtml(profile.preferences.priority)}</span>
    </div>
  `;
}

export function emptyState(title, copy, cta = "") {
  return `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(copy)}</p>
      ${cta}
    </div>
  `;
}
