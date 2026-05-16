"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { countries, countryMap, getCountryBySlug, rules, sourceMap, worldFeatures } from "@/lib/data";
import { appPath, classNames, currency, percent } from "@/lib/format";
import { generateActionPlan, togglePlanTask } from "@/lib/plans";
import {
  clearLocalProductData,
  demoProfiles,
  hasPendingSync,
  loadPlans,
  loadProfile,
  markPendingSync,
  optionLabels,
  saveProfile,
  upsertLocalPlan,
} from "@/lib/profile";
import { scoreCountries, scoreCountry } from "@/lib/scoring";
import {
  deleteCloudData,
  getSession,
  loadCloudData,
  savePlanToCloud,
  saveProfileToCloud,
  signInWithGoogle,
  signOut,
  supabaseConfigured,
  syncGuestDataToCloud,
} from "@/lib/supabase";
import type { ActionPlan, CountryProfile, CountryScore, UserProfile, WorldFeature } from "@/lib/types";

type Screen = "home" | "onboarding" | "dashboard" | "map" | "compare" | "country" | "plans" | "account" | "login" | "callback";

export function AtlasApp({ screen, countrySlug }: { screen: Screen; countrySlug?: string }) {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [plans, setPlans] = useState<ActionPlan[]>(() => loadPlans());
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const scores = useMemo(() => scoreCountries(profile, countries, rules), [profile]);
  const top = scores.slice(0, 3);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then(async (nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        if (nextSession) {
          if (hasPendingSync()) await syncGuestDataToCloud(nextSession);
          await loadCloudData(nextSession);
          if (!mounted) return;
          setProfile(loadProfile());
          setPlans(loadPlans());
          if (screen === "callback") window.location.href = appPath("/dashboard/");
        }
      })
      .catch((error: Error) => setStatus(error.message));
    return () => {
      mounted = false;
    };
  }, [screen]);

  function persistProfile(nextProfile: UserProfile) {
    const saved = saveProfile(nextProfile);
    setProfile(saved);
    if (session) {
      startTransition(async () => {
        await saveProfileToCloud(session, saved);
        setStatus("Profil sauvegardé dans Supabase.");
      });
    }
  }

  async function savePlan(country: CountryProfile, score: CountryScore) {
    const plan = generateActionPlan(profile, country, score);
    const saved = upsertLocalPlan(plan);
    setPlans(loadPlans());
    if (!session) {
      markPendingSync();
      setStatus("Plan sauvegardé localement. Connecte-toi pour le retrouver sur tous tes appareils.");
      window.location.href = appPath("/login/");
      return;
    }
    await savePlanToCloud(session, saved);
    setStatus("Plan sauvegardé dans Supabase.");
  }

  async function toggleTask(plan: ActionPlan, taskId: string) {
    const next = togglePlanTask(plan, taskId);
    upsertLocalPlan(next);
    setPlans(loadPlans());
    if (session) await savePlanToCloud(session, next);
  }

  async function handleGoogleLogin() {
    markPendingSync();
    await signInWithGoogle();
  }

  if (screen === "home") return <Home scores={scores} session={session} />;
  if (screen === "onboarding") return <Onboarding profile={profile} scores={scores} onSave={persistProfile} />;
  if (screen === "dashboard") return <Dashboard profile={profile} scores={scores} plans={plans} session={session} status={status} onSavePlan={savePlan} />;
  if (screen === "map") return <MapScreen scores={scores} />;
  if (screen === "compare") return <Compare scores={scores} />;
  if (screen === "country") return <CountryDetail profile={profile} slug={countrySlug} session={session} onSavePlan={savePlan} />;
  if (screen === "plans") return <PlansScreen plans={plans} session={session} onToggleTask={toggleTask} />;
  if (screen === "login") return <Login status={status} isPending={isPending} onGoogleLogin={handleGoogleLogin} />;
  if (screen === "callback") return <Callback />;
  return (
    <Account
      session={session}
      profile={profile}
      plans={plans}
      status={status}
      onGoogleLogin={handleGoogleLogin}
      onLogout={async () => {
        await signOut();
        setSession(null);
        setStatus("Session fermée.");
      }}
      onDelete={async () => {
        if (session) await deleteCloudData(session);
        clearLocalProductData();
        setProfile(loadProfile());
        setPlans([]);
        setStatus("Données locales et cloud supprimées.");
      }}
    />
  );
}

