# DESIGN.md — Backchannel Atlas

register: product

## Scene

User compares international work routes at night on phone or laptop. Needs a clear verdict in under 3 seconds: where, how much, what blocks, next move.

## Theme

Dark graphite operational UI. High contrast for cash numbers. Map as decision engine, not decoration.

## Colors (CSS tokens — use variables, no inline hex in new components)

- `--atlas-ink`, `--atlas-panel`, `--atlas-line`, `--atlas-text`, `--atlas-muted`
- `--atlas-cash` (amber accent)
- Status: `--atlas-green` (open), `--atlas-orange` (gate), `--atlas-red` (blocked)

## Typography

Display: compact, heavy headlines. Body: readable 65–75ch max. Data labels: monospace micro-caps.

## Components (priority)

WorldMapHero, ProfileSummaryCard, OpportunityCard, SalaryCard, ProofOfPossibilityCard, ProbabilityBadge, CertaintyBadge, ActionPlanPreview

## Motion

Subtle only. Respect `prefers-reduced-motion`. No bounce.

## Certainty badges

```text
CERTAIN      — official source
PROBABLE     — model estimate
À VÉRIFIER   — needs professional confirmation
```

## Full spec

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and [UI_RULES.md](./UI_RULES.md).
