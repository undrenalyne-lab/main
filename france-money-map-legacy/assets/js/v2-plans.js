import { nowIso, upsertPlan } from "./v2-profile.js";

function firstCashPath(country) {
  return (country.cashPaths || [])[0] || {};
}

function task(title, description, category, sourceIds = []) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    category,
    status: "todo",
    sourceIds,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function generateActionPlan(profile, country, score) {
  const path = firstCashPath(country);
  const sourceIds = Array.from(new Set([...(country.sourceIds || []), ...(score.sourceIds || [])]));
  const title = `Plan ${country.name} - ${profile.identity.firstName || "profil"} ${profile.identity.ageExact} ans`;

  const phases = [
    {
      label: "7 jours",
      tasks: [
        task("Verifier la source officielle visa / droit au travail", "Ne paie aucun ticket avant ce checkpoint.", "visa", sourceIds),
        task("Lister les 30 premiers employeurs ou agences", "Priorite: boites qui recrutent le role cible, pas annuaires generiques.", "prospection"),
        task("Faire un budget d'entree reel", `Cout estime: ${score.entryCost.low}-${score.entryCost.high} ${score.entryCost.currency}.`, "budget"),
      ],
    },
    {
      label: "30 jours",
      tasks: [
        task("Preparer CV et preuves vendables", "Adapte le CV au pays, role cible, rythme et contraintes.", "profile"),
        task("Valider le premier gate payant", `Gate: ${(path.requiredTickets || ["premier ticket utile"])[0]}.`, "ticket", sourceIds),
        task("Contacter recruteurs avant achat lourd", "But: verifier que le ticket achete correspond a une porte recruteur visible.", "prospection"),
      ],
    },
    {
      label: "90 jours",
      tasks: [
        task("Obtenir premiere fiche ou promesse concrete", `Fenetre estimee: ${score.timeToFirstPay.lowWeeks}-${score.timeToFirstPay.highWeeks} semaines.`, "execution"),
        task("Optimiser roster / nuits / deplacements / overtime", "Le cash vient du package complet, pas seulement du titre de poste.", "cash"),
        task("Decider pivot ou kill condition", "Si les gates bloquent, bascule vers le pays ou route #2 avant de cramer le budget.", "risk"),
      ],
    },
  ];

  return {
    id: crypto.randomUUID(),
    userId: null,
    profileId: profile.id,
    countryId: country.id,
    title,
    verdict:
      score.status === "green"
        ? "Route prioritaire: executable si tu verifies les gates avant depense."
        : score.status === "orange"
          ? "Route conditionnelle: potentiel reel, mais les bloqueurs doivent etre leves dans l'ordre."
          : "Route dangereuse ou bloquee: a comparer avant execution.",
    phases,
    killConditions: [
      "Visa ou droit au travail impossible",
      "Cout d'entree superieur au budget tampon",
      "Aucun recruteur ne confirme le gate apres 30 contacts",
      "Fourchette cash incompatible avec ton minimum acceptable",
    ],
    budget: [
      { label: "Cout d'entree bas", amount: score.entryCost.low, currency: score.entryCost.currency },
      { label: "Cout d'entree haut", amount: score.entryCost.high, currency: score.entryCost.currency },
      { label: "Burn mensuel utilisateur", amount: profile.money.monthlyBurn, currency: profile.money.currency },
    ],
    sourceIds,
    progress: 0,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function saveGeneratedPlan(profile, country, score) {
  return upsertPlan(generateActionPlan(profile, country, score));
}

export function planProgress(plan) {
  const tasks = (plan.phases || []).flatMap((phase) => phase.tasks || []);
  if (!tasks.length) {
    return 0;
  }
  return Math.round((tasks.filter((taskItem) => taskItem.status === "done").length / tasks.length) * 100);
}

export function toggleTask(plan, taskId) {
  const next = {
    ...plan,
    phases: (plan.phases || []).map((phase) => ({
      ...phase,
      tasks: (phase.tasks || []).map((taskItem) =>
        taskItem.id === taskId
          ? {
              ...taskItem,
              status: taskItem.status === "done" ? "todo" : "done",
              updatedAt: nowIso(),
            }
          : taskItem,
      ),
    })),
    updatedAt: nowIso(),
  };
  next.progress = planProgress(next);
  return upsertPlan(next);
}
