"use client";

import Link from "next/link";
import { countries, countryMap, worldFeatures } from "@/lib/data";
import { classNames, currency } from "@/lib/format";
import { optionLabels } from "@/lib/profile";
import type { CountryProfile, CountryScore, UserProfile, WorldFeature } from "@/lib/types";

const worldWidth = 1200;
const worldHeight = 620;

const pinNudges: Record<string, { x: number; y: number }> = {
  france: { x: 6, y: -8 },
  germany: { x: 9, y: -11 },
  switzerland: { x: 10, y: 5 },
  uae: { x: 4, y: 2 },
  canada: { x: -8, y: -4 },
  australia: { x: -18, y: -10 },
};

function projectLonLat(lon: number, lat: number) {
  return { x: ((lon + 180) / 360) * worldWidth, y: ((90 - lat) / 180) * worldHeight };
}

function ringPath(points: number[][]) {
  return points
    .map((point, index) => {
      const projected = projectLonLat(point[0], point[1]);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    })
    .join(" ");
}

function geometryPath(feature: WorldFeature) {
  if (!feature.geometry) return "";
  if (feature.geometry.type === "Polygon") {
    return (feature.geometry.coordinates as number[][][]).map((ring) => `${ringPath(ring)} Z`).join(" ");
  }
  return (feature.geometry.coordinates as number[][][][])
    .flatMap((polygon) => polygon.map((ring) => `${ringPath(ring)} Z`))
    .join(" ");
}

function pinPosition(country: CountryProfile) {
  if (!country.geo) return { x: 50, y: 50 };
  const projected = projectLonLat(country.geo.lon, country.geo.lat);
  const nudge = pinNudges[country.id] || { x: 0, y: 0 };
  return {
    x: Math.max(16, Math.min(88, (projected.x / worldWidth) * 100 + nudge.x)),
    y: Math.max(10, Math.min(88, (projected.y / worldHeight) * 100 + nudge.y)),
  };
}

function countryLabel(score: CountryScore) {
  if (score.status === "green") return "open";
  if (score.status === "orange") return "gate";
  if (score.status === "red") return "blocked";
  return "locked";
}

function confidenceLabel(country?: CountryProfile) {
  if (!country) return "model";
  if (country.confidence === "high") return "strong proof";
  if (country.confidence === "medium") return "mixed proof";
  return "needs proof";
}

export type CertaintyTier = "certain" | "probable" | "verify";

export function accessProbabilityBand(accessScore: number) {
  if (accessScore >= 72) return "35–55%";
  if (accessScore >= 55) return "22–38%";
  if (accessScore >= 40) return "12–25%";
  if (accessScore >= 25) return "6–14%";
  return "3–8%";
}

export function certaintyTierForScore(score: CountryScore, country?: CountryProfile): CertaintyTier {
  if (country?.confidence === "high" && score.sourceIds.length > 0 && score.visaFit !== "unknown") return "certain";
  if (country?.confidence === "medium" || score.accessScore >= 42) return "probable";
  return "verify";
}

export function maxVerifiedCertainty(country?: CountryProfile): CertaintyTier {
  if (country?.confidence === "high") return "probable";
  return "verify";
}

const certaintyCopy: Record<CertaintyTier, { label: string; hint: string }> = {
  certain: { label: "CERTAIN", hint: "Source officielle ou regle publique" },
  probable: { label: "PROBABLE", hint: "Estimation selon donnees et profil" },
  verify: { label: "A VERIFIER", hint: "Contrat, agent, employeur ou fiscaliste" },
};

export function CertaintyBadge({ tier, compact = false }: { tier: CertaintyTier; compact?: boolean }) {
  const copy = certaintyCopy[tier];
  return (
    <span className={classNames("certainty-badge", `is-${tier}`, compact && "is-compact")} title={copy.hint}>
      {copy.label}
    </span>
  );
}

export function ProbabilityBadge({ score }: { score: CountryScore }) {
  return (
    <div className="prob-badge" aria-label={`Probabilite d acces estimee ${accessProbabilityBand(score.accessScore)}`}>
      <span>Acces estime</span>
      <strong>{accessProbabilityBand(score.accessScore)}</strong>
      <em>sous 6 mois · profil actuel</em>
      <CertaintyBadge tier="probable" compact />
    </div>
  );
}

