# DESIGN_SYSTEM.md - Backchannel Atlas

## Direction

Backchannel Atlas doit evoquer :

- atlas tactique
- cockpit cash
- renseignement operationnel
- outil premium dense
- sobriete dure
- precision terrain

Il ne doit pas ressembler a :

- un template SaaS generique
- un dashboard fintech banal
- un site corporate RH
- une landing startup centree sur une vague promesse
- une interface neon decorative

## Scene d'usage

L'utilisateur compare des options de vie et de travail le soir, sur mobile ou laptop, avec peu de patience et un besoin de verdict clair. Le theme doit donc etre sombre, lisible, dense, mais jamais confus.

## Couleurs

Utiliser des tokens CSS, pas de couleurs inline dans les nouveaux composants.

- `--atlas-ink` : fond graphite bleute
- `--atlas-panel` : surface principale
- `--atlas-panel-strong` : surface importante
- `--atlas-line` : lignes et bordures
- `--atlas-text` : texte primaire
- `--atlas-muted` : texte secondaire
- `--atlas-cash` : accent cash amber
- `--atlas-green` : accessible
- `--atlas-orange` : prerequis
- `--atlas-red` : bloque/risque
- `--atlas-blue` : beta/info

## Typographie

- Display : expressive, compacte, lisible.
- Body : tres lisible, line-height confortable.
- Longueur de ligne : 65 a 75 caracteres maximum.
- Les gros chiffres doivent etre plus visibles que les paragraphes.

## Layout

- Mobile-first.
- Une action principale par ecran.
- Grandes zones cliquables.
- Grilles denses mais respirables.
- Eviter les cartes identiques repetees.
- Les cartes ne sont pas la reponse par defaut.

## Composants prioritaires

- WorldMapHero
- ProfileSetupWizard
- ProfileSummaryCard
- OpportunityCard
- SalaryCard
- ProofOfPossibilityCard
- ProbabilityBadge
- GateBadge
- StatStrip
- ActionPlanPreview
- EmptyState
- ErrorState
- Skeleton

## Motion

- Motion sobre, utile, jamais gratuite.
- Respecter `prefers-reduced-motion`.
- Pas d'animation de layout properties.
- Pas d'effet bounce/elastic.

## Accessibilite

- Focus visible obligatoire.
- Contraste lisible.
- Navigation clavier.
- Compréhension sans couleur seule.
- Cibles tactiles suffisantes sur mobile.