function Hero({ kicker, title, copy, children }: { kicker: string; title: string; copy: string; children?: React.ReactNode }) {
  return (
    <section className="hero">
      <span className="eyebrow">{kicker}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
      {children}
    </section>
  );
}

function Home({ scores, session }: { scores: CountryScore[]; session: Session | null }) {
  return (
    <main className="shell page-stack">
      <Hero
        kicker="Backchannel Atlas · V2"
        title="Trouve le pays où ton profil peut vraiment faire du cash."
        copy="Âge, passeport, anglais, capital, compétences. Le moteur trie les pays, bloque les fantasmes et sort un plan."
      >
        <div className="button-row">
          <Link className="button primary" href="/onboarding/">Créer mon profil</Link>
          <Link className="button" href="/dashboard/">Voir mon dashboard</Link>
          <Link className="button" href="/map/">Ouvrir la carte</Link>
        </div>
      </Hero>
      <section className="grid-3">
        {scores.slice(0, 3).map((score) => (
          <CountryCard key={score.countryId} score={score} />
        ))}
      </section>
      <section className="panel split">
        <div>
          <span className="eyebrow">Compte</span>
          <h2>{session ? "Session active. Plans persistants." : "Teste sans compte. Sauvegarde après verdict."}</h2>
          <p>Le login arrive au moment utile: quand tu veux retrouver ton profil et tes plans sur un autre appareil.</p>
        </div>
        <WorldMini scores={scores} />
      </section>
    </main>
  );
}

