import { loadMobilityProduct } from "./data.js";
import { escapeHtml } from "./ui.js";
import {
  applyDemoProfile,
  clearLocalProductData,
  deletePlan,
  exportLocalData,
  loadPlans,
  loadProfile,
  normalizeProfile,
  optionLabels,
  saveProfile,
  upsertPlan,
} from "./v2-profile.js";
import { scoreCountries, scoreCountry } from "./v2-scoring.js";
import { generateActionPlan, saveGeneratedPlan, toggleTask } from "./v2-plans.js";
import {
  countryScoreCard,
  currency,
  emptyState,
  profileSummary,
  scoreGauge,
  sourceBadges,
} from "./v2-ui.js";

let mobilityData;
let v2WorldSvgMarkup;

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 620;
const COUNTRY_PIN_NUDGES = {
  france: { x: -2.8, y: 7.2 },
  germany: { x: 5.2, y: -1.5 },
  switzerland: { x: 6.4, y: 6.4 },
  uae: { x: 3.2, y: 1.8 },
  canada: { x: -1.2, y: 1.4 },
  australia: { x: -18, y: -2.4 },
};

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function el(id) {
  return document.getElementById(id);
}

function profileScores() {
  const profile = loadProfile();
  const scores = scoreCountries(profile, mobilityData.countries, mobilityData.rules);
  return { profile, scores };
}

function projectLonLat(lon, lat) {
  return {
    x: ((Number(lon) + 180) / 360) * WORLD_WIDTH,
    y: ((90 - Number(lat)) / 180) * WORLD_HEIGHT,
  };
}

function ringPath(points = []) {
  return points
    .map((point, index) => {
      const [lon, lat] = point;
      const projected = projectLonLat(lon, lat);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    })
    .join(" ");
}

function geometryPath(geometry) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => `${ringPath(ring)} Z`).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .flatMap((polygon) => polygon.map((ring) => `${ringPath(ring)} Z`))
      .join(" ");
  }
  return "";
}

function countryPinPosition(country) {
  if (!country.geo) return { x: 50, y: 50 };
  const projected = projectLonLat(country.geo.lon, country.geo.lat);
  const nudge = COUNTRY_PIN_NUDGES[country.id] || { x: 0, y: 0 };
  return {
    x: Math.max(6, Math.min(94, (projected.x / WORLD_WIDTH) * 100 + nudge.x)),
    y: Math.max(8, Math.min(92, (projected.y / WORLD_HEIGHT) * 100 + nudge.y)),
  };
}

