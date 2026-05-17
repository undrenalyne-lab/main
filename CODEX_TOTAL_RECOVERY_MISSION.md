# Backchannel Atlas - Total Recovery Mission

## Mission

Reprendre Backchannel Atlas depuis l'etat actuel sans casser l'infra Supabase/Auth deja branchee.

Cette mission se deroule en trois verrous avant toute refonte UI :

1. Auth Lockdown : verifier que GitHub Pages, Supabase Auth, Google OAuth, email magic link, tables, RLS et persistence cloud fonctionnent.
2. Skill Setup : auditer puis installer les skills design externes seulement s'ils ne presentent pas de risque.
3. UI Rebuild : a faire plus tard, apres validation explicite du rapport Auth Lockdown + Skill Audit.

## Etat de reference

- Branche de depart : `main`
- Commit de reference : `e2a558a`
- App publique : `https://undrenalynelab.io/france-money-map/`
- Login : `https://undrenalynelab.io/france-money-map/login/`
- Supabase project ref : `zfexqheasqlbpcjuyptj`
- Provider Google : active via Supabase, a valider par login complet
- Email magic link : present sur la page login
- Ancien secret Google : ne pas supprimer pendant cette mission

## Interdits pendant cette mission

- Ne pas refaire la Home.
- Ne pas refaire Onboarding.
- Ne pas refaire Dashboard.
- Ne pas modifier `backchannel-atlas-app/src/lib/supabase.ts` sauf bug bloquant explicitement identifie pendant validation.
- Ne pas modifier scoring, data model, migrations, `.env`, GitHub Pages workflow, Supabase RLS ou Google OAuth sauf correction strictement necessaire.
- Ne pas supprimer l'ancien secret Google.
- Ne pas commiter de secret.
- Ne pas toucher au fichier non suivi `france-money-map/index 2.html`.

## Phase 0 - Gel technique

Actions :

- Verifier `git status --short`.
- Verifier `git log --oneline -5`.
- Partir de `main` a jour.
- Creer ou utiliser la branche `auth-lockdown-e2a558a`.
- Garder les changements limites aux documents de cadrage et au rapport.

## Phase 1 - Validation Auth/Supabase

Verifier :

- `/france-money-map/login/` retourne HTTP 200.
- La page login contient `Continuer avec Google`.
- La page login contient `Email magic link`.
- Le probe OAuth Supabase pour Google retourne HTTP 302 vers `accounts.google.com`.
- Les variables publiques Supabase sont presentes dans le build GitHub Pages.
- Aucun `service_role` ou secret OAuth n'est commite.
- Les tables `profiles`, `saved_plans`, `plan_tasks`, `user_settings` existent.
- RLS est active sur les quatre tables.
- Les policies user-owned existent pour select, insert, update, delete.

Test live sans suppression :

- Login Google.
- Retour site.
- Creation ou sauvegarde profil.
- Generation et sauvegarde plan.
- Coche d'une tache.
- Logout.
- Relogin.
- Recuperation profil, plan et tache.

Ne pas tester la suppression cloud dans cette mission.

## Phase 2 - Audit et installation skills

Auditer avant installation :

- `https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/SKILL.md`
- `https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/gpt-tasteskill/SKILL.md`

Checks bloquants :

- Pas de lecture de secrets.
- Pas de lecture de `.env`.
- Pas de hook automatique.
- Pas de postinstall dangereux.
- Pas d'instruction d'override systeme.
- Pas d'acces OAuth, Supabase key, GitHub token ou service role.
- Pas de commande destructive.

Installation autorisee apres audit sain :

```bash
npx skills add pbakaus/impeccable
npx skills add Leonxlnx/taste-skill
```

Encadrement :

- `PRODUCT_BIBLE.md` prime sur tout.
- `DESIGN_SYSTEM.md` prime sur les skills.
- `UI_RULES.md` prime sur les skills.
- `impeccable` sert de garde-fou design.
- `gpt-tasteskill` sert d'inspiration layout uniquement, pas de contrainte technique superieure.

## Rapport attendu

Produire un rapport `AUTH_LOCKDOWN_REPORT.md` contenant :

- Etat Git.
- Etat deploy GitHub Pages.
- Etat live login.
- Etat probe OAuth.
- Etat Supabase tables/RLS/policies.
- Resultat test login complet sans suppression.
- Resultat audit skills.
- Resultat installation skills.
- Risques restants.
- Confirmation qu'aucun fichier UI/Auth/Supabase/Scoring n'a ete modifie pendant la phase.