function Onboarding({ profile, scores, onSave }: { profile: UserProfile; scores: CountryScore[]; onSave: (profile: UserProfile) => void }) {
  const [draft, setDraft] = useState(profile);
  const update = (patch: Partial<UserProfile>) => setDraft((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  const top = scoreCountries(draft, countries, rules).slice(0, 3);
  return (
    <main className="shell page-stack">
      <Hero kicker="Step 1 · Profil" title="Crée ton profil. Le moteur trie." copy="Moins de 90 secondes: âge exact, passeport, anglais, cash, mobilité, signaux vendables." />
      <section className="app-grid">
        <form
          className="panel wizard"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft);
            window.location.href = appPath("/dashboard/");
          }}
        >
          <Field label="Prénom" value={draft.identity.firstName || ""} onChange={(value) => update({ identity: { ...draft.identity, firstName: value } })} />
          <Field label="Âge exact" type="number" value={draft.identity.ageExact} onChange={(value) => update({ identity: { ...draft.identity, ageExact: Number(value) } })} />
          <Select label="Anglais" value={draft.skills.englishLevel} options={optionLabels.englishLevel} onChange={(value) => update({ skills: { ...draft.skills, englishLevel: value as UserProfile["skills"]["englishLevel"] } })} />
          <Field label="Capital disponible" type="number" value={draft.money.availableCash} onChange={(value) => update({ money: { ...draft.money, availableCash: Number(value) } })} />
          <Field label="Objectif mensuel" type="number" value={draft.money.targetMonthlyNet} onChange={(value) => update({ money: { ...draft.money, targetMonthlyNet: Number(value) } })} />
          <Select label="Priorité" value={draft.preferences.priority} options={optionLabels.priority} onChange={(value) => update({ preferences: { ...draft.preferences, priority: value as UserProfile["preferences"]["priority"] } })} />
          <div className="chip-cloud">
            {["terrain", "elec", "meca", "rail", "hauteur", "logistique", "nuclear", "automation", "cvc"].map((tag) => (
              <button
                className={classNames("chip", draft.skills.experienceTags.includes(tag) && "active")}
                type="button"
                key={tag}
                onClick={() => {
                  const tags = new Set(draft.skills.experienceTags);
                  if (tags.has(tag)) tags.delete(tag);
                  else tags.add(tag);
                  update({ skills: { ...draft.skills, experienceTags: Array.from(tags) } });
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="button-row">
            <button className="button primary" type="submit">Calculer mon Top 3</button>
            <button className="button" type="button" onClick={() => setDraft(demoProfiles.kevin32)}>Démo 32</button>
            <button className="button" type="button" onClick={() => setDraft(demoProfiles.kevin37)}>Démo 37</button>
          </div>
        </form>
        <aside className="panel sticky">
          <span className="eyebrow">Preview live</span>
          <h2>Top 3 actuel</h2>
          <ProfileSummary profile={draft} />
          <div className="mini-stack">
            {top.map((score, index) => (
              <Link className="mini-row" href={`/country/${score.slug}/`} key={score.countryId}>
                <span>{index + 1}</span>
                <strong>{score.name}</strong>
                <em>{score.totalScore}/100</em>
              </Link>
            ))}
          </div>
        </aside>
      </section>
      <p className="sr-only">Scores initiaux disponibles: {scores.map((score) => score.name).join(", ")}</p>
    </main>
  );
}

function Dashboard({
  profile,
  scores,
  plans,
  session,
  status,
  onSavePlan,
}: {
  profile: UserProfile;
  scores: CountryScore[];
  plans: ActionPlan[];
  session: Session | null;
  status: string;
  onSavePlan: (country: CountryProfile, score: CountryScore) => Promise<void>;
}) {
  return (
    <main className="shell page-stack">
      <Hero kicker="Dashboard" title="Ton verdict personnalisé." copy="Pas un classement général: âge, visa, cash, vitesse, fit et risques sont pondérés." />
      <section className="panel command">
        <ProfileSummary profile={profile} />
        <div className="button-row">
          <Link className="button primary" href="/onboarding/">Modifier le profil</Link>
          <Link className="button" href="/compare/">Comparer</Link>
          <Link className="button" href="/plans/">Plans ({plans.length})</Link>
        </div>
      </section>
      {status && <div className="notice">{status}</div>}
      <section className="grid-3">
        {scores.slice(0, 3).map((score) => {
          const country = countryMap.get(score.countryId)!;
          return <CountryCard key={score.countryId} score={score} country={country} onSavePlan={() => onSavePlan(country, score)} session={session} />;
        })}
      </section>
    </main>
  );
}

function MapScreen({ scores }: { scores: CountryScore[] }) {
  return (
    <main className="shell page-stack">
      <Hero kicker="Carte score" title="Clique un pays. Ouvre le plan." copy="Vert = exécutable. Orange = prérequis. Rouge = mauvais fit. Gris = pas assez documenté." />
      <WorldMap scores={scores} />
      <section className="grid-3">
        {scores.slice(0, 3).map((score) => <CountryCard key={score.countryId} score={score} />)}
      </section>
    </main>
  );
}

function Compare({ scores }: { scores: CountryScore[] }) {
  return (
    <main className="shell page-stack">
      <Hero kicker="Comparer" title="Pays, gates, cash, délai." copy="La bonne route n'est pas toujours celle qui affiche le plus gros upside." />
      <div className="table-scroll panel">
        <table>
          <thead>
            <tr>
              <th>Pays</th><th>Score</th><th>Visa</th><th>Stable</th><th>Upside</th><th>Coût</th><th>Paie</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => (
              <tr key={score.countryId}>
                <td><Link href={`/country/${score.slug}/`}>{score.name}</Link></td>
                <td>{score.totalScore}/100</td>
                <td>{score.visaFit} · {score.ageGate}</td>
                <td>{currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)}</td>
                <td>{currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)}</td>
                <td>{currency(score.entryCost.low, score.entryCost.currency)}-{currency(score.entryCost.high, score.entryCost.currency)}</td>
                <td>{score.timeToFirstPay.lowWeeks}-{score.timeToFirstPay.highWeeks} sem.</td>
                <td>{score.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function CountryDetail({ profile, slug, session, onSavePlan }: { profile: UserProfile; slug?: string; session: Session | null; onSavePlan: (country: CountryProfile, score: CountryScore) => Promise<void> }) {
  const country = getCountryBySlug(slug);
  const score = scoreCountry(profile, country, rules);
  return (
    <main className="shell page-stack">
      <Hero kicker={`${country.status} · ${score.visaLabel}`} title={`${country.name}: verdict ${score.totalScore}/100`} copy={country.summary}>
        <div className="button-row">
          <button className="button primary" onClick={() => onSavePlan(country, score)}>Sauvegarder le plan</button>
          {!session && <Link className="button" href="/login/">Login Google</Link>}
        </div>
      </Hero>
      <section className="grid-3">
        <Metric label="Cash stable" value={currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)} note={score.realisticMonthlyRange.netOrGross} />
        <Metric label="Upside" value={currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)} note="plausible, pas promis" />
        <Metric label="Première paie" value={`${score.timeToFirstPay.lowWeeks}-${score.timeToFirstPay.highWeeks} sem.`} note="selon gates" />
      </section>
      <section className="grid-2">
        <ListPanel title="Pourquoi oui" items={score.whyRecommended} />
        <ListPanel title="Pourquoi dangereux" items={score.whyDangerous} />
      </section>
      <section className="panel">
        <span className="eyebrow">Cash paths</span>
        <div className="grid-2">
          {country.cashPaths.map((path) => (
            <article className="card" key={path.id}>
              <h3>{path.title}</h3>
              <div className="cash-strip">
                <Metric label="Bas" value={currency(path.monthlyRangeLow, country.currency)} />
                <Metric label="Stable" value={currency(path.monthlyRangeStable, country.currency)} />
                <Metric label="Upside" value={currency(path.monthlyRangeUpside, country.currency)} />
              </div>
              <p>Rôles: {path.targetRoles.join(", ")}</p>
              <div className="warning"><strong>Ne pas acheter trop tôt:</strong> {path.doNotBuyYet.join(", ")}</div>
            </article>
          ))}
        </div>
      </section>
      <SourceBadges ids={score.sourceIds} />
    </main>
  );
}

function PlansScreen({ plans, session, onToggleTask }: { plans: ActionPlan[]; session: Session | null; onToggleTask: (plan: ActionPlan, taskId: string) => Promise<void> }) {
  return (
    <main className="shell page-stack">
      <Hero kicker="Plans" title="Tes missions sauvegardées." copy={session ? "Plans liés au compte Google." : "Plans locaux. Connecte-toi pour synchroniser."} />
      {!plans.length && <Empty title="Aucun plan" copy="Génère un plan depuis le dashboard ou une fiche pays." cta={<Link className="button primary" href="/dashboard/">Ouvrir dashboard</Link>} />}
      {plans.map((plan) => (
        <article className="panel" key={plan.id}>
          <div className="split">
            <div>
              <span className="eyebrow">{plan.countryId} · {percent(plan.progress)}</span>
              <h2>{plan.title}</h2>
              <p>{plan.verdict}</p>
            </div>
            <div className="score-ring">{plan.progress}%</div>
          </div>
          <div className="grid-3">
            {plan.phases.map((phase) => (
              <section className="card" key={phase.label}>
                <h3>{phase.label}</h3>
                {phase.tasks.map((task) => (
                  <label className="task" key={task.id}>
                    <input type="checkbox" checked={task.status === "done"} onChange={() => onToggleTask(plan, task.id)} />
                    <span><strong>{task.title}</strong><em>{task.description}</em></span>
                  </label>
                ))}
              </section>
            ))}
          </div>
        </article>
      ))}
    </main>
  );
}

function Login({ status, isPending, onGoogleLogin }: { status: string; isPending: boolean; onGoogleLogin: () => Promise<void> }) {
  return (
    <main className="shell page-stack">
      <Hero kicker="Login" title="Sauvegarde ton atlas." copy="Google login via Supabase. Pas de mot de passe maison, pas de secret dans le repo." />
      <section className="panel">
        {!supabaseConfigured() && <div className="warning">Supabase n'est pas encore configuré. Ajoute les variables publiques dans GitHub Pages build env.</div>}
        {status && <div className="notice">{status}</div>}
        <button className="button primary" disabled={!supabaseConfigured() || isPending} onClick={() => onGoogleLogin()}>
          Continuer avec Google
        </button>
      </section>
    </main>
  );
}

function Callback() {
  return (
    <main className="shell page-stack">
      <Hero kicker="Auth callback" title="Connexion en cours." copy="Si la redirection bloque, retourne au dashboard." />
      <Link className="button primary" href="/dashboard/">Ouvrir dashboard</Link>
    </main>
  );
}

function Account({
  session,
  profile,
  plans,
  status,
  onGoogleLogin,
  onLogout,
  onDelete,
}: {
  session: Session | null;
  profile: UserProfile;
  plans: ActionPlan[];
  status: string;
  onGoogleLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const exportValue = JSON.stringify({ profile, plans, session: session ? { userId: session.user.id, email: session.user.email } : null }, null, 2);
  return (
    <main className="shell page-stack">
      <Hero kicker="Compte" title={session ? "Compte connecté." : "Compte local."} copy="Export, synchronisation Supabase, suppression des données produit." />
      <section className="panel">
        {status && <div className="notice">{status}</div>}
        <ProfileSummary profile={profile} />
        <div className="button-row">
          {!session && <button className="button primary" onClick={() => onGoogleLogin()}>Login Google</button>}
          {session && <button className="button" onClick={() => onLogout()}>Logout</button>}
          <button className="button danger" onClick={() => onDelete()}>Supprimer données</button>
        </div>
        <textarea className="export-box" readOnly value={exportValue} />
      </section>
    </main>
  );
}

function CountryCard({ score, country = countryMap.get(score.countryId), onSavePlan, session }: { score: CountryScore; country?: CountryProfile; onSavePlan?: () => void; session?: Session | null }) {
  return (
    <article className={classNames("country-card", `is-${score.status}`)}>
      <div className="country-head">
        <span className="eyebrow">{score.status}</span>
        <strong>{score.totalScore}/100</strong>
      </div>
      <h2>{score.name}</h2>
      <div className="cash-strip">
        <Metric label="Bas" value={currency(score.realisticMonthlyRange.low, score.realisticMonthlyRange.currency)} />
        <Metric label="Stable" value={currency(score.realisticMonthlyRange.stable, score.realisticMonthlyRange.currency)} />
        <Metric label="Upside" value={currency(score.realisticMonthlyRange.upside, score.realisticMonthlyRange.currency)} />
      </div>
      <p>{score.nextAction}</p>
      <div className="pill-row">
        <span>{score.visaFit}</span>
        <span>{score.timeToFirstPay.lowWeeks}-{score.timeToFirstPay.highWeeks} sem.</span>
        <span>{currency(score.entryCost.low, score.entryCost.currency)}+</span>
      </div>
      <div className="button-row">
        <Link className="button" href={`/country/${score.slug}/`}>Voir pays</Link>
        {country && onSavePlan && <button className="button primary" onClick={onSavePlan}>{session ? "Sauvegarder" : "Login + save"}</button>}
      </div>
    </article>
  );
}

function ProfileSummary({ profile }: { profile: UserProfile }) {
  return (
    <div className="profile-summary">
      <span>{profile.identity.ageExact} ans</span>
      <span>Passeport {profile.identity.passportCountry}</span>
      <span>Anglais {optionLabels.englishLevel[profile.skills.englishLevel]}</span>
      <span>Objectif {currency(profile.money.targetMonthlyNet, profile.money.currency)}</span>
      <span>{profile.skills.experienceTags.join(", ") || "aucun signal"}</span>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <em>{note}</em>}
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="panel">
      <span className="eyebrow">{title}</span>
      <div className="list">
        {items.map((item, index) => (
          <div className="list-item" key={item}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SourceBadges({ ids }: { ids: string[] }) {
  return (
    <section className="panel">
      <span className="eyebrow">Sources</span>
      <div className="source-row">
        {ids.map((id) => {
          const source = sourceMap.get(id);
          if (!source) return null;
          return (
            <a className="source-badge" href={source.url} target="_blank" rel="noreferrer" key={id}>
              {source.type} · {source.confidence} · {source.lastChecked}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {Object.entries(options).map(([key, labelValue]) => (
          <option value={key} key={key}>{labelValue}</option>
        ))}
      </select>
    </label>
  );
}

function Empty({ title, copy, cta }: { title: string; copy: string; cta: React.ReactNode }) {
  return (
    <section className="panel empty">
      <h2>{title}</h2>
      <p>{copy}</p>
      {cta}
    </section>
  );
}

function WorldMini({ scores }: { scores: CountryScore[] }) {
  return (
    <div className="mini-stack">
      {scores.slice(0, 4).map((score) => (
        <Link className="mini-row" href={`/country/${score.slug}/`} key={score.countryId}>
          <strong>{score.name}</strong>
          <em>{score.totalScore}/100</em>
        </Link>
      ))}
    </div>
  );
}

const worldWidth = 1200;
const worldHeight = 620;
const pinNudges: Record<string, { x: number; y: number }> = {
  france: { x: -2.8, y: 7.2 },
  germany: { x: 5.2, y: -1.5 },
  switzerland: { x: 6.4, y: 6.4 },
  uae: { x: 3.2, y: 1.8 },
  canada: { x: -1.2, y: 1.4 },
  australia: { x: -18, y: -2.4 },
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

function WorldMap({ scores }: { scores: CountryScore[] }) {
  const scoreByCountry = new Map(scores.map((score) => [score.countryId, score]));
  const countryByIso = new Map(countries.map((country) => [country.iso3, country]));
  return (
    <section className="map-board" role="img" aria-label="Carte mondiale personnalisée des pays documentés">
      <svg className="world-svg" viewBox={`0 0 ${worldWidth} ${worldHeight}`} aria-hidden="true" focusable="false">
        <g className="world-grid">
          <path d={`M0 ${worldHeight * 0.25}H${worldWidth}M0 ${worldHeight * 0.5}H${worldWidth}M0 ${worldHeight * 0.75}H${worldWidth}`} />
          <path d={`M${worldWidth * 0.25} 0V${worldHeight}M${worldWidth * 0.5} 0V${worldHeight}M${worldWidth * 0.75} 0V${worldHeight}`} />
        </g>
        <g>
          {worldFeatures.map((feature, index) => {
            const country = countryByIso.get(feature.properties?.iso3 || "");
            const score = country ? scoreByCountry.get(country.id) : null;
            return <path className={classNames("world-country", country && "documented", score && `score-${score.status}`)} d={geometryPath(feature)} key={`${feature.properties?.iso3 || index}`} />;
          })}
        </g>
      </svg>
      {countries.map((country) => {
        const score = scoreByCountry.get(country.id)!;
        const position = pinPosition(country);
        return (
          <Link className={classNames("map-node", `is-${score.status}`)} href={`/country/${country.slug}/`} style={{ left: `${position.x}%`, top: `${position.y}%` }} key={country.id}>
            <strong>{country.name}</strong>
            <span>{score.totalScore}/100</span>
          </Link>
        );
      })}
    </section>
  );
}