function worldMapSvg(scoreMap) {
  if (v2WorldSvgMarkup) return v2WorldSvgMarkup;
  const countryByIso = new Map(mobilityData.countries.map((country) => [country.iso3, country]));
  const paths = mobilityData.worldCountries
    .map((feature) => {
      const country = countryByIso.get(feature.properties?.iso3);
      const score = country ? scoreMap.get(country.id) : null;
      const classes = [
        "v2-world-country",
        country ? "is-documented" : "",
        country ? `is-${country.status}` : "",
        score ? `score-${score.status}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<path class="${classes}" d="${geometryPath(feature.geometry)}" />`;
    })
    .join("");
  v2WorldSvgMarkup = `
    <svg class="v2-world-svg" viewBox="0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}" aria-hidden="true" focusable="false">
      <g class="v2-world-grid">
        <path d="M0 ${WORLD_HEIGHT * 0.25}H${WORLD_WIDTH}M0 ${WORLD_HEIGHT * 0.5}H${WORLD_WIDTH}M0 ${WORLD_HEIGHT * 0.75}H${WORLD_WIDTH}" />
        <path d="M${WORLD_WIDTH * 0.25} 0V${WORLD_HEIGHT}M${WORLD_WIDTH * 0.5} 0V${WORLD_HEIGHT}M${WORLD_WIDTH * 0.75} 0V${WORLD_HEIGHT}" />
      </g>
      <g class="v2-world-countries">${paths}</g>
    </svg>
  `;
  return v2WorldSvgMarkup;
}

function countryByParam() {
  const slug = qs("country") || "france";
  return mobilityData.countrySlugMap.get(slug) || mobilityData.countryMap.get(slug) || mobilityData.countries[0];
}

function renderV2HeroStats() {
  const node = el("v2HeroStats");
  if (!node) return;
  const { profile, scores } = profileScores();
  const top = scores[0];
  node.innerHTML = `
    <article class="metric-card">
      <span class="metric-label">Profil</span>
      <strong class="metric-value">${profile.identity.ageExact}</strong>
      <span class="muted">${escapeHtml(profile.identity.passportCountry)} passport</span>
    </article>
    <article class="metric-card">
      <span class="metric-label">Top pays</span>
      <strong class="metric-value">${escapeHtml(top?.name || "--")}</strong>
      <span class="muted">${top?.totalScore || "--"}/100</span>
    </article>
    <article class="metric-card">
      <span class="metric-label">Plans</span>
      <strong class="metric-value">${loadPlans().length}</strong>
      <span class="muted">local device</span>
    </article>
  `;
}

function updateProfileFromForm(form) {
  const formData = new FormData(form);
  const profile = normalizeProfile({
    ...loadProfile(),
    identity: {
      ...loadProfile().identity,
      firstName: formData.get("firstName"),
      ageExact: formData.get("ageExact"),
      passportCountry: formData.get("passportCountry"),
      nationality: formData.get("passportCountry"),
      currentCountry: formData.get("currentCountry"),
    },
    mobility: {
      ...loadProfile().mobility,
      willingToRelocate: formData.get("willingToRelocate") === "yes",
      acceptsRemoteSites: formData.get("acceptsRemoteSites") === "yes",
      acceptsFIFO: formData.get("acceptsFIFO") === "yes",
      acceptsNightShift: formData.get("acceptsNightShift") === "yes",
      acceptsPhysicalWork: formData.get("acceptsPhysicalWork"),
      preferredRegions: formData.getAll("preferredRegions"),
    },
    skills: {
      ...loadProfile().skills,
      englishLevel: formData.get("englishLevel"),
      experienceTags: formData.getAll("experienceTags"),
      yearsExperience: formData.get("yearsExperience"),
    },
    money: {
      ...loadProfile().money,
      availableCash: formData.get("availableCash"),
      monthlyBurn: formData.get("monthlyBurn"),
      targetMonthlyNet: formData.get("targetMonthlyNet"),
      minimumAcceptableNet: formData.get("minimumAcceptableNet"),
      currency: formData.get("currency"),
    },
    preferences: {
      ...loadProfile().preferences,
      timeHorizon: formData.get("timeHorizon"),
      riskTolerance: formData.get("riskTolerance"),
      priority: formData.get("priority"),
    },
  });
  return saveProfile(profile);
}

function renderOnboarding() {
  const form = el("profileWizard");
  const preview = el("profilePreview");
  if (!form || !preview) return;
  const profile = loadProfile();
  const checked = (items, value) => items.includes(value) ? "checked" : "";
  form.innerHTML = `
    <div class="wizard-grid">
      <section class="wizard-step">
        <span class="mini-label">1 · Identite utile</span>
        <label>Prénom <input class="input" name="firstName" value="${escapeHtml(profile.identity.firstName || "")}" placeholder="Kevin" /></label>
        <label>Age exact <input class="input" name="ageExact" type="number" min="16" max="75" value="${profile.identity.ageExact}" /></label>
        <label>Passeport <select class="input" name="passportCountry"><option value="FR" selected>France</option></select></label>
        <label>Pays actuel <select class="input" name="currentCountry"><option value="FR" selected>France</option></select></label>
      </section>
      <section class="wizard-step">
        <span class="mini-label">2 · Mobilite</span>
        <label>Relocation <select class="input" name="willingToRelocate"><option value="yes" ${profile.mobility.willingToRelocate ? "selected" : ""}>Oui</option><option value="no" ${!profile.mobility.willingToRelocate ? "selected" : ""}>Non</option></select></label>
        <label>Remote sites <select class="input" name="acceptsRemoteSites"><option value="yes" ${profile.mobility.acceptsRemoteSites ? "selected" : ""}>Oui</option><option value="no" ${!profile.mobility.acceptsRemoteSites ? "selected" : ""}>Non</option></select></label>
        <label>FIFO / roster <select class="input" name="acceptsFIFO"><option value="yes" ${profile.mobility.acceptsFIFO ? "selected" : ""}>Oui</option><option value="no" ${!profile.mobility.acceptsFIFO ? "selected" : ""}>Non</option></select></label>
        <label>Nuits <select class="input" name="acceptsNightShift"><option value="yes" ${profile.mobility.acceptsNightShift ? "selected" : ""}>Oui</option><option value="no" ${!profile.mobility.acceptsNightShift ? "selected" : ""}>Non</option></select></label>
        <label>Physique <select class="input" name="acceptsPhysicalWork">${Object.entries(optionLabels.physicalWork).map(([value, label]) => `<option value="${value}" ${profile.mobility.acceptsPhysicalWork === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      </section>
      <section class="wizard-step">
        <span class="mini-label">3 · Signaux vendables</span>
        <label>Anglais <select class="input" name="englishLevel">${Object.entries(optionLabels.englishLevel).map(([value, label]) => `<option value="${value}" ${profile.skills.englishLevel === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Annees experience <input class="input" name="yearsExperience" type="number" min="0" max="45" value="${profile.skills.yearsExperience || 0}" /></label>
        <div class="checkbox-cloud">
          ${["terrain", "elec", "meca", "rail", "nuclear", "hauteur", "logistique", "automation", "industrie", "cvc", "gestion"].map((tag) => `<label><input type="checkbox" name="experienceTags" value="${tag}" ${checked(profile.skills.experienceTags, tag)} /> ${tag}</label>`).join("")}
        </div>
      </section>
      <section class="wizard-step">
        <span class="mini-label">4 · Cash</span>
        <label>Capital disponible <input class="input" name="availableCash" type="number" min="0" value="${profile.money.availableCash}" /></label>
        <label>Burn mensuel <input class="input" name="monthlyBurn" type="number" min="0" value="${profile.money.monthlyBurn}" /></label>
        <label>Objectif mensuel <input class="input" name="targetMonthlyNet" type="number" min="0" value="${profile.money.targetMonthlyNet}" /></label>
        <label>Minimum acceptable <input class="input" name="minimumAcceptableNet" type="number" min="0" value="${profile.money.minimumAcceptableNet}" /></label>
        <label>Devise <select class="input" name="currency"><option value="EUR" ${profile.money.currency === "EUR" ? "selected" : ""}>EUR</option><option value="AUD" ${profile.money.currency === "AUD" ? "selected" : ""}>AUD</option></select></label>
      </section>
      <section class="wizard-step">
        <span class="mini-label">5 · Priorite</span>
        <label>Priorite <select class="input" name="priority">${Object.entries(optionLabels.priority).map(([value, label]) => `<option value="${value}" ${profile.preferences.priority === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Horizon <select class="input" name="timeHorizon">${["30d", "90d", "180d", "12m"].map((value) => `<option value="${value}" ${profile.preferences.timeHorizon === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <label>Risque <select class="input" name="riskTolerance">${Object.entries(optionLabels.riskTolerance).map(([value, label]) => `<option value="${value}" ${profile.preferences.riskTolerance === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <div class="checkbox-cloud">
          ${["europe", "oceania", "north-america", "middle-east"].map((tag) => `<label><input type="checkbox" name="preferredRegions" value="${tag}" ${checked(profile.mobility.preferredRegions, tag)} /> ${tag}</label>`).join("")}
        </div>
      </section>
    </div>
    <div class="button-row">
      <button class="button primary" type="submit">Calculer mon Top 3</button>
      <button class="button secondary" type="button" data-demo="kevin32">Demo Kevin 32</button>
      <button class="button secondary" type="button" data-demo="kevin37">Demo Kevin 37</button>
    </div>
  `;
  renderOnboardingPreview(preview);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateProfileFromForm(form);
    window.location.href = "./dashboard.html";
  });
  form.addEventListener("click", (event) => {
    const button = event.target.closest("[data-demo]");
    if (!button) return;
    applyDemoProfile(button.dataset.demo);
    window.location.reload();
  });
}

function renderOnboardingPreview(preview) {
  const { profile, scores } = profileScores();
  preview.innerHTML = `
    <span class="mini-label">Preview live</span>
    <h2>Top 3 actuel</h2>
    ${profileSummary(profile)}
    <div class="v2-mini-stack">
      ${scores.slice(0, 3).map((score, index) => `
        <a class="v2-mini-row" href="./country.html?country=${encodeURIComponent(score.slug)}">
          <span>${index + 1}</span>
          <strong>${escapeHtml(score.name)}</strong>
          <em>${score.totalScore}/100</em>
        </a>
      `).join("")}
    </div>
    <p class="muted">Le score change selon age exact, passeport, anglais, capital, mobilite et priorite.</p>
  `;
}

function renderDashboard() {
  const container = el("dashboardContent");
  if (!container) return;
  const { profile, scores } = profileScores();
  const top = scores.slice(0, 3);
  container.innerHTML = `
    <section class="panel v2-command-panel">
      <div>
        <span class="mini-label">Profil actif</span>
        <h2>${escapeHtml(profile.identity.firstName || "Profil")} · ${profile.identity.ageExact} ans · ${escapeHtml(profile.identity.passportCountry)}</h2>
        ${profileSummary(profile)}
      </div>
      <div class="button-row">
        <a class="button primary" href="./onboarding.html">Modifier le profil</a>
        <a class="button secondary" href="./compare.html">Comparer tous les pays</a>
        <a class="button secondary" href="./plans.html">Plans sauvegardes</a>
      </div>
    </section>
    <section class="section">
      <div class="section-head"><div><h2 class="section-title">Ton Top 3 pays</h2><p class="section-copy">Verdict personnalise. Pas un classement general.</p></div></div>
      <div class="card-grid card-grid-3">${top.map((score) => countryScoreCard(mobilityData.countryMap.get(score.countryId), score, { saveButton: true })).join("")}</div>
    </section>
    <section class="panel">
      <span class="mini-label">Pourquoi le score sort</span>
      <div class="decision-grid">${top.map((score) => `
        <article class="note-card">
          <h3>${escapeHtml(score.name)}</h3>
          <div class="list">${score.whyRecommended.map((item, index) => `<div class="list-item"><span class="list-index">${index + 1}</span><div>${escapeHtml(item)}</div></div>`).join("")}</div>
        </article>
      `).join("")}</div>
    </section>
  `;
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-plan]");
    if (!button) return;
    const country = mobilityData.countryMap.get(button.dataset.savePlan);
    const score = scores.find((item) => item.countryId === country.id);
    saveGeneratedPlan(profile, country, score);
    button.textContent = "Plan sauvegarde";
  });
}

function renderCompare() {
  const table = el("compareTable");
  if (!table) return;
  const { scores } = profileScores();
  table.innerHTML = `
    <div class="table-scroll">
      <table class="comparison-table">
        <thead><tr><th>Pays</th><th>Score</th><th>Visa</th><th>Cash stable</th><th>Upside</th><th>Cout entree</th><th>Premiere paie</th><th>Next action</th></tr></thead>
        <tbody>
          ${scores.map((score) => `
            <tr>
              <td><a class="link-chip" href="./country.html?country=${encodeURIComponent(score.slug)}">${escapeHtml(score.name)}</a></td>
              <td>${score.totalScore}/100</td>
              <td>${escapeHtml(score.visaFit)} · ${escapeHtml(score.ageGate)}</td>
              <td>${currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)}</td>
              <td>${currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)}</td>
              <td>${currency(score.entryCost.low, score.entryCost.currency)}-${currency(score.entryCost.high, score.entryCost.currency)}</td>
              <td>${score.timeToFirstPay.lowWeeks}-${score.timeToFirstPay.highWeeks} sem.</td>
              <td>${escapeHtml(score.nextAction)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderMap() {
  const container = el("countryMapApp");
  if (!container) return;
  const { scores } = profileScores();
  const scoreMap = new Map(scores.map((score) => [score.countryId, score]));
  container.innerHTML = `
    <div class="v2-map-board" role="img" aria-label="Carte mondiale personnalisée des pays documentés">
      ${worldMapSvg(scoreMap)}
      ${mobilityData.countries.map((country) => {
        const score = scoreMap.get(country.id);
        const position = countryPinPosition(country);
        return `<a class="v2-map-node is-${score.status}" href="./country.html?country=${encodeURIComponent(country.slug)}" style="--x:${position.x}%;--y:${position.y}%">
          <strong>${escapeHtml(country.name)}</strong><span>${score.totalScore}/100</span>
        </a>`;
      }).join("")}
      <div class="v2-map-legend" aria-hidden="true">
        <span><i class="legend-dot green"></i> exécutable</span>
        <span><i class="legend-dot orange"></i> prérequis</span>
        <span><i class="legend-dot red"></i> mauvais fit</span>
        <span><i class="legend-dot grey"></i> non documenté</span>
      </div>
    </div>
    <div class="card-grid card-grid-3">${scores.slice(0, 3).map((score) => countryScoreCard(mobilityData.countryMap.get(score.countryId), score)).join("")}</div>
  `;
}

function renderCountry() {
  const container = el("countryDetailApp");
  if (!container) return;
  const profile = loadProfile();
  const country = countryByParam();
  const score = scoreCountry(profile, country, mobilityData.rules);
  container.innerHTML = `
    <section class="page-hero">
      <div class="hero-grid">
        <div>
          <span class="eyebrow">${escapeHtml(country.status)} · ${escapeHtml(score.visaLabel)}</span>
          <h1 class="display-title">${escapeHtml(country.name)}: verdict ${score.totalScore}/100</h1>
          <p class="hero-copy">${escapeHtml(country.summary)}</p>
          <div class="hero-actions">
            <button class="button primary" type="button" data-save-country-plan="${escapeHtml(country.id)}">Sauvegarder le plan 7/30/90</button>
            <a class="button secondary" href="./compare.html">Comparer</a>
          </div>
        </div>
        <aside class="panel">${scoreGauge(score.totalScore, "Score pays")}${profileSummary(profile)}</aside>
      </div>
    </section>
    <section class="grid-3">
      <article class="metric-card"><span class="metric-label">Cash stable</span><strong class="metric-value">${currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)}</strong><span class="muted">${escapeHtml(score.realisticMonthlyRange.netOrGross)}</span></article>
      <article class="metric-card"><span class="metric-label">Upside</span><strong class="metric-value">${currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)}</strong><span class="muted">plausible, pas promis</span></article>
      <article class="metric-card"><span class="metric-label">Premiere paie</span><strong class="metric-value">${score.timeToFirstPay.lowWeeks}-${score.timeToFirstPay.highWeeks} sem.</strong><span class="muted">selon gates</span></article>
    </section>
    <section class="grid-2">
      <article class="panel"><span class="mini-label">Pourquoi oui</span><div class="list">${score.whyRecommended.map((item, index) => `<div class="list-item"><span class="list-index">${index + 1}</span><div>${escapeHtml(item)}</div></div>`).join("")}</div></article>
      <article class="panel"><span class="mini-label">Pourquoi dangereux</span><div class="list">${score.whyDangerous.map((item, index) => `<div class="list-item"><span class="list-index">${index + 1}</span><div>${escapeHtml(item)}</div></div>`).join("")}</div></article>
    </section>
    <section class="panel">
      <span class="mini-label">Cash paths</span>
      <div class="card-grid card-grid-2">${(country.cashPaths || []).map((path) => `
        <article class="card">
          <h3>${escapeHtml(path.title)}</h3>
          <div class="cash-strip">
            <div><span class="mini-label">Bas</span><strong>${currency(path.monthlyRangeLow, country.currency)}</strong></div>
            <div><span class="mini-label">Stable</span><strong>${currency(path.monthlyRangeStable, country.currency)}</strong></div>
            <div><span class="mini-label">Upside</span><strong>${currency(path.monthlyRangeUpside, country.currency)}</strong></div>
          </div>
          <p class="muted">Roles: ${(path.targetRoles || []).map(escapeHtml).join(", ")}</p>
          <div class="warning-card"><strong>Ne pas acheter trop tot:</strong> ${(path.doNotBuyYet || []).map(escapeHtml).join(", ")}</div>
        </article>
      `).join("")}</div>
    </section>
    <section class="panel"><span class="mini-label">Sources</span><div class="source-badge-row">${sourceBadges(score.sourceIds, mobilityData.sourceMap)}</div></section>
  `;
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-country-plan]");
    if (!button) return;
    const plan = saveGeneratedPlan(profile, country, score);
    button.textContent = "Plan sauvegarde";
    button.dataset.planId = plan.id;
  });
}

function renderPlans() {
  const container = el("plansApp");
  if (!container) return;
  const plans = loadPlans();
  if (!plans.length) {
    container.innerHTML = emptyState("Aucun plan sauvegarde", "Genere un plan depuis ton dashboard ou une fiche pays.", `<a class="button primary" href="./dashboard.html">Ouvrir le dashboard</a>`);
    return;
  }
  container.innerHTML = plans.map((plan) => `
    <article class="panel saved-plan" data-plan-id="${escapeHtml(plan.id)}">
      <div class="country-card-head">
        <div><span class="mini-label">${escapeHtml(plan.countryId)} · ${plan.progress || 0}%</span><h2>${escapeHtml(plan.title)}</h2></div>
        <button class="button secondary" type="button" data-delete-plan="${escapeHtml(plan.id)}">Supprimer</button>
      </div>
      <p class="muted">${escapeHtml(plan.verdict)}</p>
      <div class="plan-phase-grid">
        ${(plan.phases || []).map((phase) => `
          <section class="note-card">
            <h3>${escapeHtml(phase.label)}</h3>
            ${(phase.tasks || []).map((taskItem) => `
              <label class="task-row">
                <input type="checkbox" data-task-id="${escapeHtml(taskItem.id)}" ${taskItem.status === "done" ? "checked" : ""} />
                <span><strong>${escapeHtml(taskItem.title)}</strong><em>${escapeHtml(taskItem.description)}</em></span>
              </label>
            `).join("")}
          </section>
        `).join("")}
      </div>
    </article>
  `).join("");
  container.addEventListener("change", (event) => {
    const input = event.target.closest("[data-task-id]");
    if (!input) return;
    const planNode = input.closest("[data-plan-id]");
    const plan = loadPlans().find((item) => item.id === planNode.dataset.planId);
    if (plan) toggleTask(plan, input.dataset.taskId);
    renderPlans();
  });
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-plan]");
    if (!button) return;
    deletePlan(button.dataset.deletePlan);
    renderPlans();
  });
}

function renderAccount() {
  const container = el("accountApp");
  if (!container) return;
  const profile = loadProfile();
  container.innerHTML = `
    <section class="panel">
      <span class="mini-label">Compte</span>
      <h2>Stockage local actif. Auth managée requise pour multi-device.</h2>
      <p class="muted">Le site GitHub Pages ne doit pas faire de faux Google login. La prochaine etape propre: Supabase Auth ou Clerk + RLS + tables profiles/saved_plans/plan_tasks.</p>
      ${profileSummary(profile)}
      <div class="button-row">
        <button class="button secondary" type="button" data-export-local>Exporter JSON</button>
        <button class="button secondary" type="button" data-clear-local>Supprimer donnees locales</button>
      </div>
      <textarea class="input export-box" id="exportBox" readonly placeholder="Export JSON ici"></textarea>
    </section>
  `;
  container.addEventListener("click", (event) => {
    if (event.target.closest("[data-export-local]")) {
      el("exportBox").value = JSON.stringify(exportLocalData(), null, 2);
    }
    if (event.target.closest("[data-clear-local]")) {
      clearLocalProductData();
      window.location.href = "./onboarding.html";
    }
  });
}

function renderPage() {
  renderV2HeroStats();
  renderOnboarding();
  renderDashboard();
  renderCompare();
  renderMap();
  renderCountry();
  renderPlans();
  renderAccount();
}

async function init() {
  mobilityData = await loadMobilityProduct();
  renderPage();
}

init();
