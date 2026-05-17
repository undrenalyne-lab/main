# GLOBAL_PRODUCT_MODEL.md
# Backchannel Atlas - Global Opportunity Model

## 1. Vision

Backchannel Atlas est un moteur mondial de trajectoires economiques.

Le modele central est :

```text
User Profile
-> Origin Country
-> Passport / Work Rights
-> Destination Country
-> Visa Route
-> Opportunity
-> Proof
-> Probability
-> Action Plan
```

France/Australie est un premier dataset, pas la limite du produit.

## 2. Entites futures

```text
countries
regions
visa_routes
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
proof_claims
sources
user_profiles
saved_plans
plan_tasks
```

## 3. Opportunity

Une opportunity est une combinaison de :

```text
destination country
visa route
occupation / sector
cash potential
access probability
proof level
entry cost
time to first pay
risk
long-term path
```

## 4. Revenue labels

```text
Stable = realistic
High = ambitious plausible
Max Verified = existence proof, rare, not average
Probability = estimated chance for this profile
```

## 5. Horizons

```text
cash_raid_6m
one_year_move
capital_builder_2_3y
permanent_migration
remote_arbitrage
skill_upgrade
```

## 6. Expansion principle

Adding a new country, sector or occupation must not require rewriting the app.

It should require adding data:

```text
country config
visa routes
opportunities
sources
compensation recipes
proof claims
```

## 7. UI principle

Every UI card must be able to display:

```text
country
sector
opportunity title
stable cash
high cash
max verified
probability
access gate
proof level
next action
```
