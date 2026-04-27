# Backchannel Atlas - guide d'extension des donnees

Ce guide sert a ajouter des pays, routes, tickets et employeurs sans refaire l'UI.
Regle produit: ne pas ajouter une route qui promet du cash si les gates, tickets, delais et limites ne sont pas explicites.

## Principe

Chaque contenu doit repondre a quatre questions utilisateur:

1. Est-ce que j'ai le droit d'y aller / d'y travailler ?
2. Quel premier verrou bloque vraiment ?
3. Combien ca peut payer en bas, stable et upside ?
4. Quelle action je fais cette semaine ?

Si une fiche ne repond pas a ces quatre questions, elle n'est pas prete a etre publiee.

## Ajouter un pays sur la carte

Fichier: `assets/data/world_markets.json`

Champs minimum:

```json
{
  "id": "canada",
  "label": "Canada",
  "status": "locked",
  "badge": "Locked",
  "continent": "North America",
  "iso3": "CAN",
  "geo": { "lat": 56.1, "lon": -106.3 },
  "tagline": "Trades · remote cold work · industrial packages",
  "missions": ["Remote trades", "Rail", "Oil sands"],
  "summary": "Ce que le marche peut donner quand il sera documente.",
  "teaser": "Pourquoi ce pays merite d'etre dans la roadmap.",
  "unlockNote": "Roadmap mondiale",
  "firstGate": "Permis de travail, province, certification locale."
}
```

`iso3` doit correspondre au code du GeoJSON `world_countries_110m.geojson`. Le pin utilise `geo.lat` et `geo.lon`. Les pays sans donnees restent grises: mieux vaut un pays verrouille honnete qu'une fausse promesse.

## Ajouter une mission Australie

Fichier: `assets/data/australia_guide.json`

Champs obligatoires:

```json
{
  "id": "shutdown-trade-assistant",
  "label": "Shutdown Trade Assistant",
  "status": "beta",
  "difficulty": "medium",
  "prepWeeks": "3-8",
  "salaryYear1": "70-100k AUD",
  "salarySignals": {
    "low": "70-80k AUD",
    "stable": "80-100k AUD",
    "upside": "105-125k AUD"
  },
  "payCadence": {
    "monthlyGross": "6.7-8.3k AUD/mois brut",
    "weeklyGross": "1.55-1.9k AUD/semaine brut"
  },
  "firstPayWindow": "3-6 semaines",
  "blockingTicket": "White Card + Working at Heights + Confined Space / Gas Test selon site",
  "whyGood": "Pourquoi cette route est utile pour un profil donne.",
  "entryVia": "Canaux concrets: agences, boites, job boards, contractors.",
  "firstRole": "Premier role realiste",
  "fitTags": ["terrain", "meca", "cash-upside"],
  "nextStep": "La marche suivante apres premiere reference locale.",
  "actionsThisWeek": [
    "Action 1 concrete",
    "Action 2 concrete",
    "Action 3 concrete"
  ],
  "doesNotOpen": "Ce que cette route ne debloque pas."
}
```

Ne pas confondre:

- `salaryYear1`: brut annuel plausible, utile pour comparer.
- `salarySignals.low/stable/upside`: lecture dopamine mais cadree.
- `payCadence.monthlyGross`: ce que l'utilisateur comprend vite.
- `payCadence.weeklyGross`: utile pour l'Australie car beaucoup d'annonces parlent en semaine/horaire/roster.
- `firstPayWindow`: delai realiste avant premiere fiche, pas duree de formation seulement.

## Ajouter une route France

Fichiers principaux:

- `assets/data/lanes.json`
- `assets/data/tickets.json`
- `assets/data/employers.json`
- `assets/data/compensation_rules.json`

Checklist avant publication:

- La lane a des tickets requis ET recommandes.
- Le ticket dit clairement ce qu'il ouvre et ce qu'il n'ouvre pas.
- La fiche a des employeurs ou canaux d'entree concrets.
- La remuneration est decomposee dans `compensation_rules.json`.
- Les hypotheses nuits, week-ends, grands deplacements et paniers correspondent au metier.
- La route a une limite explicite dans `doesNotOpen` ou `notes`.

## Regle de qualite des salaires

Ne jamais publier un montant sans indiquer la lecture:

- brut ou net,
- annuel, mensuel ou hebdo,
- salaire ou indemnite,
- scenario bas, stable ou upside,
- beta si la confiance est incomplete.

Un chiffre flou attire l'attention mais detruit la confiance. Le but est de donner de la dopamine decisionnelle, pas une promesse fragile.

## Regle de qualite UX

Chaque nouvelle fiche doit donner une action immediate:

- un ticket a verifier,
- une boite a viser,
- un canal d'entree,
- une erreur a eviter,
- un delai avant premiere paie.

Si l'utilisateur finit une carte sans savoir quoi faire ensuite, la carte est mauvaise.
