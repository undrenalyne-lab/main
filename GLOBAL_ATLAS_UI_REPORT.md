# GLOBAL_ATLAS_UI_REPORT.md
# Backchannel Atlas - Global UI Reframe Report

## What changed conceptually

Backchannel Atlas is now documented and presented as a global opportunity engine, not a France/Australia product.

Core model:

```text
origin country -> passport/work rights -> destination country -> opportunity -> proof -> probability -> action plan
```

France, Australia, Canada, Switzerland, Germany and UAE are treated as the first dataset slice.

## UI changes in this pass

- Home now starts with a large real world map, not a text-first landing page.
- Documented countries are clickable through the SVG paths and map nodes.
- The map uses decision states: accessible, prerequisites, blocked, undocumented.
- The Home now explains the global expansion principle: build narrow data, wide architecture.
- Onboarding is reframed as a mission setup, not an admin form.
- Dashboard is reframed as a decision cockpit with best move, profile summary, plan preview and opportunity cards.
- Salary display separates stable, high plausible and max verified/proof state.
- Opportunity cards expose score, visa gate, time to first pay, entry cost, fit probability and next action.

## Current France/Australia-centric remnants

- Public path is still `/france-money-map/` for compatibility with the existing GitHub Pages deployment.
- `metadataBase` still uses `/france-money-map/` because that is the current production path.
- `backchannel-atlas-app/src/lib/format.ts` still has `basePath = "/france-money-map"`.
- `backchannel-atlas-app/src/data/mobility_sources.json` still contains an old source URL ending in `/france-money-map/sources.html`.
- Current live dataset still has France as the strongest route for the default French profile.

## Later refactor targets

- Rename deployment path later from `/france-money-map/` to `/backchannel-atlas/` or `/atlas/` if the domain strategy changes.
- Split country data into country configs, visa routes, opportunities, proof claims and compensation recipes.
- Add real occupation-level opportunities instead of country-level averages.
- Add proof claims for max verified revenue instead of using the current upside as a proxy.
- Add a global route explorer for origin/destination pairs beyond French profiles.
- Build an admin/import workflow for adding countries and opportunities without editing app code.

## Non-goals in this pass

- No Supabase/Auth code was changed.
- No migrations were changed.
- No scoring engine rewrite was done.
- No paid services or new frontend dependencies were added.
