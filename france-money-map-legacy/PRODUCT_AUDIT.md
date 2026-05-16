# Backchannel Atlas - audit produit rapide

## Diagnostic franc

Le produit a une bonne direction sur la France: cash visible, portes, tickets, employeurs et simulateur. Les problemes principaux viennent de la couche monde/Australie:

- La carte ne devait pas etre une illustration abstraite. Elle doit etre un vrai outil de selection pays.
- L'Australie etait trop peu actionnable: pas assez de missions, pas assez de lecture mensuelle/hebdo, et trop de dependance a des grands mots comme FIFO.
- Le site melange parfois information et decision. L'utilisateur doit toujours voir "quoi faire cette semaine".
- Le modele doit rester extensible pays par pays, sinon chaque ajout devient une refonte.

## Priorites produit

1. Carte monde credible et interactive.
2. France = module live le plus complet.
3. Australie = beta lisible, surtout droits, gates, salaire hebdo/mensuel et delai.
4. Pays verrouilles = roadmap visible, sans fausse promesse.
5. Donnees faciles a enrichir par JSON.

## Definition d'une bonne route

Une route est publiable seulement si elle contient:

- un premier job realiste,
- un ticket bloquant,
- un delai avant premiere paie,
- un salaire bas/stable/upside,
- une cadence mensuelle ou hebdo quand le pays l'exige,
- des canaux concrets,
- ce que la route n'ouvre pas.

## Retention utilisateur

Le site doit retenir par decision utile, pas par animation:

- le profil modifie la carte immediatement,
- les pays live/beta/locked donnent un sentiment de progression monde,
- chaque carte donne une action,
- chaque chiffre a une hypothese,
- chaque ticket dit quand ne pas l'acheter.

## Risques a surveiller

- Salaires trop precis sans source: risque de perte de confiance.
- Trop de pays grises sans contenu: effet "site vide".
- Trop de jargon metier sans sequence: effet "encyclopedie".
- Trop de cartes equivalentes: fatigue ADHD.

La prochaine vraie etape n'est pas un redesign supplementaire. C'est l'enrichissement data discipline par discipline avec la meme structure.
