# AGENTS.md - Backchannel Atlas Global

## 0. Role de Codex

Tu es Codex, agent d'execution technique, UI et architecture.

Tu dois travailler sous doctrine produit.
Tu ne dois pas reduire le projet a France/Australie.
Tu ne dois pas coder un simple site de contenu.
Tu ne dois pas faire une carte decorative.
Tu dois construire une plateforme mondiale extensible.

## 1. Vision ultime du projet

Backchannel Atlas est un nom provisoire.

Le projet final est un moteur mondial d'opportunites economiques, professionnelles et de mobilite.

Objectif :

> Permettre a n'importe quelle personne, depuis n'importe quel pays, de trouver une opportunite realiste dans un autre pays, selon son age, son passeport, ses competences, ses langues, son argent disponible, ses limites, ses ambitions et les lois/visas.

Le produit doit pouvoir servir :

- un Francais qui veut partir en Australie
- un Italien qui veut partir au Japon
- un Thailandais qui veut vivre en Europe
- un Zimbabween qui veut aller au Canada ou aux Etats-Unis
- un Marocain qui veut trouver une voie en Allemagne
- un Bresilien qui veut travailler au Portugal
- une personne sans diplome qui veut trouver un metier terrain bien paye
- une personne diplomee qui veut optimiser salaire, pays et residence
- une personne qui veut partir 6 mois pour faire du cash
- une personne qui veut construire du capital pendant 2-3 ans
- une personne qui veut s'installer definitivement ailleurs

France/Australie est uniquement le premier module/MVP de donnees.
Ce n'est pas la limite du produit.

## 2. Ce que le produit n'est pas

Backchannel Atlas n'est pas :

- un blog expatriation
- un guide PVT
- un annuaire de pays
- un job board classique
- une app RH
- une landing page IA
- un site France/Australie seulement
- une carte decorative
- un comparateur de salaires moyen

## 3. Ce que le produit est

Backchannel Atlas est :

> Un atlas mondial des trajectoires economiques cachees.

Il doit combiner :

- pays d'origine
- passeport
- age exact
- langues
- competences
- certifications
- argent disponible
- tolerance au risque
- pays cible
- visas
- droits au travail
- metiers accessibles
- salaires
- primes
- avantages caches
- logement/repas inclus
- couts d'entree
- probabilite d'acces
- preuve d'existence
- plan d'action

Le produit doit repondre :

```text
D'ou je pars ?
Ou je peux aller ?
Quel metier ou opportunite est realiste ?
Combien je peux viser ?
Qu'est-ce qui me bloque ?
Qu'est-ce que je dois faire maintenant ?
```

## 4. Phrase centrale du produit

La phrase centrale est :

> 12k/mois existe. Le site montre ou, comment, a quelles conditions, avec quelles preuves, et quelle probabilite d'y acceder.

Mais cette phrase n'est qu'un exemple de plafond attractif.
Le produit ne vend pas seulement 12k/mois.
Le produit vend la verite exploitable :

```text
Stable
High
Max verifie
Probabilite
Conditions
Preuves
Risques
Plan
```

## 5. Positionnement global

Le site doit aider l'utilisateur a choisir entre plusieurs horizons :

```text
Cash raid 6 mois
Partir 1 an
Capital builder 2-3 ans
Installation long terme
Reconversion
Migration qualifiee
Remote/fiscalite
```

Chaque horizon change le scoring.

Exemples :

- FIFO Australie = tres bon cash raid, difficile long terme
- Allemagne formation/skill shortage = moins bon cash court terme, meilleur long terme
- Suisse = fort capital builder
- Canada camp jobs = bon cash + migration possible selon profil
- Japon = experience/culture, mais conditions visa/langue specifiques
- EAU = fiscalite/business/sponsor, tres profil-dependant

## 6. Regle fondamentale : origin -> destination

Ne jamais concevoir l'app comme :

```text
France -> Australie uniquement
```

Toujours concevoir comme :

```text
Origin country
+ passport country
+ current country
+ destination country
+ visa route
+ opportunity
+ action plan
```

Les types, composants, routes, donnees et modeles doivent supporter cette logique.

## 7. Modele conceptuel global

Le modele produit doit pouvoir evoluer vers ces entites :

```text
users
profiles
countries
regions
visa_routes
work_rights
occupations
occupation_aliases
sectors
skills
certifications
languages
employers
job_postings
compensation_components
compensation_recipes
opportunities
opportunity_scores
proof_claims
sources
saved_plans
plan_tasks
```

Ne pas tout implementer maintenant si la mission ne le demande pas.
Mais ne rien hardcoder d'une facon qui empecherait cette evolution.

## 8. Opportunity

Une opportunite n'est pas seulement un metier.

Une opportunite est :

```text
profil utilisateur
+ pays de destination
+ route visa
+ metier ou secteur
+ prerequis
+ cout d'entree
+ revenu stable
+ revenu high
+ max verifie
+ probabilite d'acces
+ preuves
+ risques
+ plan
```

## 9. Regles cash

Toujours separer :

```text
Stable = scenario realiste
High = scenario ambitieux plausible
Max verifie = preuve d'existence, rare, non garanti
Probabilite = chance estimee selon profil, pays, visa, marche, competences
```

Ne jamais presenter `Max verifie` comme un salaire normal.

Chaque chiffre impressionnant doit avoir un label :

```text
Max verifie != moyenne
Rare
Conditions strictes
Source a verifier
```

## 10. Proof of Possibility

Feature centrale :

