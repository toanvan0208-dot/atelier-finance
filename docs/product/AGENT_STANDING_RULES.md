# Atelier Finance Agent Standing Rules

These rules apply by default to every future phase in this repository. A phase may broaden permissions only when its scope explicitly says so. Silence does not authorize writes, imports, schema changes, migrations, source-priority changes, or production approval.

## 1. Repository Hygiene

- Never use `git add .`.
- Never use `git push --force`. Use `git push origin <branch>` without `--force`.
- Before making changes, run:
  - `git status --short`
  - `git diff --stat`
  - `git diff`
- If tracked changes unrelated to the requested phase exist, stop and report them before editing.
- Do not stage, commit, delete, move, rename, or modify unrelated local assets, including:
  - `docs/thesis/`
  - `diagrams/`
  - `docs/product/evidence/source-pdfs/`
  - PDF binaries
  - images, screenshots, temporary files, OCR output, and rendered inspection artifacts
  - `dev.db`, SQLite journal/WAL files, or any local database artifact
  - `.env`, `.env.local`, credentials, tokens, connection strings containing secrets, or other secret material
- Stage files by explicit path and verify the staged file list before committing.
- If validation or build commands modify `tsconfig.tsbuildinfo`, restore it before staging:

```bash
git checkout -- tsconfig.tsbuildinfo
```

- Preserve unrelated user work. Do not reset, restore, delete, or overwrite it unless the user explicitly authorizes that exact action.

## 2. Required Validation

Before committing a completed phase, run:

```bash
npx prisma validate
npm run typecheck
npm run lint
npm test
npm run build
```

Validation rules:

- Every command must finish with exit code `0`.
- If the first `npm test` run times out because of Prisma temporary-database setup, it may be run one more time.
- Do not report tests as passing unless the final `npm test` exit code is `0`.
- Record the exact final test-file count and test count.
- Do not hide, downgrade, or omit a failed validation command.

## 3. Data Safety

- Every phase is read-only/audit-only by default.
- Do not write to a database, import data, run confirm-write, change schema, create/delete migrations, or alter database providers unless the phase explicitly authorizes it.
- `--confirm-write` may be used only when the current phase explicitly permits the exact controlled write.
- Never treat sample, mock, demo, fallback, fixture, placeholder, or synthetic data as real reviewed data.
- Never convert missing data to `0`.
- Missing or uncertain data must remain `null`, `N/A`, `Chưa đủ dữ liệu`, `needs_review`, `ambiguous`, or an equivalent explicit missing state.
- Keep reviewed-preview and research data at:
  - `dataMode: research_only`
  - `productionApproved: false`
- Never set `productionApproved: true` for local, manual, provider, research, candidate, or reviewed-preview data.
- Never describe such data as production-approved, official investment-grade data, or equivalent.
- Never map `totalLiabilities` to `totalDebt`.
- Never use accounts payable, trade payables, or general operating liabilities as debt.
- Never use bank deposits, customer deposits, or general banking liabilities as `totalDebt`.
- Derive `totalDebt` only from explicit interest-bearing debt components with clear units and no double counting.
- VCB remains on a bank-specific/candidate path. Until a dedicated bank model exists:
  - do not import VCB through the corporate reviewed-preview path;
  - keep `totalDebt` as `null` / `needs_bank_mapping`;
  - do not infer debt from deposits or total liabilities.

## 4. Product and Investment Guardrails

Atelier Finance is a decision-support and financial-literacy product. It must not provide investment recommendations.

- No buy/sell/hold recommendation.
- No trading signal or action instruction.
- No target price, fair value, upside, or downside presented as investment advice.
- Do not call a stock good, bad, attractive, promising, safe, or worth buying.
- Do not conclude that a stock is cheap or expensive as a recommendation.
- Do not convert risk scores, checklists, technical indicators, valuation readiness, or data availability into an action conclusion.
- AI may explain available evidence, provenance, limitations, calculations, and missing data. It must not provide investment advice.

## 5. Evidence and Final Reporting

Every completed phase must include:

- An evidence Markdown file under `docs/product/evidence/`.
- A small structured JSON artifact when a script output or machine-readable result is useful.
- Clear scope, commands, findings, guardrails, validation results, and next recommended phase.

The final report must state:

- commit hash;
- whether the commit was pushed;
- files changed;
- whether any DB write/import occurred;
- whether schema or migrations changed;
- whether any binary, temporary, local DB, environment, or secret material leaked into the commit;
- exact validation results, including test-file and test counts;
- final `git status --short`.

Before commit, verify:

```bash
git status --short
git diff --stat
git diff
git diff --cached --check
git diff --cached --name-only
```

Commit and push only when the staged diff is exactly within phase scope.
