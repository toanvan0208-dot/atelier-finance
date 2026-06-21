# Codex Operating Manual

## 1. Purpose

This manual centralizes stable operating rules for Codex work in Atelier Finance so future phase prompts can stay short while preserving project safety, validation discipline, and product guardrails.

Use this file together with:

- `docs/product/ATELIER_FINANCE_GUARDRAILS.md`
- `docs/product/IMPLEMENTATION_PHASE_STATUS.md`

Phase-specific prompts should only add the goal, allowed scope, forbidden deltas, validation deltas, commit message, and final-report requirements.

## 2. How to start every phase

Before changing files:

1. Confirm the current branch and working tree.
2. Inspect the latest phase chain and latest commit.
3. Read the current product guardrails and phase status docs.
4. Identify allowed files and forbidden scope.
5. Decide whether the phase is docs-only, backend/helper/test-only, or UI/browser-visible.
6. Do not edit files until the current guardrails and validation expectations are understood.

## 3. Required inspection commands

Run and review the relevant current-state commands before editing:

```bash
git status
git log --oneline -20
git show --stat <latest-commit>
git show --name-only --oneline <latest-commit>
ls docs/product
grep -R "Phase <latest>|guardrail|productionApproved|git add \.|db:reset|db:seed|db push|zero-fill|magnitude guessing" -n docs/product src | head -500
```

Use `rg` instead of `grep` when working in a local environment where `rg` is available.

## 4. Git hygiene rules

- Start from a clean working tree unless the user explicitly approves working with existing changes.
- Keep changes scoped to the phase.
- Stage intended files explicitly by path.
- Inspect unstaged and staged diffs before committing.
- Do not hide unrelated changes inside the phase commit.
- Do not commit generated, raw, secret, database, or screenshot files unless the phase explicitly allows a specific artifact.

Before staging, run:

```bash
git status
git diff --name-only
git diff
```

After staging, run:

```bash
git diff --cached --name-only
git diff --cached
```

## 5. Forbidden git commands

- Do not use git add .
- Do not use git push --force.
- Do not use destructive git commands such as `git reset --hard` or `git checkout -- <path>` unless the user explicitly requests them for the specific target.

## 6. Forbidden generated/raw/secret/DB files

Do not commit:

- `.env.local`
- API keys/secrets
- SQLite DB files
- `dev.db`
- `prisma/dev.db`
- DB backup files
- `src/generated/prisma`
- `tsconfig.tsbuildinfo`
- `next-env.d.ts` if it only changed because of generated/dev-server activity
- `.next-dev.log`
- `.next-dev.err.log`
- raw CSV
- CSV fixture files unless a future phase explicitly allows them
- synthetic temp CSV
- JSON output
- screenshots unless explicitly requested
- browser screenshots unless explicitly requested

Also:

- Do not mutate `prisma/dev.db`.
- Do not create migrations unless a future phase explicitly allows migration work.
- Do not edit `prisma/schema.prisma` unless a future phase explicitly allows schema work.

## 7. Validation commands

Default required validation:

```bash
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
```

For UI/browser-visible phases, also run:

```bash
npm run build
```

If a focused test is added or changed, run it before the full suite, for example:

```bash
npx vitest run <focused-test-path>
```

## 8. Browser verification rules

- Browser verification is required if UI/browser-visible behavior changes and browser/dev workflow is available.
- Browser verification may be skipped for docs-only, backend-only, helper-only, or test-only phases with no UI/browser-visible change.
- If browser verification is skipped, the final report must state why.
- Do not commit browser screenshots unless explicitly requested.

## 9. When browser verification is required

Run browser verification when a phase changes:

- UI components, pages, route rendering, or visible copy.
- Browser-visible source transparency, readiness, warnings, badges, labels, or module cards.
- Client-side behavior, interaction states, routing, charts, forms, upload flows, or visible error handling.
- CSS/layout behavior that could affect visible output.

## 10. When browser verification may be skipped

Browser verification may be skipped when the phase is limited to:

- docs-only changes;
- tests-only changes;
- backend/helper contracts with no browser-visible wiring;
- static analysis or planning docs;
- local-only scripts that are not exposed to UI/API behavior.

The final report must still include the browser section and the skip reason.

## 11. Commit and push rules

- Commit only after required validation passes.
- Push only after the committed scope is clean and intentional.
- Use the exact commit message requested by the phase prompt.
- Do not push if validation fails unless the user explicitly changes the instruction.
- Do not force push.

Forbidden commands:

```bash
git push --force
npm audit fix --force
npm run db:reset
npm run db:seed
npx prisma db push
prisma db push
```

`prisma db push` is forbidden by default unless a future phase explicitly allows it.

## 12. Standard final report format

Use the phase-specific final report format when provided. Otherwise use this concise structure:

```text
Phase <number> Final Report

1. Commit
- Hash:
- Message:
- Push status:

2. Files changed
- Created:
- Modified:
- Migration/schema changes:
- Real data files added:
- Raw CSV files added:
- DB files added:

3. What changed
- Summary:
- Tests:
- Docs:

4. Guardrails confirmed
- No UI/browser behavior changed:
- No DB write:
- No schema/migration:
- No import/upload/API added:
- No real/raw CSV:
- No recommendation/target/fair value/risk scoring:
- No production/source approval overclaim:

5. Validation
- Focused tests:
- npx prisma validate:
- npx tsc --noEmit:
- npm run lint:
- npm test:
- npm run build, if run:

6. Browser
- Browser verification run?:
- If not, why:

7. Final git status
- Working tree:
```

## 13. How to handle failed validation

If validation fails:

1. Stop and inspect the failing command output.
2. Fix only failures caused by the current phase when feasible.
3. Re-run the focused failing command, then the required validation set.
4. Do not commit or push while required validation is failing.
5. If the failure is pre-existing or outside scope, report it clearly with command names and the relevant error summary.

## 14. How to handle unexpected generated/dev files

If generated/dev-only files appear:

1. Inspect them with `git status` and `git diff --name-only`.
2. Confirm they are not intended phase outputs.
3. Restore only unintended generated/dev files.
4. Re-check `git status`.

Common restore candidates:

```bash
git restore next-env.d.ts tsconfig.tsbuildinfo src/generated/prisma
```

Do not restore intended docs/test/source changes.

## 15. How to keep future prompts short

Future prompts should reference this manual and the guardrails/status docs instead of repeating stable rules.

Keep phase prompts to:

- current latest phase and commit;
- phase title;
- goal;
- allowed scope;
- forbidden additions beyond this manual and guardrails;
- validation deltas;
- commit message;
- final report deltas, if any.

## Compressed Future Prompt Template

```text
Continue Atelier Finance on main.

Before changing files, read and follow:
- docs/product/CODEX_OPERATING_MANUAL.md
- docs/product/ATELIER_FINANCE_GUARDRAILS.md
- docs/product/IMPLEMENTATION_PHASE_STATUS.md

Current latest completed phase:
- Phase XX
- Commit: <hash> <message>

Phase YY - <phase title>

Goal:
<phase-specific goal>

Allowed:
<phase-specific allowed scope>

Forbidden additions:
<phase-specific forbidden additions beyond the manual/guardrails>

Validation:
Use the standard validation from CODEX_OPERATING_MANUAL.md.
Add focused tests for changed code.
Run browser verification if UI/browser-visible behavior changes.

Commit:
<phase commit message>

Final report:
Use the standard report format from CODEX_OPERATING_MANUAL.md.
```