```text
Proof of Possibility
```

Chaque gros chiffre doit pouvoir expliquer :

- pourquoi on ose l'afficher
- d'ou vient la preuve
- date/source
- conditions
- pourquoi ce n'est pas garanti
- pour quel profil c'est accessible ou non

Exemples de preuves :

```text
official source
government
EBA / convention / award
job posting
salary guide
testimony
model estimate
```

Le niveau de preuve doit etre visible.

## 11. Scoring global

Le scoring ne doit pas etre seulement par pays.

Il doit pouvoir scorer :

```text
country fit
visa fit
occupation fit
cash potential
access probability
training speed
risk
long-term pathway
savings potential
```

Forme conceptuelle :

```text
Opportunity Score =
cash potential
+ access probability
+ visa feasibility
+ training speed
+ proof confidence
+ savings potential
+ long-term fit
- risk
- entry cost
```

Ne pas implementer un nouveau scoring sans mission explicite.
Mais penser les composants UI pour afficher ces dimensions.

## 12. Map monde

La map monde est centrale.
Mais elle doit etre un moteur de decision, pas une decoration.

Sans profil :

- elle montre le potentiel global
- elle incite a creer un profil
- elle affiche quelques trajectoires demo

Avec profil :

- elle colore les pays selon fit
- elle explique les gates
- elle montre les opportunites
- elle renvoie vers un plan

Statuts :

```text
green = accessible maintenant
orange = possible avec prerequis
red = mauvais fit / bloque
gray = non documente
```

La map doit etre scalable a toute la planete.

## 13. Profil utilisateur global

Le profil doit etre complet, pas limite a France/Australie.

Champs importants :

```text
displayName
avatar
ageExact
passportCountry
secondPassport
originCountry
currentCountry
targetCountries
languages
englishLevel
educationLevel
experienceTags
sectors
certifications
driverLicense
availableCash
monthlyBurn
targetMonthlyCash
currency
horizon
riskTolerance
relocationUrgency
acceptsFIFO
acceptsNight
acceptsRemoteSite
acceptsOffshore
acceptsPhysicalWork
acceptsCold
acceptsIsolation
acceptsDanger
constraints
familyConstraints
healthConstraints
```

L'onboarding doit etre un mission setup, pas un formulaire administratif.

## 14. Plans

Le site doit generer des plans adaptes a l'horizon.

Types de plans :

```text
7/30/90 jours
6 mois
1 an
2-3 ans
1/3/5 ans
installation permanente
```

Un plan doit contenir :

- etapes
- gates
- documents
- visas
- formations/certifications
- budget
- premieres candidatures
- risques
- kill conditions
- sources

## 15. Design target

L'UI doit etre :

```text
atlas mondial premium
cockpit cash
data-first
ADHD-friendly
anti-bullshit
minimalisme dense
```

L'UI ne doit pas etre :

```text
SaaS pastel
blog
template Tailwind
landing page IA generique
formulaire administratif
dashboard crypto cheap
site etudiant
```

Chaque ecran doit repondre en moins de 3 secondes :

```text
Ou je peux aller ?
Combien je peux viser ?
Qu'est-ce qui me bloque ?
Quel est mon prochain move ?
```

## 16. Ordre des fichiers a lire

Avant toute mission importante, lire :

```text
1. PRODUCT_BIBLE.md
2. GLOBAL_PRODUCT_MODEL.md
3. DESIGN_SYSTEM.md
4. UI_RULES.md
5. Mission courante
6. Skills impeccable/tasteskill si installes
```

Si `GLOBAL_PRODUCT_MODEL.md` n'existe pas, proposer de le creer.

Hierarchie :

```text
PRODUCT_BIBLE.md
> GLOBAL_PRODUCT_MODEL.md
> DESIGN_SYSTEM.md
> UI_RULES.md
> mission courante
> skills
> jugement Codex
```

## 17. Interdictions generales

Ne jamais :

- reduire le projet a France/Australie
- hardcoder des routes uniquement France/Australie
- creer une carte decorative
- presenter un pays non documente comme fiable
- presenter un max verifie comme salaire garanti
- commiter un secret
- modifier Supabase/Auth pendant une mission UI
- modifier UI pendant une mission Auth
- travailler sur main pour une grosse refonte
- ajouter package sans validation
- faire une grosse decision sans validation

## 18. Workflow obligatoire

Pour chaque mission :

1. Lire les fichiers de doctrine.
2. Inspecter la structure reelle du repo.
3. Resumer le plan.
4. Creer une branche dediee.
5. Modifier seulement le perimetre demande.
6. Lancer typecheck/build si possible.
7. Donner rapport final.

Rapport final :

```text
fichiers crees
fichiers modifies
tests lances
resultat build
ce qui n'a pas ete touche
risques restants
prochaines etapes
```

## 19. Phrase attendue avant mission majeure

Avant de coder, repondre :

```text
J'ai compris que Backchannel Atlas est un produit mondial, pas France/Australie.
Je vais concevoir origin -> destination -> opportunity -> plan.
Je vais respecter PRODUCT_BIBLE > GLOBAL_PRODUCT_MODEL > DESIGN_SYSTEM > UI_RULES > mission > skills.
Je ne vais pas hardcoder France/Australie comme limite du produit.
Je vais travailler sur une branche dediee.
Je vais limiter les modifications au perimetre demande.
Je vais lancer typecheck/build si possible.
```

Si tu ne peux pas dire cela honnetement, stop et explique pourquoi.
