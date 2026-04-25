import { loadAllData, loadHomeModel } from "./data.js";
import { DEFAULT_SELECTION, mergeSelection, saveSelection } from "./filters.js";
import { scoreLanes } from "./scoring.js";
import {
  competitionTone,
  escapeHtml,
  integer,
  laneHref,
  linkChip,
  pill,
  scenarioBoxHtml,
  sectorIcon,
  stabilityTone,
} from "./ui.js";

const HOME_STORAGE_KEY = "backchannel-atlas-home-onboarding-v1";
const LEGACY_HOME_STORAGE_KEYS = ["france-money-map-home-onboarding-v1"];

const statsRoot = document.getElementById("heroStats");
const pageHero = document.querySelector(".page-hero");
const heroPrimaryButton = document.querySelector(".hero-actions .button.primary");
const heroSecondaryButtons = [
  ...document.querySelectorAll(".hero-actions .button.secondary"),
];
const heroOnboardingButton =
  document.querySelector('.hero-actions a[href="#profileOnboarding"]') ||
  document.querySelector('.hero-actions a[href="#homeOnboardingSection"]');
const heroSupportButton =
  heroSecondaryButtons.find((button) => button !== heroOnboardingButton) ||
  (!heroOnboardingButton ? heroSecondaryButtons[0] : null);
const goalCards = document.getElementById("goalCards");
const sectorCards = document.getElementById("sectorCards");
const featuredRoutes = document.getElementById("featuredRoutes");
const goalSection = goalCards?.closest(".section");
const sectorSection = sectorCards?.closest(".section");
const featuredSection = featuredRoutes?.closest(".section");
const featuredSectionButton = featuredSection?.querySelector(".section-head .button");

