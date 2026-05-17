"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { countries, countryMap, getCountryBySlug, rules, sourceMap } from "@/lib/data";
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
  signInWithEmail,
  signInWithGoogle,
  signOut,
  supabaseConfigured,
  syncGuestDataToCloud,
} from "@/lib/supabase";
import type { ActionPlan, CountryProfile, CountryScore, UserProfile } from "@/lib/types";
import {
  ActionPlanPreview,
  OpportunityCard,
  ProfileSummaryCard,
  ProofOfPossibilityCard,
  SalaryCard,
  WorldMapCanvas,
  WorldMapHero,
} from "@/components/ui/AtlasUi";

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
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google login indisponible.";
      setStatus(`${message} Utilise le lien email si Google Cloud n'est pas encore branché.`);
    }
  }

  async function handleEmailLogin(email: string) {
    markPendingSync();
    try {
      await signInWithEmail(email);
      setStatus("Lien envoyé. Ouvre ton email et clique le lien pour synchroniser ton atlas.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email login indisponible.";
      setStatus(message);
    }
  }

  if (screen === "home") return <Home scores={scores} session={session} />;
  if (screen === "onboarding") return <Onboarding profile={profile} scores={scores} onSave={persistProfile} />;
  if (screen === "dashboard") return <Dashboard profile={profile} scores={scores} plans={plans} session={session} status={status} onSavePlan={savePlan} />;
  if (screen === "map") return <MapScreen scores={scores} />;
  if (screen === "compare") return <Compare scores={scores} />;
  if (screen === "country") return <CountryDetail profile={profile} slug={countrySlug} session={session} onSavePlan={savePlan} />;
  if (screen === "plans") return <PlansScreen plans={plans} session={session} onToggleTask={toggleTask} />;
  if (screen === "login") return <Login status={status} isPending={isPending} onGoogleLogin={handleGoogleLogin} onEmailLogin={handleEmailLogin} />;
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
  const best = scores[0];
  return (
    <main className="shell page-stack">
      <WorldMapHero scores={scores} session={session} />
      <section className="mission-strip" aria-label="Promesse produit">
        <div><span>Modele</span><strong>Origin to destination to opportunity to plan</strong></div>
        <div><span>Cash</span><strong>Stable / High / Max verifie</strong></div>
        <div><span>Gates</span><strong>Visa, tickets, langue, budget</strong></div>
        <div><span>Compte</span><strong>{session ? "Cloud actif" : "Guest d'abord, login apres verdict"}</strong></div>
      </section>
      <section className="home-command">
        <div className="home-command-copy">
          <span className="eyebrow">Build narrow data, wide architecture</span>
          <h2>France et Australie ne sont que le premier module. L'atlas est concu pour le monde.</h2>
          <p>
            Chaque pays futur doit entrer par la meme structure: droits, gates, metiers, preuves, probabilite,
            cout d'entree et plan. Pas de pays vendu comme fiable sans source.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/onboarding/">Lancer le mission setup</Link>
            <Link className="button" href="/compare/">Comparer les pays</Link>
          </div>
        </div>
        {best && <ProofOfPossibilityCard score={best} />}
      </section>
      <section className="opportunity-stack" aria-label="Trajectoires recommandees">
        {scores.slice(0, 3).map((score, index) => (
          <OpportunityCard key={score.countryId} score={score} index={index} />
        ))}
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
      <Hero kicker="Mission setup" title="Ton profil n'est pas un formulaire. C'est le calcul du move." copy="Age exact, passeport, anglais, cash, mobilite, signaux vendables. Le scoring change en direct." />
      <section className="app-grid">
        <form
          className="panel wizard mission-wizard"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft);
            window.location.href = appPath("/dashboard/");
          }}
        >
          <div className="wizard-section">
            <span className="wizard-index">01</span>
            <div>
              <h2>Identite utile</h2>
              <div className="field-grid">
                <Field label="Prenom" value={draft.identity.firstName || ""} onChange={(value) => update({ identity: { ...draft.identity, firstName: value } })} />
                <Field label="Age exact" type="number" value={draft.identity.ageExact} onChange={(value) => update({ identity: { ...draft.identity, ageExact: Number(value) } })} />
                <Field label="Passeport" value={draft.identity.passportCountry} onChange={(value) => update({ identity: { ...draft.identity, passportCountry: value.toUpperCase() } })} />
                <Field label="Pays actuel" value={draft.identity.currentCountry} onChange={(value) => update({ identity: { ...draft.identity, currentCountry: value.toUpperCase() } })} />
              </div>
            </div>
          </div>
          <div className="wizard-section">
            <span className="wizard-index">02</span>
            <div>
              <h2>Objectif cash</h2>
              <div className="field-grid">
                <Field label="Capital disponible" type="number" value={draft.money.availableCash} onChange={(value) => update({ money: { ...draft.money, availableCash: Number(value) } })} />
                <Field label="Objectif mensuel" type="number" value={draft.money.targetMonthlyNet} onChange={(value) => update({ money: { ...draft.money, targetMonthlyNet: Number(value) } })} />
                <Select label="Priorite" value={draft.preferences.priority} options={optionLabels.priority} onChange={(value) => update({ preferences: { ...draft.preferences, priority: value as UserProfile["preferences"]["priority"] } })} />
                <Select label="Anglais" value={draft.skills.englishLevel} options={optionLabels.englishLevel} onChange={(value) => update({ skills: { ...draft.skills, englishLevel: value as UserProfile["skills"]["englishLevel"] } })} />
              </div>
            </div>
          </div>
          <div className="wizard-section">
            <span className="wizard-index">03</span>
            <div>
              <h2>Signaux vendables</h2>
              <div className="chip-cloud">
                {["terrain", "elec", "meca", "rail", "hauteur", "logistique", "nuclear", "automation", "cvc", "security", "industrie"].map((tag) => (
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
            </div>
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
          <ProfileSummaryCard profile={draft} compact />
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
  const best = scores[0];
  const bestCountry = best ? countryMap.get(best.countryId) : null;
  return (
    <main className="shell page-stack">
      <Hero kicker="Decision cockpit" title="Ton meilleur move, pas une liste de pays." copy="Le dashboard combine visa, fit, cash, vitesse, cout d'entree et risque. Le verdict doit te dire quoi faire cette semaine." />
      <section className="dashboard-command">
        <ProfileSummaryCard profile={profile} />
        {best && <ActionPlanPreview score={best} />}
        <div className="command-actions">
          <Link className="button primary" href="/onboarding/">Modifier le profil</Link>
          <Link className="button" href="/compare/">Comparer</Link>
          <Link className="button" href="/plans/">Plans ({plans.length})</Link>
        </div>
      </section>
      {status && <div className="notice">{status}</div>}
      {best && bestCountry && (
        <section className="best-move">
          <div>
            <span className="eyebrow">Best move</span>
            <h2>{best.name}: {best.totalScore}/100</h2>
            <p>{best.nextAction}</p>
            <SalaryCard score={best} country={bestCountry} />
          </div>
          <ProofOfPossibilityCard score={best} />
        </section>
      )}
      <section className="opportunity-stack">
        {scores.slice(0, 3).map((score, index) => {
          const country = countryMap.get(score.countryId)!;
          return <OpportunityCard key={score.countryId} score={score} country={country} index={index} onSavePlan={() => onSavePlan(country, score)} session={session} />;
        })}
      </section>
    </main>
  );
}

function MapScreen({ scores }: { scores: CountryScore[] }) {
  return (
    <main className="shell page-stack">
      <Hero kicker="World atlas" title="Clique un pays. Ouvre le verdict." copy="Vert = executable. Orange = prerequis. Rouge = mauvais fit. Gris = pas encore documente. La carte est une interface de decision." />
      <WorldMapCanvas scores={scores} />
      <section className="opportunity-stack compact-stack">
        {scores.slice(0, 3).map((score, index) => <OpportunityCard key={score.countryId} score={score} index={index} />)}
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

function Login({
  status,
  isPending,
  onGoogleLogin,
  onEmailLogin,
}: {
  status: string;
  isPending: boolean;
  onGoogleLogin: () => Promise<void>;
  onEmailLogin: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");

  return (
    <main className="shell page-stack">
      <Hero kicker="Login" title="Sauvegarde ton atlas." copy="Google login via Supabase. Pas de mot de passe maison, pas de secret dans le repo." />
      <section className="panel">
        {!supabaseConfigured() && <div className="warning">Supabase n'est pas encore configuré. Ajoute les variables publiques dans GitHub Pages build env.</div>}
        {status && <div className="notice">{status}</div>}
        <button className="button primary" disabled={!supabaseConfigured() || isPending} onClick={() => onGoogleLogin()}>
          Continuer avec Google
        </button>
        <div className="login-divider">ou</div>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!email.trim()) return;
            void onEmailLogin(email.trim());
          }}
        >
          <label className="field">
            <span>Email magic link</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="toi@email.com"
              disabled={!supabaseConfigured() || isPending}
              required
            />
          </label>
          <button className="button ghost" disabled={!supabaseConfigured() || isPending || !email.trim()}>
            Envoyer le lien
          </button>
        </form>
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
