"use client";

import type { ActionPlan, CountryProfile, CountryScore, PlanTask, UserProfile } from "./types";

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  return crypto.randomUUID();
}

function task(title: string, description: string, category: string, sourceIds: string[] = []): PlanTask {
  return {
    id: uuid(),
    title,
    description,
    category,
    status: "todo",
    sourceIds,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function planProgress(plan: ActionPlan) {
  const tasks = plan.phases.flatMap((phase) => phase.tasks);
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((item) => item.status === "done").length / tasks.length) * 100);
}

export function generateActionPlan(profile: UserProfile, country: CountryProfile, score: CountryScore): ActionPlan {
  const path = country.cashPaths[0];
  const sourceIds = Array.from(new Set([...(country.sourceIds || []), ...(score.sourceIds || [])]));
  const title = `Plan ${country.name} - ${profile.identity.firstName || "profil"} ${profile.identity.ageExact} ans`;

  return {
    id: uuid(),
    userId: profile.userId,
    profileId: profile.id,
    countryId: country.id,
    title,
    verdict:
      score.status === "green"
        ? "Route prioritaire: exécutable si tu vérifies les gates avant dépense."
        : score.status === "orange"
          ? "Route conditionnelle: potentiel réel, mais les bloqueurs doivent être levés dans l'ordre."
          : "Route dangereuse ou bloquée: à comparer avant exécution.",
    phases: [
      {
        label: "7 jours",
        tasks: [
          task("Vérifier la source officielle visa / droit au travail", "Ne paie aucun ticket avant ce checkpoint.", "visa", sourceIds),
          task("Lister les 30 premiers employeurs ou agences", "Priorité: boîtes qui recrutent le rôle cible, pas annuaires génériques.", "prospection"),
          task("Faire un budget d'entrée réel", `Coût estimé: ${score.entryCost.low}-${score.entryCost.high} ${score.entryCost.currency}.`, "budget"),
        ],
      },
      {
        label: "30 jours",
        tasks: [
          task("Préparer CV et preuves vendables", "Adapte le CV au pays, rôle cible, rythme et contraintes.", "profile"),
          task("Valider le premier gate payant", `Gate: ${(path?.requiredTickets || ["premier ticket utile"])[0]}.`, "ticket", sourceIds),
          task("Contacter recruteurs avant achat lourd", "But: vérifier que le ticket acheté correspond à une porte recruteur visible.", "prospection"),
        ],
      },
      {
        label: "90 jours",
        tasks: [
          task("Obtenir première fiche ou promesse concrète", `Fenêtre estimée: ${score.timeToFirstPay.lowWeeks}-${score.timeToFirstPay.highWeeks} semaines.`, "execution"),
          task("Optimiser roster / nuits / déplacements / overtime", "Le cash vient du package complet, pas seulement du titre de poste.", "cash"),
          task("Décider pivot ou kill condition", "Si les gates bloquent, bascule vers le pays ou route #2 avant de cramer le budget.", "risk"),
        ],
      },
    ],
    killConditions: [
      "Visa ou droit au travail impossible",
      "Coût d'entrée supérieur au budget tampon",
      "Aucun recruteur ne confirme le gate après 30 contacts",
      "Fourchette cash incompatible avec ton minimum acceptable",
    ],
    budget: [
      { label: "Coût d'entrée bas", amount: score.entryCost.low, currency: score.entryCost.currency },
      { label: "Coût d'entrée haut", amount: score.entryCost.high, currency: score.entryCost.currency },
      { label: "Burn mensuel utilisateur", amount: profile.money.monthlyBurn, currency: profile.money.currency },
    ],
    sourceIds,
    progress: 0,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function togglePlanTask(plan: ActionPlan, taskId: string): ActionPlan {
  const next: ActionPlan = {
    ...plan,
    phases: plan.phases.map((phase) => ({
      ...phase,
      tasks: phase.tasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: item.status === "done" ? "todo" : "done",
              updatedAt: nowIso(),
            }
          : item,
      ),
    })),
    updatedAt: nowIso(),
  };
  next.progress = planProgress(next);
  return next;
}
