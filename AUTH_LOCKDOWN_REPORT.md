# AUTH_LOCKDOWN_REPORT.md
# Backchannel Atlas — Auth Lockdown + Skill Audit

Date: 2026-05-17
Branch: `auth-lockdown-e2a558a`
Base commit: `e2a558a Add email auth fallback for Backchannel Atlas`

## Scope

This pass executed only:

- Phase 0: technical freeze before UI rebuild.
- Phase 1: real Supabase/Auth validation.
- Phase 2: design skill audit and install.

No UI rebuild was performed in this pass.

## Git / Build

- [x] Working branch created from `main`: `auth-lockdown-e2a558a`.
- [x] Latest base commit confirmed: `e2a558a`.
- [x] GitHub Pages workflow observed as successful for `e2a558a`.
- [x] No tracked `.env.local` found.
- [x] No `SUPABASE_SERVICE_ROLE_KEY` or OAuth secret found in tracked source scan.
- [x] Existing untracked file left untouched: `france-money-map/index 2.html`.
- [x] `npm run typecheck` passed.
- [x] `npm run test:scoring` passed.
- [x] `npm run build` passed and generated the static Next export.

## Live Auth Validation

- [x] Live login route responds: `https://undrenalynelab.io/france-money-map/login/`.
- [x] Login page shows Google login.
- [x] Login page shows email magic link fallback.
- [x] Supabase OAuth provider probe returns HTTP `302` toward Google OAuth.
- [x] Google OAuth login completed through the browser.
- [x] OAuth returned to Backchannel Atlas.
- [x] Home displays active session state: `Session active. Plans persistants.`
- [x] User profile onboarding completed after login.
- [x] Profile persisted to Supabase.
- [x] Plan generated and saved to Supabase.
- [x] Plan task checkbox persisted.
- [x] Logout completed.
- [x] Relogin completed.
- [x] Saved plan and checked task were recovered after relogin.
- [x] Delete data was not tested in this pass by scope decision.

Test user seen in live account export:

- User id present.
- Email present in session export.
- Profile id: `29212b5a-4b54-4630-a403-61e7e1e6540a`.
- Saved plan id: `75dfedf1-9306-4204-82b1-d46d5a8b1034`.
- Checked task status recovered as `done`.
- Plan progress recovered as `11%`.

## Supabase SQL Read-Only Verification

The following checks were run in Supabase SQL Editor as read-only queries.

- [x] Tables present:
  - `plan_tasks`
  - `profiles`
  - `saved_plans`
  - `user_settings`
- [x] RLS enabled on all four tables:
  - `plan_tasks`: `true`
  - `profiles`: `true`
  - `saved_plans`: `true`
  - `user_settings`: `true`
- [x] User-owned policies present for the expected tables.
- [x] Live data created by test:
  - `profiles`: `1`
  - `saved_plans`: `1`
  - `plan_tasks`: `9`
  - `user_settings`: `0`
- [x] Latest profile row has non-null `user_id`.

## Supabase / Google Config Notes

- [x] Google provider is functionally enabled because live Google login completed.
- [x] Supabase callback used by Google: `https://zfexqheasqlbpcjuyptj.supabase.co/auth/v1/callback`.
- [x] Production redirect returned to `https://undrenalynelab.io/france-money-map/`.
- [x] No old Google secret was revoked in this pass.

Old Google secret status:

- Left active intentionally.
- Reason: do not rotate/revoke until the new OAuth path remains stable after repeated live usage.
- Next safe step: revoke obsolete OAuth secret in a separate maintenance pass, then immediately retest Google login.

## Skill Audit

Audited before install:

- `impeccable`: `https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/SKILL.md`
- `gpt-tasteskill`: `https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/gpt-tasteskill/SKILL.md`

Audit checks:

- [x] No instruction to read `.env`.
- [x] No instruction to read secrets.
- [x] No `service_role` / Supabase secret usage.
- [x] No GitHub token usage.
- [x] No automatic startup hook found.
- [x] No postinstall command found in audited top-level skill files.
- [x] No destructive shell command found in audited top-level skill files.
- [x] No instruction to override project hierarchy.

Installer output:

- `impeccable`: Gen Safe, Socket 0 alerts, Snyk medium risk.
- `taste-skill`: installed skills reported Gen Safe, Socket 0 alerts, Snyk low risk.

Post-install scan of `.agents/skills`:

- Found only benign environment mentions such as `IMPECCABLE_CONTEXT_DIR`, `NODE_ENV`, and design examples like password-strength UI references.
- No `.env`, OAuth secret, service-role key, destructive command, or token-reading pattern found.

## Installed Skills

The command `npx skills add Leonxlnx/taste-skill` installed the full taste-skill pack, not only `gpt-taste`.

Installed:

- `.agents/skills/brandkit/SKILL.md`
- `.agents/skills/design-taste-frontend/SKILL.md`
- `.agents/skills/full-output-enforcement/SKILL.md`
- `.agents/skills/gpt-taste/SKILL.md`
- `.agents/skills/high-end-visual-design/SKILL.md`
- `.agents/skills/image-to-code/SKILL.md`
- `.agents/skills/imagegen-frontend-mobile/SKILL.md`
- `.agents/skills/imagegen-frontend-web/SKILL.md`
- `.agents/skills/impeccable/SKILL.md`
- `.agents/skills/industrial-brutalist-ui/SKILL.md`
- `.agents/skills/minimalist-ui/SKILL.md`
- `.agents/skills/redesign-existing-projects/SKILL.md`
- `.agents/skills/stitch-design-taste/SKILL.md`

Also created:

- `skills-lock.json`

## Product Control Documents

Created:

- `CODEX_TOTAL_RECOVERY_MISSION.md`
- `PRODUCT_BIBLE.md`
- `DESIGN_SYSTEM.md`
- `UI_RULES.md`

Priority hierarchy documented:

`PRODUCT_BIBLE.md > DESIGN_SYSTEM.md > UI_RULES.md > impeccable > tasteskill > default model taste`

## Non-Changes Confirmed

- [x] No Supabase migration edited.
- [x] No RLS policy edited.
- [x] No OAuth config edited in code.
- [x] No auth code edited.
- [x] No scoring core edited.
- [x] No UI rebuild performed.
- [x] No production deploy modification introduced.
- [x] No cloud data deletion performed.

## Remaining Risks / Next Pass

- The Account page has a destructive `Supprimer données` action visible. It was not tested in this pass.
- Old Google OAuth secret should be revoked later only after a dedicated rotation/retest pass.
- `npx skills add Leonxlnx/taste-skill` installed the full skill pack; keep project hierarchy rules strict so only `gpt-taste`/layout guidance is used when relevant.
- Next product pass can now begin from a safer baseline: Home, onboarding/profile wizard, and dashboard only.
