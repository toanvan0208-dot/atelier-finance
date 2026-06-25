# Phase 142C: Standing Rules and PostgreSQL Transition Plan

## Objective

Persist the thread's recurring engineering, data-safety, investment, evidence, validation, and Git guardrails inside the repository, and establish a clear PostgreSQL transition roadmap following the Phase 142A and 142B audits.

This phase is documentation-only.

## Inputs and Prior Conclusions

- Phase 142A commit: `cef59198` - PostgreSQL is the production target; `dev.db` is local-only; use fresh PostgreSQL plus deterministic reviewed-preview imports.
- Phase 142B commit: `4f4bae39` - the current SQLite migrations and SQLite-only write guard are not PostgreSQL-portable; long-term Dev/Prod parity should use PostgreSQL locally and in production.

## Files Created

- `docs/product/AGENT_STANDING_RULES.md`
- `docs/product/POSTGRES_TRANSITION_PLAN.md`
- `docs/product/evidence/PHASE142C_STANDING_RULES_AND_POSTGRES_TRANSITION_PLAN.md`
- `docs/product/evidence/PHASE142C_STANDING_RULES_AND_POSTGRES_TRANSITION_PLAN_RESULT.json`

## Why Standing Rules Were Added

The same high-value boundaries recur across import, audit, runtime, deployment, and evidence phases. Keeping them only in long prompts creates avoidable repetition and increases the chance that a future phase misses a Git, data, validation, source, banking, or investment guardrail.

The standing-rules document now makes these defaults explicit:

- tracked-worktree scope gate before editing;
- selective staging and prohibited asset lists;
- mandatory validation and exact test reporting;
- read-only-by-default behavior;
- explicit confirm-write authorization;
- missing-data and reviewed-preview metadata rules;
- debt and VCB banking caveats;
- investment-advice prohibitions;
- evidence and final-report requirements.

## Why the PostgreSQL Transition Plan Was Added

Phase 142A and Phase 142B established the destination and the blockers, but the repository needed a single operational roadmap that future phases can follow without re-litigating the transition strategy.

The plan records:

- current SQLite/provider and migration limitations;
- the PostgreSQL Dev/Staging/Production target;
- why `dev.db` must not be copied;
- fresh-baseline migration handling;
- deterministic five-ticker reviewed-preview import scope;
- VCB exclusion and bank-specific mapping requirement;
- environment and secret-management rules;
- phased 142D-142I transition sequence;
- readiness criteria before production import.

## Scope and Non-Write Confirmations

- Database write: No.
- Data import: No.
- Confirm-write: No.
- Prisma provider change: No.
- Prisma schema change: No.
- Migration created: No.
- Migration deleted or modified: No.
- Runtime logic/source priority change: No.
- Reviewed-preview data change: No.
- VCB behavior change: No.
- Package-script change: No.
- `dev.db` committed: No.
- `.env` / `.env.local` committed: No.
- PDF, image, OCR, temporary, diagram, thesis, or source-PDF asset staged: No.

## Repository Hygiene

Before editing:

- `git status --short`
- `git diff --stat`
- `git diff`

Result: no tracked modifications existed. Only allowed pre-existing untracked assets under `diagrams/`, `docs/product/evidence/source-pdfs/`, and `docs/thesis/` were present and left untouched.

## Validation Results

- `npx prisma validate`: passed, exit code 0.
- `npm run typecheck`: passed, exit code 0.
- `npm run lint`: passed, exit code 0, with one pre-existing out-of-scope warning in `scripts/smoke-real-http-six-ticker-workspace.ts` for unused `_e`.
- `npm test`: passed on the first run, exit code 0; 142 test files and 1,185 tests passed.
- `npm run build`: passed, exit code 0; Prisma Client generation and Next.js production build completed successfully.
- Result JSON parse check: passed.

## Final Git Status

Pre-commit status:

- No tracked modification exists outside Phase 142C.
- Four new Phase 142C documentation/evidence files are untracked and intended for selective staging.
- Allowed pre-existing untracked assets remain under `diagrams/`, `docs/product/evidence/source-pdfs/`, and `docs/thesis/`.
- `tsconfig.tsbuildinfo` was restored after validation.
- No database, environment, PDF, image, temporary, diagram, thesis, generated Prisma, schema, migration, package, or runtime file is included in the intended commit.

## Recommended Next Phase

Phase 142D - prepare the PostgreSQL provider/schema baseline transition in an explicitly isolated branch/phase, with no production write and no casual deletion of existing migration history.
