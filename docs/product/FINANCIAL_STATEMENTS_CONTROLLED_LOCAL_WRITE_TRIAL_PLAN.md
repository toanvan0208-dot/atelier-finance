# Financial Statements Controlled Local Write Trial Plan

Phase: 44 - Financial Statements Controlled Local Write Trial Plan

Date: 2026-06-20

## 1. Goal

Phase 44 defines the policy and checklist required before a future controlled local financial statement DB write trial.

This phase prepares conditions for a possible Phase 45 first local DB write trial. It does not write DB rows, enable a write flag, import real BCTC data, add a public upload API, approve a production source, or wire Financials UI runtime behavior.

## 2. Why This Follows Phase 43

Phase 43 verified the dry-run CLI with a temporary synthetic CSV outside the repo.

Before any local write trial can be allowed, the project needs an explicit policy for:

- when a write is eligible
- which confirmations are mandatory
- what data scope is allowed
- how source metadata must remain local/research-only
- how to verify and recover after a write trial

The current Phase 42 CLI still rejects write-like flags. Phase 44 documents future policy only.

Phase 45 implements the first controlled local DB write trial in `FINANCIAL_STATEMENTS_FIRST_LOCAL_DB_WRITE_TRIAL.md`. It uses a separate `financials:write-trial` command, requires the Phase 44 confirmations, writes synthetic accepted dry-run rows only to a local SQLite/dev DB, and does not change Financials UI runtime behavior.

Phase 46 records read-back evidence and cleanup policy in `FINANCIAL_STATEMENTS_READ_BACK_AND_CLEANUP_POLICY.md`. It confirms the Phase 45 synthetic rows can be read back safely and defines sourceLabel-scoped cleanup rules without running cleanup by default.

Phase 47 adds a Financials DB-backed runtime boundary in `FINANCIALS_DB_BACKED_RUNTIME_BOUNDARY.md`. It uses explicit gating for local DB reads and keeps default runtime behavior on sample/static fallback.

## 3. Write Eligibility Criteria

A future financial statement local write trial may be considered only when all conditions are true:

- A dry-run was run first.
- `acceptedCount` is greater than `0`.
- `rejectedCount` and `skippedCount` were reviewed by the user.
- `sourceLabel` clearly identifies local/research-only input.
- `dataMode` is `research_only` or an equivalent local research mode.
- production approval remains false for the input and output.
- The file is local `.csv` or `.txt`.
- Remote URLs are rejected.
- Excel and PDF files are rejected unless a later parser phase adds an explicit reviewed parser policy.
- The raw file is not committed.
- The target DB is a local dev/research database, not a production database.
- `DATABASE_URL` points to local SQLite/dev DB or an equivalent local research DB.
- The user explicitly confirms they want a local write trial.

If any condition is missing, the future write command must fail closed.

## 4. Required Future Confirmation Flags

A future write command should require all of these confirmations before writing:

- `--write`
- `--confirm-local-research-only`
- `--confirm-no-production-source`
- `--confirm-reviewed-dry-run`
- `--source-label <label>`
- `--data-mode research_only`

If any confirmation flag is missing, the command must reject the run.

Phase 44 does not enable these flags. The current CLI continues to reject `--write`.

## 5. Non-negotiable Write Restrictions

A future write trial must not:

- mark local/research-only data as production-approved
- call external APIs
- accept remote URLs
- reset or seed the DB
- write when dry-run has a fatal file, read, or parse error
- write rejected rows
- write skipped rows
- overwrite or merge duplicates without explicit policy
- create an official source claim
- commit a DB file after the run
- commit raw CSV files
- commit generated JSON/report output
- add public upload/API behavior
- change Financials UI runtime behavior

## 6. Proposed Phase 45 Write Behavior

A future Phase 45 write implementation should:

- use accepted rows from the dry-run only
- write only normalized accepted rows
- preserve `null` values
- never replace missing values with `0`
- keep rejected and skipped rows out of DB
- record `sourceLabel`
- record `dataMode`
- keep production approval false for every written row
- report `insertedCount`, `updatedCount`, `skippedCount`, and `rejectedCount`

The duplicate/upsert policy must be explicit before implementation.

Acceptable future options:

- insert-only with duplicate protection
- upsert by `ticker + fiscalYear + fiscalQuarter/periodType + sourceLabel + dataMode`

The project should choose one policy before adding write behavior.

## 7. Pre-write Checklist

Before any future write trial:

- Confirm `git status` is clean or contains only expected docs/code changes.
- Run the dry-run command.
- Review dry-run summary and JSON fields if needed.
- Confirm accepted rows are sane for the intended local research trial.
- Confirm rejected and skipped rows were reviewed.
- Confirm no raw CSV is inside the repo.
- Confirm no generated report output is inside the repo.
- Confirm `DATABASE_URL`.
- Confirm target DB is not production.
- Optionally make a DB backup outside the repo.
- Confirm any backup will not be committed.
- Confirm source wording does not overclaim official, realtime, production, or provider-approved data.

## 8. Post-write Verification Checklist

After a future write trial:

- Query DB count by ticker, `sourceLabel`, and `dataMode`.
- Verify `insertedCount` and `updatedCount`.
- Verify production approval remains false for all written rows.
- Verify rejected rows are not in DB.
- Verify skipped rows are not in DB.
- Verify missing values remain `null`.
- Verify missing values were not replaced with `0`.
- Verify duplicate policy behavior.
- Verify no investment action fields were created.
- Verify `git status` does not include DB files, raw CSV, report output, backups, or temp files.

## 9. Rollback And Recovery Notes

If a future write trial goes wrong:

- Do not commit the DB file.
- Restore the local dev DB from backup if one was made.
- If no backup exists, use a documented manual cleanup query limited to the inserted local research rows.
- Do not add a destructive cleanup script until a separate policy exists.
- Do not run `db:reset` unless the user explicitly confirms and understands it may remove local evidence.

## 10. Safety Notes

Phase 44 does not:

- write DB rows
- enable a write flag
- import real BCTC data
- commit raw CSV
- commit generated JSON/report output
- reset or seed DB
- call external APIs
- scrape or download data
- add public API/upload behavior
- change Financials UI runtime behavior
- approve a production provider
- claim official/realtime/production financial data
- create investment action outputs

## 11. Limitations

- Plan and policy only.
- No DB write was performed.
- No write implementation was added.
- No real BCTC file was imported.
- No production financial data provider was approved.
- No Excel/PDF parser was added.
- No public upload/API route was added.
- No Financials UI runtime path was changed.
- Phase 45 implements a controlled local write trial using this policy. It remains synthetic/local research only and does not approve a production source or import real BCTC data.
- Phase 46 adds read-back and cleanup policy only. It does not run cleanup/delete commands by default.
- Phase 47 adds runtime boundary only. It does not change the controlled write policy or add any row-removal path.

## 12. Files Changed

- `docs/product/FINANCIAL_STATEMENTS_CONTROLLED_LOCAL_WRITE_TRIAL_PLAN.md`
- `docs/product/FINANCIAL_STATEMENTS_CLI_DRY_RUN_VERIFICATION_EVIDENCE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 13. Validation Evidence

Final validation commands passed for this phase:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test` (`57` files / `414` tests)
