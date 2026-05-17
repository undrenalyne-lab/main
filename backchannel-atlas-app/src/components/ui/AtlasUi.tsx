"use client";

import Link from "next/link";
import { countries, countryMap, worldFeatures } from "@/lib/data";
import { appPath, classNames, currency } from "@/lib/format";
import { optionLabels } from "@/lib/profile";
import type { CountryProfile, CountryScore, UserProfile, WorldFeature } from "@/lib/types";

const worldWidth = 1200;
const worldHeight = 620;

const pinNudges: Record<string, { x: number; y: number }> = {
  france: { x: -8, y: -4.2 },
  germany: { x: 8.6, y: -11 },
  switzerland: { x: 10, y: 5.2 },
  uae: { x: 3.2, y: 1.8 },
  canada: { x: -1.2, y: 1.4 },
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
    x: Math.max(6, Math.min(94, (projected.x / worldWidth) * 100 + nudge.x)),
    y: Math.max(8, Math.min(92, (projected.y / worldHeight) * 100 + nudge.y)),
  };
}

function countryLabel(score: CountryScore) {
  if (score.status === "green") return "Accessible";
  if (score.status === "orange") return "Prerequis";
  if (score.status === "red") return "Mauvais fit";
  return "Non documente";
}

export function WorldMapCanvas({ scores, mode = "standard" }: { scores: CountryScore[]; mode?: "standard" | "hero" }) {
  const scoreByCountry = new Map(scores.map((score) => [score.countryId, score]));
  const countryByIso = new Map(countries.map((country) => [country.iso3, country]));

  return (
    <section className={classNames("map-board", mode === "hero" && "map-board-hero")} aria-label="Carte mondiale personnalisee des pays documentes">
      <svg className="world-svg" viewBox={`0 0 ${worldWidth} ${worldHeight}`} role="img" aria-label="Carte du monde avec pays scorables">
        <g className="world-grid" aria-hidden="true">
          <path d={`M0 ${worldHeight * 0.25}H${worldWidth}M0 ${worldHeight * 0.5}H${worldWidth}M0 ${worldHeight * 0.75}H${worldWidth}`} />
          <path d={`M${worldWidth * 0.25} 0V${worldHeight}M${worldWidth * 0.5} 0V${worldHeight}M${worldWidth * 0.75} 0V${worldHeight}`} />
        </g>
        <g>
          {worldFeatures.map((feature, index) => {
            const country = countryByIso.get(feature.properties?.iso3 || "");
            const score = country ? scoreByCountry.get(country.id) : null;
            const href = country ? appPath(`/country/${country.slug}/`) : "";
            const clickable = Boolean(country && score);
            return (
              <path
                className={classNames("world-country", country && "documented", clickable && "clickable", score && `score-${score.status}`)}
                d={geometryPath(feature)}
                key={`${feature.properties?.iso3 || index}`}
                role={clickable ? "link" : "presentation"}
                tabIndex={clickable ? 0 : -1}
                aria-label={clickable ? `${country!.name}, ${score!.totalScore} sur 100` : undefined}
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
      <div className="map-scanline" aria-hidden="true" />
      {countries.map((country) => {
        const score = scoreByCountry.get(country.id);
        if (!score) return null;
        const position = pinPosition(country);
        return (
          <Link
            className={classNames("map-node", `is-${score.status}`)}
            href={`/country/${country.slug}/`}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            key={country.id}
          >
            <small>{countryLabel(score)}</small>
            <strong>{country.name}</strong>
            <span>{score.totalScore}/100</span>
          </Link>
        );
      })}
    </section>
  );
}

export function WorldMapHero({ scores, session }: { scores: CountryScore[]; session: unknown }) {
  const best = scores[0];
  return (
    <section className="world-hero">
      <div className="world-hero-copy">
        <span className="eyebrow">Backchannel Atlas · global opportunity engine</span>
        <h1>L'atlas des moves cash.</h1>
        <p>
          Age, passeport, langue, cash disponible, tolerance terrain. L'atlas transforme ton profil en routes pays,
          gates visa, cash plausible, preuves et plan d'execution.
        </p>
        <div className="hero-verdict">
          <span>Meilleur move actuel</span>
          <strong>{best?.name || "Profil requis"}</strong>
          <em>{best ? `${best.totalScore}/100 · ${best.visaLabel}` : "Cree ton profil pour scorer la carte"}</em>
        </div>
        <div className="button-row hero-actions">
          <Link className="button primary" href="/onboarding/">Creer mon profil</Link>
          <Link className="button" href="/map/">Explorer la map</Link>
          <Link className="button subtle" href={session ? "/plans/" : "/login/"}>{session ? "Mes plans" : "Sauvegarder plus tard"}</Link>
        </div>
      </div>
      <div className="world-hero-map">
        <WorldMapCanvas scores={scores} mode="hero" />
        <div className="map-legend" aria-label="Legende carte">
          <span><i className="dot green" /> accessible</span>
          <span><i className="dot orange" /> prerequis</span>
          <span><i className="dot red" /> bloque</span>
          <span><i className="dot gray" /> non documente</span>
        </div>
      </div>
    </section>
  );
}

export function ProfileSummaryCard({ profile, compact = false }: { profile: UserProfile; compact?: boolean }) {
  const initials = (profile.identity.firstName || "BA").slice(0, 2).toUpperCase();
  return (
    <article className={classNames("profile-card", compact && "compact")}>
      <div className="avatar-tile" aria-hidden="true">{initials}</div>
      <div>
        <span className="eyebrow">Mission setup</span>
        <h2>{profile.identity.firstName ? `${profile.identity.firstName}, ${profile.identity.ageExact} ans` : `${profile.identity.ageExact} ans · profil invite`}</h2>
        <div className="profile-summary">
          <span>Passeport {profile.identity.passportCountry}</span>
          <span>Pays actuel {profile.identity.currentCountry}</span>
          <span>Anglais {optionLabels.englishLevel[profile.skills.englishLevel]}</span>
          <span>Objectif {currency(profile.money.targetMonthlyNet, profile.money.currency)}/mois</span>
          <span>{profile.skills.experienceTags.join(", ") || "aucun signal vendable"}</span>
        </div>
      </div>
    </article>
  );
}

export function SalaryCard({ score, country }: { score: CountryScore; country?: CountryProfile }) {
  const confidence = country?.confidence || "medium";
  const maxLabel = confidence === "high" ? currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency) : "a sourcer";
  return (
    <div className="salary-card">
      <div className="salary-cell">
        <span>Stable</span>
        <strong>{currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)}</strong>
        <em>{score.realisticMonthlyRange.netOrGross}</em>
      </div>
      <div className="salary-cell high">
        <span>High plausible</span>
        <strong>{currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)}</strong>
        <em>conditions strictes</em>
      </div>
      <div className="salary-cell proof">
        <span>Max verifie</span>
        <strong>{maxLabel}</strong>
        <em>preuve {confidence}</em>
      </div>
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
    <article className={classNames("opportunity-card", `is-${score.status}`)}>
      <div className="opportunity-rank">{typeof index === "number" ? String(index + 1).padStart(2, "0") : score.totalScore}</div>
      <div className="opportunity-main">
        <div className="opportunity-head">
          <span className="eyebrow">{countryLabel(score)} · {score.visaFit}</span>
          <strong>{score.totalScore}/100</strong>
        </div>
        <h2>{score.name}</h2>
        <p>{score.nextAction}</p>
        <SalaryCard score={score} country={country} />
        <div className="gate-row">
          <span>{score.visaLabel}</span>
          <span>{score.timeToFirstPay.lowWeeks}-{score.timeToFirstPay.highWeeks} semaines</span>
          <span>{currency(score.entryCost.low, score.entryCost.currency)}-{currency(score.entryCost.high, score.entryCost.currency)} entree</span>
        </div>
      </div>
      <div className="opportunity-side">
        <div className="proof-chip">
          <span>Probabilite</span>
          <strong>{score.fitScore}% fit</strong>
        </div>
        <div className="mini-list">
          {score.whyRecommended.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="button-row">
          <Link className="button" href={`/country/${score.slug}/`}>Voir pays</Link>
          {country && onSavePlan && <button className="button" onClick={onSavePlan}>{session ? "Sauvegarder" : "Login + save"}</button>}
        </div>
      </div>
    </article>
  );
}

export function ProofOfPossibilityCard({ score }: { score: CountryScore }) {
  return (
    <aside className="proof-panel">
      <span className="eyebrow">Proof of possibility</span>
      <h2>Gros chiffres visibles, mais pas vendus comme une moyenne.</h2>
      <div className="proof-grid">
        <div><span>Access</span><strong>{score.accessScore}/100</strong></div>
        <div><span>Cash</span><strong>{score.cashScore}/100</strong></div>
        <div><span>Speed</span><strong>{score.speedScore}/100</strong></div>
        <div><span>Risk buffer</span><strong>{score.riskScore}/100</strong></div>
      </div>
      <p>Stable, High, Max verifie et probabilite restent separes pour eviter les fantasmes de salaire garanti.</p>
    </aside>
  );
}

export function ActionPlanPreview({ score }: { score: CountryScore }) {
  return (
    <article className="plan-preview">
      <span className="eyebrow">Plan generable</span>
      <h3>{score.name} · 7/30/90 jours</h3>
      <ol>
        <li>Verifier la gate officielle: {score.visaLabel}</li>
        <li>Bloquer le budget entree: {currency(score.entryCost.low, score.entryCost.currency)} minimum.</li>
        <li>Executer avant achat cher: 20 recruteurs, 3 preuves, 1 plan B.</li>
      </ol>
    </article>
  );
}