let siteData;
let homeModel;
let homeState;
let onboardingSection;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeArrayValue(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function injectHomeStyles() {
  if (document.getElementById("homeOnboardingStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "homeOnboardingStyles";
  style.textContent = `
    .home-onboarding-grid,
    .home-fields,
    .home-field,
    .home-country-grid,
    .home-summary-panel,
    .home-country-card,
    .home-link-card {
      display: grid;
      gap: 14px;
    }

    .home-onboarding-grid,
    .home-country-grid {
      align-items: start;
    }

    .home-field-head {
      display: grid;
      gap: 4px;
    }

    .home-field .muted {
      margin: 0;
    }

    .home-summary-panel h3,
    .home-country-card h3,
    .home-link-card h3 {
      margin: 0;
      font-family: var(--display);
      font-size: 1.7rem;
      line-height: 0.96;
    }

    .home-select {
      width: 100%;
    }

    .home-country-card.is-active {
      border-color: rgba(255, 125, 48, 0.32);
      background:
        linear-gradient(135deg, rgba(255, 125, 48, 0.08), transparent 55%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
    }

    .home-country-card .list,
    .home-summary-panel .list,
    .home-link-card .list {
      gap: 8px;
    }

    .home-field-count {
      color: var(--muted);
      font-size: 0.82rem;
    }

    .home-source-label {
      color: var(--muted);
      font-size: 0.88rem;
    }

    @media (min-width: 900px) {
      .home-onboarding-grid {
        grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
      }

      .home-country-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;
  document.head.append(style);
}

function ensureOnboardingSection() {
  if (onboardingSection) {
    return onboardingSection;
  }

  onboardingSection = document.getElementById("profileOnboarding");
  if (onboardingSection) {
    return onboardingSection;
  }

  onboardingSection = document.getElementById("homeOnboardingSection");
  if (onboardingSection) {
    return onboardingSection;
  }

  onboardingSection = document.createElement("section");
  onboardingSection.className = "section";
  onboardingSection.id = "homeOnboardingSection";

  if (pageHero?.parentNode) {
    pageHero.insertAdjacentElement("afterend", onboardingSection);
  }

  return onboardingSection;
}

function loadSavedHomeState() {
  try {
    const rawValue =
      window.localStorage.getItem(HOME_STORAGE_KEY) ||
      LEGACY_HOME_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(
        Boolean,
      );
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}

function saveHomeState(state) {
  try {
    window.localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore storage failures.
  }
}

function getField(fieldId) {
  return homeModel.fieldMap.get(fieldId);
}

function getFieldOption(fieldId, optionId) {
  return getField(fieldId)?.options.find((option) => option.id === optionId);
}

function getOptionLabel(fieldId, optionId) {
  return getFieldOption(fieldId, optionId)?.label || optionId;
}

function normalizeFieldValue(field, rawValue, fallbackValue) {
  const allowedIds = new Set(field.options.map((option) => option.id));

  if (field.type === "multi") {
    const values = normalizeArrayValue(rawValue ?? fallbackValue).filter((value) =>
      allowedIds.has(value),
    );
    const maxSelected = field.maxSelected || values.length || field.options.length;
    return uniqueValues(values).slice(0, maxSelected);
  }

  const value = rawValue ?? fallbackValue ?? field.options[0]?.id;
  return allowedIds.has(value) ? value : fallbackValue ?? field.options[0]?.id;
}

function normalizeHomeState(schema, candidate = {}) {
  const defaults = schema.defaults || {};

  return (schema.fields || []).reduce((state, field) => {
    state[field.id] = normalizeFieldValue(
      field,
      candidate[field.id],
      defaults[field.id],
    );
    return state;
  }, {});
}

function commitHomeState(partial) {
  homeState = normalizeHomeState(homeModel.schema, {
    ...homeState,
    ...partial,
  });
  saveHomeState(homeState);
  render();
}

function toggleHomeMultiValue(field, optionId) {
  const currentValues = normalizeArrayValue(homeState[field.id]);
  const exists = currentValues.includes(optionId);

  if (exists) {
    commitHomeState({
      [field.id]: currentValues.filter((value) => value !== optionId),
    });
    return;
  }

  const maxSelected = field.maxSelected || field.options.length;
  const nextValues = [...currentValues, optionId];

  commitHomeState({
    [field.id]: nextValues.slice(-maxSelected),
  });
}

function choosePrimaryGoal(goalIds, goalPriority = []) {
  for (const goalId of goalPriority) {
    if (goalIds.includes(goalId)) {
      return goalId;
    }
  }

  return goalIds[0] || null;
}

function applyNumericAdjustments(target, adjustment = {}) {
  Object.entries(adjustment).forEach(([key, value]) => {
    if (typeof target[key] === "number") {
      target[key] += value;
    }
  });
}

function buildFranceSelection(countryConfig) {
  const model = countryConfig.selectionModel || {};
  const baseSelection = mergeSelection(
    DEFAULT_SELECTION,
    model.baseSelection || {},
  );
  const primaryCompactGoal = choosePrimaryGoal(
    homeState.goals,
    model.goalPriority || [],
  );
  const mappedGoal = model.goalMap?.[primaryCompactGoal] || baseSelection.goal;
  const derivedProfiles = uniqueValues([
    ...(model.defaultProfiles || []),
    ...homeState.experienceTags.flatMap(
      (tag) => model.experienceProfileMap?.[tag] || [],
    ),
    ...(model.englishProfileMap?.[homeState.english] || []),
  ]);

  const nextSelection = {
    goal: mappedGoal,
    sort: baseSelection.sort,
    profiles: derivedProfiles.length ? derivedProfiles : baseSelection.profiles,
    stabilityNeed: baseSelection.stabilityNeed,
    speedNeed: baseSelection.speedNeed,
    physicalTolerance: baseSelection.physicalTolerance,
    mobilityTolerance:
      model.mobilityToleranceMap?.[homeState.mobility] ??
      baseSelection.mobilityTolerance,
  };

  homeState.goals.forEach((goalId) => {
    applyNumericAdjustments(nextSelection, model.goalAdjustments?.[goalId]);
  });
  applyNumericAdjustments(nextSelection, model.ageAdjustments?.[homeState.ageBand]);

  if (
    homeState.experienceTags.some((tag) =>
      ["terrain", "meca", "hauteur", "securite"].includes(tag),
    )
  ) {
    nextSelection.physicalTolerance += 10;
  }

  if (
    homeState.experienceTags.includes("gestion") &&
    !homeState.experienceTags.some((tag) =>
      ["terrain", "meca", "hauteur"].includes(tag),
    )
  ) {
    nextSelection.physicalTolerance -= 8;
  }

  if (homeState.nationality === "sponsor") {
    nextSelection.stabilityNeed += 6;
    nextSelection.speedNeed -= 6;
  }

  ["stabilityNeed", "speedNeed", "physicalTolerance", "mobilityTolerance"].forEach(
    (key) => {
      nextSelection[key] = clamp(nextSelection[key], 0, 100);
    },
  );

  return mergeSelection(baseSelection, nextSelection);
}

function buildFranceRouteHref(selection) {
  const params = new URLSearchParams();

  params.set("goal", selection.goal);
  if (selection.profiles.length) {
    params.set("profiles", selection.profiles.join(","));
  }
  if (selection.sort && selection.sort !== "score") {
    params.set("sort", selection.sort);
  }
  if (selection.stabilityNeed !== DEFAULT_SELECTION.stabilityNeed) {
    params.set("stability", selection.stabilityNeed);
  }
  if (selection.speedNeed !== DEFAULT_SELECTION.speedNeed) {
    params.set("speed", selection.speedNeed);
  }
  if (selection.physicalTolerance !== DEFAULT_SELECTION.physicalTolerance) {
    params.set("physical", selection.physicalTolerance);
  }
  if (selection.mobilityTolerance !== DEFAULT_SELECTION.mobilityTolerance) {
    params.set("mobility", selection.mobilityTolerance);
  }

  return `./parcours.html?${params.toString()}`;
}

function compactSourceLabel(title = "") {
  return title.split("—")[0].trim();
}

function matchesInsightRule(rule) {
  const when = rule.when || {};

  if (when.nationality && !when.nationality.includes(homeState.nationality)) {
    return false;
  }
  if (when.ageBand && !when.ageBand.includes(homeState.ageBand)) {
    return false;
  }
  if (when.mobility && !when.mobility.includes(homeState.mobility)) {
    return false;
  }
  if (when.english && !when.english.includes(homeState.english)) {
    return false;
  }
  if (
    when.experienceCountMin &&
    homeState.experienceTags.length < when.experienceCountMin
  ) {
    return false;
  }
  if (
    when.experienceTagsAny &&
    !homeState.experienceTags.some((tag) => when.experienceTagsAny.includes(tag))
  ) {
    return false;
  }
  if (when.goalsAny && !homeState.goals.some((goal) => when.goalsAny.includes(goal))) {
    return false;
  }

  return true;
}

function buildInsights(countryConfig) {
  const insights = (countryConfig.insightRules || []).filter(matchesInsightRule);

  if (insights.length > 0) {
    return insights.slice(0, 3);
  }

  return [
    {
      tone: "blue",
      title: "Lecture rapide",
      body: countryConfig.summary,
    },
  ];
}

function scoreWeightMap(weightMap = {}, selectedValue) {
  return weightMap[selectedValue] || 0;
}

function scoreMultiWeightMap(weightMap = {}, selectedValues = []) {
  return selectedValues.reduce((total, value) => total + (weightMap[value] || 0), 0);
}

function buildAustraliaRecommendations(countryConfig) {
  return (countryConfig.playbookWeights || [])
    .map((rule) => {
      const playbook = homeModel.australiaPlaybookMap.get(rule.title);
      if (!playbook) {
        return null;
      }

      const weights = rule.weights || {};
      const rawScore =
        scoreWeightMap(weights.nationality, homeState.nationality) +
        scoreWeightMap(weights.ageBand, homeState.ageBand) +
        scoreWeightMap(weights.mobility, homeState.mobility) +
        scoreWeightMap(weights.english, homeState.english) +
        scoreMultiWeightMap(weights.experienceTags, homeState.experienceTags) +
        scoreMultiWeightMap(weights.goals, homeState.goals);

      return {
        playbook,
        matchScore: clamp(50 + rawScore, 0, 99),
        recommendedSources: (rule.recommendedSourceIds || [])
          .map((sourceId) => siteData.sourceMap.get(sourceId))
          .filter(Boolean),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.matchScore - left.matchScore);
}

function resolveStatValue(entry) {
  if (typeof entry.value === "number") {
    return entry.value;
  }

  switch (entry.source) {
    case "lanes":
      return siteData.lanes.length;
    case "tickets":
      return siteData.tickets.length;
    case "employers":
      return siteData.employers.length;
    case "sectors":
      return siteData.sectors.length;
    case "australiaPanels":
      return homeModel.australiaPanels.length;
    case "australiaPlaybooks":
      return homeModel.australiaPlaybooks.length;
    case "australiaSources":
      return siteData.sources.filter((source) => source.id.startsWith("au-")).length;
    default:
      return 0;
  }
}

function resolveAction(action, context) {
  if (!action) {
    return null;
  }

  if (action.type === "page") {
    return {
      href: action.href,
      label: action.label,
      isExternal: false,
    };
  }

  if (action.type === "dynamic-france-route" && context.franceSelection) {
    return {
      href: buildFranceRouteHref(context.franceSelection),
      label: action.label,
      isExternal: false,
    };
  }

  if (action.type === "source") {
    const source = siteData.sourceMap.get(action.sourceId);
    if (!source) {
      return null;
    }

    return {
      href: source.url,
      label: action.label || source.title,
      isExternal: true,
      sourceTitle: source.title,
    };
  }

  return null;
}

function actionButtonHtml(action, className = "button primary") {
  if (!action) {
    return "";
  }

  return `
    <a
      class="${className}"
      href="${escapeHtml(action.href)}"
      ${action.isExternal ? 'target="_blank" rel="noreferrer"' : ""}
    >
      ${escapeHtml(action.label)}
    </a>
  `;
}

function applyAnchorAction(anchor, action) {
  if (!anchor || !action) {
    return;
  }

  anchor.textContent = action.label;
  anchor.href = action.href;

  if (action.isExternal) {
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
  } else {
    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
  }
}

function setSectionCopy(section, title, copy) {
  if (!section) {
    return;
  }

  const titleNode = section.querySelector(".section-title");
  const copyNode = section.querySelector(".section-copy");

  if (titleNode) {
    titleNode.textContent = title;
  }
  if (copyNode) {
    copyNode.textContent = copy;
  }
}

function buildCountryContext() {
  const country =
    homeModel.countryMap.get(homeState.country) || homeModel.countries[0];
  const insights = buildInsights(country);

  if (country.id === "france") {
    const franceSelection = buildFranceSelection(country);
    const rankedLanes = scoreLanes(siteData.lanes, franceSelection);
    const context = {
      country,
      insights,
      franceSelection,
      primaryRecommendation: rankedLanes[0] || null,
      rankedLanes,
    };

    context.primaryAction = resolveAction(country.hero?.primaryLink, context);
    context.secondaryAction = resolveAction(country.hero?.secondaryLink, context);
    return context;
  }

  const australiaRecommendations = buildAustraliaRecommendations(country);
  const context = {
    country,
    insights,
    australiaRecommendations,
    primaryRecommendation: australiaRecommendations[0] || null,
  };

  context.primaryAction = resolveAction(country.hero?.primaryLink, context);
  context.secondaryAction = resolveAction(country.hero?.secondaryLink, context);
  return context;
}

function renderStats(countryConfig) {
  const cards = statsRoot ? [...statsRoot.querySelectorAll(".metric-card")] : [];

  cards.forEach((card, index) => {
    const statConfig = countryConfig.stats?.[index];
    if (!statConfig) {
      return;
    }

    const labelNode = card.querySelector(".metric-label");
    const valueNode = card.querySelector(".metric-value");

    if (labelNode) {
      labelNode.textContent = statConfig.label;
    }
    if (valueNode) {
      valueNode.textContent = integer(resolveStatValue(statConfig));
    }
  });
}

function renderHeroLinks(context) {
  if (heroPrimaryButton && context.primaryAction) {
    applyAnchorAction(heroPrimaryButton, context.primaryAction);
  }
  if (heroSupportButton && context.secondaryAction) {
    applyAnchorAction(heroSupportButton, context.secondaryAction);
  }
  if (featuredSectionButton && context.primaryAction) {
    applyAnchorAction(featuredSectionButton, context.primaryAction);
  }
}

function renderOnboarding(context) {
  const section = ensureOnboardingSection();
  const selectedExperience = homeState.experienceTags
    .map((tag) => pill(getOptionLabel("experienceTags", tag), "blue"))
    .join("");
  const selectedGoals = homeState.goals
    .map((goal) => pill(getOptionLabel("goals", goal), "orange"))
    .join("");

  section.innerHTML = `
    <div class="section-head">
      <div>
        <h2 class="section-title">Choisir un pays et un profil compact</h2>
        <p class="section-copy">
          Nationalité, âge, mobilité, anglais, expérience et objectifs servent
          maintenant à pré-régler les recommandations dès l'entrée du site.
        </p>
      </div>
      <button class="button secondary" type="button" data-home-reset>
        Réinitialiser
      </button>
    </div>
    <div class="home-onboarding-grid">
      <div class="filter-panel home-fields">
        ${homeModel.fields
          .map((field) => {
            if (field.control === "select") {
              return `
                <label class="home-field">
                  <div class="home-field-head">
                    <span class="mini-label">${escapeHtml(field.label)}</span>
                    <p class="muted">${escapeHtml(field.description)}</p>
                  </div>
                  <select class="input home-select" data-home-select="${field.id}">
                    ${field.options
                      .map(
                        (option) => `
                          <option
                            value="${escapeHtml(option.id)}"
                            ${homeState[field.id] === option.id ? "selected" : ""}
                          >
                            ${escapeHtml(option.label)}
                          </option>
                        `,
                      )
                      .join("")}
                  </select>
                </label>
              `;
            }

            return `
              <div class="home-field">
                <div class="home-field-head">
                  <span class="mini-label">${escapeHtml(field.label)}</span>
                  <p class="muted">${escapeHtml(field.description)}</p>
                </div>
                <div class="chip-set">
                  ${field.options
                    .map((option) => {
                      const isActive =
                        field.type === "multi"
                          ? homeState[field.id].includes(option.id)
                          : homeState[field.id] === option.id;

                      return `
                        <button
                          class="chip ${isActive ? "is-active" : ""}"
                          type="button"
                          data-home-toggle="${field.id}"
                          data-home-value="${option.id}"
                        >
                          ${escapeHtml(option.label)}
                        </button>
                      `;
                    })
                    .join("")}
                </div>
                ${
                  field.type === "multi"
                    ? `
                      <div class="home-field-count">
                        ${homeState[field.id].length}/${field.maxSelected} sélectionnés
                      </div>
                    `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="panel home-summary-panel">
        <div class="pill-row">
          ${pill(context.country.label, "orange")}
          ${pill(context.country.badge, "blue")}
          ${pill(`Mobilité ${getOptionLabel("mobility", homeState.mobility)}`, "green")}
          ${pill(`Anglais ${getOptionLabel("english", homeState.english)}`, "gold")}
        </div>
        <h3>Lecture rapide</h3>
        <p class="muted">${escapeHtml(context.country.summary)}</p>
        <div>
          <span class="mini-label">Signaux envoyés</span>
          <div class="pill-row">
            ${selectedExperience || pill("Aucun signal", "red")}
            ${selectedGoals || pill("Aucun objectif", "red")}
          </div>
        </div>
        <div class="list">
          ${context.insights
            .map(
              (insight, index) => `
                <div class="list-item">
                  <span class="list-index">${index + 1}</span>
                  <div>
                    <div class="pill-row">${pill(insight.title, insight.tone || "blue")}</div>
                    <div>${escapeHtml(insight.body)}</div>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="button-row">
          ${actionButtonHtml(context.primaryAction, "button primary")}
          ${actionButtonHtml(context.secondaryAction, "button secondary")}
        </div>
      </div>
    </div>
  `;
}

function renderCountries(context) {
  const sectionText = context.country.sectionText || {};
  sectorCards.classList.add("home-country-grid");
  setSectionCopy(
    sectorSection,
    sectionText.countriesTitle || "Pays couverts",
    sectionText.countriesCopy || "",
  );

  sectorCards.innerHTML = homeModel.countries
    .map((country) => {
      const stats = (country.stats || [])
        .map((entry) => pill(`${integer(resolveStatValue(entry))} ${entry.label}`, "blue"))
        .join("");

      return `
        <article class="card home-country-card ${country.id === context.country.id ? "is-active" : ""}">
          <div class="pill-row">
            ${pill(country.label, "orange")}
            ${pill(country.badge, "gold")}
          </div>
          <h3>${escapeHtml(country.marketCard?.title || country.label)}</h3>
          <p class="muted">${escapeHtml(country.marketCard?.summary || country.summary)}</p>
          <div class="pill-row">${stats}</div>
          <div class="list">
            ${(country.marketCard?.bullets || [])
              .map(
                (bullet, index) => `
                  <div class="list-item">
                    <span class="list-index">${index + 1}</span>
                    <div>${escapeHtml(bullet)}</div>
                  </div>
                `,
              )
              .join("")}
          </div>
          <div class="button-row">
            <button
              class="button ${country.id === context.country.id ? "primary" : "secondary"}"
              type="button"
              data-country-select="${country.id}"
            >
              ${country.id === context.country.id ? "Pays actif" : `Choisir ${country.label}`}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderQuickLinks(context) {
  const sectionText = context.country.sectionText || {};
  setSectionCopy(
    goalSection,
    sectionText.linksTitle || "Liens utiles pour ton profil",
    sectionText.linksCopy || "",
  );

  const cards = (context.country.quickLinks || [])
    .map((link) => {
      const resolvedAction = resolveAction(link.action, context);
      if (!resolvedAction) {
        return null;
      }

      let summary = link.summary;
      if (context.country.id === "france" && link.id === "fr-route" && context.primaryRecommendation) {
        summary = `${summary} Top lane actuelle: ${context.primaryRecommendation.lane.title}.`;
      }
      if (
        context.country.id === "australia" &&
        link.id === "au-playbooks" &&
        context.primaryRecommendation
      ) {
        summary = `${summary} Meilleur match actuel: ${context.primaryRecommendation.playbook.title}.`;
      }

      return `
        <article class="card home-link-card">
          <div class="pill-row">
            ${pill(context.country.label, "orange")}
            ${
              resolvedAction.sourceTitle
                ? pill(compactSourceLabel(resolvedAction.sourceTitle), "blue")
                : ""
            }
          </div>
          <h3>${escapeHtml(link.title)}</h3>
          <p class="muted">${escapeHtml(summary)}</p>
          ${
            resolvedAction.sourceTitle
              ? `<div class="home-source-label">${escapeHtml(resolvedAction.sourceTitle)}</div>`
              : ""
          }
          <div class="button-row">
            ${actionButtonHtml(resolvedAction, "button primary")}
          </div>
        </article>
      `;
    })
    .filter(Boolean);

  goalCards.innerHTML = cards.join("");
}

function franceRouteCardHtml(result) {
  const { lane } = result;
  const ticketLabels = lane.ticketsRequired
    .map((ticketId) => siteData.ticketMap.get(ticketId)?.name)
    .filter(Boolean)
    .slice(0, 3);

  return `
    <article class="result-card">
      <div class="pill-row">
        ${pill(`${sectorIcon(lane.sector)} ${lane.sectorLabel}`, "blue")}
        ${pill(lane.stabilityLevel, stabilityTone(lane.stabilityLevel))}
        ${pill(lane.competitionLevel, competitionTone(lane.competitionLevel))}
      </div>
      <h3 class="result-title">${escapeHtml(lane.title)}</h3>
      <p class="result-subtitle">${escapeHtml(lane.branch)} · ${escapeHtml(lane.subBranch)}</p>
      <div class="money-row">
        ${scenarioBoxHtml("Bas", lane.salaryLowScenario, "blue")}
        ${scenarioBoxHtml("Stable", lane.salaryStableScenario, "gold")}
        ${scenarioBoxHtml("Max", lane.salaryMaxScenario, "green")}
      </div>
      <div class="list">
        ${result.reasons
          .slice(0, 2)
          .map(
            (reason, index) => `
              <div class="list-item">
                <span class="list-index">${index + 1}</span>
                <div>${escapeHtml(reason)}</div>
              </div>
            `,
          )
          .join("")}
      </div>
      <div>
        <span class="mini-label">Tickets d'entrée</span>
        <div class="inline-links">
          ${ticketLabels.length
            ? ticketLabels.map((ticket) => pill(ticket, "orange")).join("")
            : pill("À confirmer", "red")}
        </div>
      </div>
      <div class="button-row">
        <a class="button primary" href="${escapeHtml(laneHref(lane.id))}">
          Voir la porte
        </a>
      </div>
    </article>
  `;
}

function playbookMatchTone(score) {
  if (score >= 72) {
    return "green";
  }
  if (score >= 58) {
    return "gold";
  }
  return "red";
}

function australiaPlaybookCardHtml(result) {
  const { playbook } = result;
  const sourceLinks = result.recommendedSources
    .map((source) => linkChip(compactSourceLabel(source.title), source.url))
    .join("");

  return `
    <article class="result-card">
      <div class="pill-row">
        ${pill(playbook.track, "blue")}
        ${pill(`Match ${result.matchScore}`, playbookMatchTone(result.matchScore))}
      </div>
      <h3 class="result-title">${escapeHtml(playbook.title)}</h3>
      <p class="result-subtitle">${escapeHtml(playbook.summary)}</p>
      <div>
        <span class="mini-label">Temps pour être prêt</span>
        <strong>${escapeHtml(playbook.timeToReady)}</strong>
      </div>
      <div class="list">
        ${playbook.gates
          .slice(0, 3)
          .map(
            (gate, index) => `
              <div class="list-item">
                <span class="list-index">${index + 1}</span>
                <div>${escapeHtml(gate)}</div>
              </div>
            `,
          )
          .join("")}
      </div>
      <div>
        <span class="mini-label">Next moves</span>
        <div class="inline-links">
          ${playbook.nextMoves.map((move) => pill(move, "gold")).join("")}
        </div>
      </div>
      <div>
        <span class="mini-label">Sources à vérifier</span>
        <div class="inline-links">${sourceLinks}</div>
      </div>
      <div class="button-row">
        <a class="button primary" href="./sources.html">Voir le playbook</a>
      </div>
    </article>
  `;
}

function renderFeatured(context) {
  const sectionText = context.country.sectionText || {};
  setSectionCopy(
    featuredSection,
    sectionText.resultsTitle || "Ce qui remonte pour toi",
    sectionText.resultsCopy || "",
  );

  if (context.country.id === "france") {
    featuredRoutes.innerHTML = context.rankedLanes
      .slice(0, 4)
      .map((result) => franceRouteCardHtml(result))
      .join("");
    return;
  }

  featuredRoutes.innerHTML = context.australiaRecommendations
    .slice(0, 3)
    .map((result) => australiaPlaybookCardHtml(result))
    .join("");
}

function render() {
  const context = buildCountryContext();

  if (context.franceSelection) {
    saveSelection(context.franceSelection);
  }

  renderStats(context.country);
  renderHeroLinks(context);
  renderOnboarding(context);
  renderCountries(context);
  renderQuickLinks(context);
  renderFeatured(context);
}

function bindEvents() {
  ensureOnboardingSection().addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-home-reset]");
    if (resetButton) {
      commitHomeState(homeModel.defaults);
      return;
    }

    const toggleButton = event.target.closest("[data-home-toggle]");
    if (!toggleButton) {
      return;
    }

    const field = getField(toggleButton.dataset.homeToggle);
    const optionId = toggleButton.dataset.homeValue;

    if (!field || !optionId) {
      return;
    }

    if (field.type === "multi") {
      toggleHomeMultiValue(field, optionId);
      return;
    }

    commitHomeState({
      [field.id]: optionId,
    });
  });

  ensureOnboardingSection().addEventListener("change", (event) => {
    const select = event.target.closest("[data-home-select]");
    if (!select) {
      return;
    }

    commitHomeState({
      [select.dataset.homeSelect]: select.value,
    });
  });

  sectorCards.addEventListener("click", (event) => {
    const button = event.target.closest("[data-country-select]");
    if (!button) {
      return;
    }

    commitHomeState({
      country: button.dataset.countrySelect,
    });
  });
}

async function init() {
  injectHomeStyles();
  ensureOnboardingSection();

  [siteData, homeModel] = await Promise.all([loadAllData(), loadHomeModel()]);
  homeState = normalizeHomeState(homeModel.schema, loadSavedHomeState() || {});

  bindEvents();
  render();
}

init();