export function CorridorWedgeStrip() {
  const corridors = [
    ["FR/EU → AU", "FIFO · mining · rail"],
    ["FR/EU → CH", "Chantier · sante · logistique"],
    ["FR/EU → CA", "Camp jobs · trades"],
  ];
  return (
    <section className="corridor-strip" aria-label="Corridors MVP documentes">
      <span className="system-kicker">Wedge V1 · architecture mondiale</span>
      <div className="corridor-strip__grid">
        {corridors.map(([title, copy]) => (
          <article key={title}>
            <strong>{title}</strong>
            <span>{copy}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PaidAuditCta({ variant = "panel" }: { variant?: "panel" | "inline" }) {
  return (
    <aside className={classNames("audit-cta", variant === "inline" && "is-inline")}>
      <span className="system-kicker">Proof of Possibility MVP</span>
      <h2>Audit de faisabilite</h2>
      <p>Top 3 trajectoires, cash stable/high/max, gates, cout d entree, plan 30/90 jours, risques et sources.</p>
      <div className="audit-cta__meta">
        <span>49–149 EUR</span>
        <CertaintyBadge tier="verify" compact />
      </div>
      <p className="audit-cta__note">Orientation strategique — pas de conseil juridique visa.</p>
      <Link className="button primary" href="/onboarding/">Preparer mon profil audit</Link>
    </aside>
  );
}

export function WorldMapCanvas({
  scores,
  mode = "standard",
}: {
  scores: CountryScore[];
  mode?: "standard" | "hero" | "compact";
}) {
  const scoreByCountry = new Map(scores.map((score) => [score.countryId, score]));
  const countryByIso = new Map(countries.map((country) => [country.iso3, country]));
  const visibleNodeIds = new Set((mode === "hero" ? scores.slice(0, 5) : scores).map((score) => score.countryId));

  return (
    <section className={classNames("atlas-map", `atlas-map--${mode}`)} aria-label="Carte mondiale interactive des opportunites">
      <div className="atlas-map__chrome" aria-hidden="true">
        <span>LAT / LON GRID</span>
        <span>PROFILE FIT</span>
        <span>LIVE DATASET</span>
      </div>
      <svg className="atlas-map__svg" viewBox={`0 0 ${worldWidth} ${worldHeight}`} role="img" aria-label="Carte du monde avec frontieres reelles">
        <g className="atlas-map__grid" aria-hidden="true">
          <path d={`M0 ${worldHeight * 0.25}H${worldWidth}M0 ${worldHeight * 0.5}H${worldWidth}M0 ${worldHeight * 0.75}H${worldWidth}`} />
          <path d={`M${worldWidth * 0.25} 0V${worldHeight}M${worldWidth * 0.5} 0V${worldHeight}M${worldWidth * 0.75} 0V${worldHeight}`} />
        </g>
        <g>
          {worldFeatures.map((feature, index) => {
            const country = countryByIso.get(feature.properties?.iso3 || "");
            const score = country ? scoreByCountry.get(country.id) : null;
            const href = country ? `/country/${country.slug}/` : "";
            const clickable = Boolean(country && score);
            return (
              <path
                className={classNames("atlas-country", country && "is-documented", score && `is-${score.status}`)}
                d={geometryPath(feature)}
                key={`${feature.properties?.iso3 || index}`}
                role={clickable ? "link" : "presentation"}
                tabIndex={clickable ? 0 : -1}
                aria-label={clickable ? `${country!.name}, score ${score!.totalScore} sur 100` : undefined}
                onClick={() => {
                  if (href) window.location.href = href;
                }}
                onKeyDown={(event) => {
                  if (href && (event.key === "Enter" || event.key === " ")) window.location.href = href;
                }}
              />
            );
          })}
        </g>
      </svg>
      <div className="atlas-map__markers">
        {countries.map((country) => {
          const score = scoreByCountry.get(country.id);
          if (!score || !visibleNodeIds.has(country.id)) return null;
          const position = pinPosition(country);
          return (
            <Link
              className={classNames("atlas-marker", `is-${score.status}`)}
              href={`/country/${country.slug}/`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              key={country.id}
            >
              <span>{countryLabel(score)}</span>
              <strong>{country.name}</strong>
              <em>{score.totalScore}/100</em>
            </Link>
          );
        })}
      </div>
      <div className="atlas-map__legend" aria-label="Legende carte">
        <span><i className="dot green" /> open</span>
        <span><i className="dot orange" /> gate</span>
        <span><i className="dot red" /> blocked</span>
        <span><i className="dot gray" /> undocumented</span>
      </div>
    </section>
  );
}

export function WorldMapHero({ scores, session }: { scores: CountryScore[]; session: unknown }) {
  const best = scores[0];
  return (
    <section className="landing-os">
      <div className="landing-os__map">
        <WorldMapCanvas scores={scores} mode="hero" />
      </div>
      <aside className="landing-os__brief">
        <span className="system-kicker">Backchannel Atlas / private mobility OS</span>
        <h1>La carte qui trie tes moves.</h1>
        <p>
          Profil court. Pays scorés. Gates visibles. Cash stable, high et max vérifié séparés. Plan après verdict.
        </p>
        <div className="best-verdict">
          <span>Best move actuel</span>
          <strong>{best?.name || "Profil requis"}</strong>
          <em>{best ? `${best.totalScore}/100 · ${best.visaLabel}` : "Lance le setup pour scorer la carte"}</em>
        </div>
        <div className="hero-action-grid">
          <Link className="button primary" href="/onboarding/">Créer mon profil</Link>
          <Link className="button" href="/map/">Ouvrir la carte</Link>
          <Link className="button ghost" href={session ? "/plans/" : "/login/"}>{session ? "Mes plans" : "Sauvegarder plus tard"}</Link>
        </div>
      </aside>
      <div className="landing-os__rank">
        {scores.slice(0, 4).map((score, index) => <CompactTrajectoryCard key={score.countryId} score={score} index={index} />)}
      </div>
    </section>
  );
}

export function DecisionStatStrip({ scores, session }: { scores: CountryScore[]; session: unknown }) {
  const best = scores[0];
  const open = scores.filter((score) => score.status === "green").length;
  return (
    <section className="signal-strip" aria-label="Résumé decisionnel">
      <div><span>Dataset</span><strong>{scores.length} pays</strong><em>architecture mondiale</em></div>
      <div><span>Open now</span><strong>{open}</strong><em>selon profil actuel</em></div>
      <div><span>Best route</span><strong>{best?.name || "setup"}</strong><em>{best ? `${best.totalScore}/100` : "profil requis"}</em></div>
      <div><span>Account</span><strong>{session ? "cloud" : "guest"}</strong><em>login apres verdict</em></div>
    </section>
  );
}

export function RouteFlow() {
  const steps = [
    ["profile", "Setup", "Passeport, âge, cash, anglais, limites terrain."],
    ["scan", "Scan", "Carte mondiale recalculée selon ton profil."],
    ["gate", "Gate", "Visa, ticket, budget, délai, risque."],
    ["plan", "Move", "Checklist exécutable, sauvegardée, vérifiable."],
  ];
  return (
    <section className="flow-console" aria-label="Logique produit">
      {steps.map(([code, title, copy]) => (
        <article key={code}>
          <span>{code}</span>
          <strong>{title}</strong>
          <p>{copy}</p>
        </article>
      ))}
    </section>
  );
}

export function ProfileSummaryCard({ profile, compact = false }: { profile: UserProfile; compact?: boolean }) {
  const initials = (profile.identity.firstName || "BA").slice(0, 2).toUpperCase();
  return (
    <article className={classNames("passport-panel", compact && "is-compact")}>
      <div className="passport-panel__avatar" aria-hidden="true">{initials}</div>
      <div>
        <span className="system-kicker">Profile packet</span>
        <h2>{profile.identity.firstName ? `${profile.identity.firstName}, ${profile.identity.ageExact}` : `${profile.identity.ageExact} ans · guest`}</h2>
        <div className="data-pills">
          <span>Passport {profile.identity.passportCountry}</span>
          <span>Now {profile.identity.currentCountry}</span>
          <span>English {optionLabels.englishLevel[profile.skills.englishLevel]}</span>
          <span>Target {currency(profile.money.targetMonthlyNet, profile.money.currency)}/mois</span>
          <span>{profile.skills.experienceTags.join(", ") || "aucun signal"}</span>
        </div>
      </div>
    </article>
  );
}

export function SalaryCard({ score, country }: { score: CountryScore; country?: CountryProfile }) {
  const maxLabel = country?.confidence === "high" ? currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency) : "preuve requise";
  return (
    <div className="cash-console">
      <div className="cash-console__cell stable">
        <span>Stable</span>
        <strong>{currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)}</strong>
        <em>{score.realisticMonthlyRange.netOrGross}</em>
        <CertaintyBadge tier={certaintyTierForScore(score, country)} compact />
      </div>
      <div className="cash-console__cell">
        <span>High</span>
        <strong>{currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)}</strong>
        <em>plausible, conditions</em>
        <CertaintyBadge tier="probable" compact />
      </div>
      <div className="cash-console__cell">
        <span>Max verified</span>
        <strong>{maxLabel}</strong>
        <em>max ≠ moyenne · {confidenceLabel(country)}</em>
        <CertaintyBadge tier={maxVerifiedCertainty(country)} compact />
      </div>
    </div>
  );
}

export function ScoreBreakdown({ score }: { score: CountryScore }) {
  const rows = [
    ["access", score.accessScore],
    ["cash", score.cashScore],
    ["speed", score.speedScore],
    ["fit", score.fitScore],
    ["risk", score.riskScore],
  ];
  return (
    <div className="score-console" aria-label={`Score detaille ${score.name}`}>
      {rows.map(([label, value]) => (
        <div className="score-console__row" key={label}>
          <span>{label}</span>
          <div><i style={{ width: `${value}%` }} /></div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function OpportunityCard({
  score,
  country = countryMap.get(score.countryId),
  index,
  onSavePlan,
  session,
}: {
  score: CountryScore;
  country?: CountryProfile;
  index?: number;
  onSavePlan?: () => void;
  session?: unknown;
}) {
  return (
    <article className={classNames("route-ticket", `is-${score.status}`)}>
      <div className="route-ticket__rank">{typeof index === "number" ? String(index + 1).padStart(2, "0") : score.totalScore}</div>
      <div className="route-ticket__main">
        <div className="route-ticket__meta">
          <span>{countryLabel(score)} / {score.visaFit}</span>
          <strong>{score.totalScore}/100</strong>
        </div>
        <h2>{score.name}</h2>
        <p>{score.nextAction}</p>
        <SalaryCard score={score} country={country} />
      </div>
      <aside className="route-ticket__side">
        <ProbabilityBadge score={score} />
        <div className="gate-stack">
          <span>{score.visaLabel}</span>
          <span>{score.timeToFirstPay.lowWeeks}-{score.timeToFirstPay.highWeeks} semaines</span>
          <span>{currency(score.entryCost.low, score.entryCost.currency)}-{currency(score.entryCost.high, score.entryCost.currency)} entrée</span>
        </div>
        <div className="micro-proof">
          {score.whyRecommended.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="route-ticket__actions">
          <Link className="button" href={`/country/${score.slug}/`}>Ouvrir</Link>
          {country && onSavePlan && <button className="button ghost" onClick={onSavePlan}>{session ? "Save plan" : "Login + save"}</button>}
        </div>
      </aside>
    </article>
  );
}

export function CompactTrajectoryCard({ score, index }: { score: CountryScore; index: number }) {
  return (
    <Link className={classNames("rank-row", `is-${score.status}`)} href={`/country/${score.slug}/`}>
      <span>{String(index + 1).padStart(2, "0")}</span>
      <strong>{score.name}</strong>
      <em>{currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)}</em>
      <small>{score.totalScore}/100</small>
    </Link>
  );
}

export function ProofOfPossibilityCard({ score }: { score: CountryScore }) {
  return (
    <aside className="intel-card">
      <span className="system-kicker">Proof layer</span>
      <h2>Le gros chiffre n'est jamais la promesse.</h2>
      <div className="intel-card__tiers">
        <CertaintyBadge tier="certain" />
        <CertaintyBadge tier="probable" />
        <CertaintyBadge tier="verify" />
      </div>
      <ProbabilityBadge score={score} />
      <div className="intel-grid">
        <div><span>Access</span><strong>{score.accessScore}</strong></div>
        <div><span>Cash</span><strong>{score.cashScore}</strong></div>
        <div><span>Speed</span><strong>{score.speedScore}</strong></div>
        <div><span>Fit</span><strong>{score.fitScore}</strong></div>
      </div>
      <p>Stable, High, Max vérifié, probabilité, conditions et risques restent séparés pour tuer les faux raccourcis.</p>
    </aside>
  );
}

export function ActionPlanPreview({ score }: { score: CountryScore }) {
  return (
    <article className="mission-timeline">
      <span className="system-kicker">Plan 7/30/90</span>
      <h3>{score.name}</h3>
      <ol>
        <li><strong>7j</strong><span>Vérifier gate officielle: {score.visaLabel}</span></li>
        <li><strong>30j</strong><span>Tester le marché avant achat cher.</span></li>
        <li><strong>90j</strong><span>Premier job, pivot ou kill condition.</span></li>
      </ol>
    </article>
  );
}
