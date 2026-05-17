# AGENTS.md — Backchannel Atlas App

Canonical doctrine lives one level up in the monorepo:

```text
../AGENTS.md
../GLOBAL_PRODUCT_MODEL.md
../PRODUCT_BIBLE.md
../DESIGN_SYSTEM.md
../UI_RULES.md
```

Read those files before any major mission.

## App scope

This directory is the Next.js static export for Backchannel Atlas (`basePath: /france-money-map`).

```text
src/components/AtlasApp.tsx   — Home, onboarding, dashboard, map
src/components/ui/AtlasUi.tsx — WorldMapHero, cards, badges
src/lib/scoring.ts            — do not edit during UI-only passes
src/lib/supabase.ts           — do not edit during UI-only passes
```

## Phase 0 rule

Architecture mondiale, données étroites au début: 3 corridors (FR→AU FIFO, FR→CH capital, FR→CA camps), pas la planète entière en V1.

## UI mission phrase

```text
Gros chiffres pour attirer.
Preuves pour crédibiliser.
Probabilités pour protéger.
Plans pour convertir.
```
