# Vnstock Real Fetcher Feasibility Audit

Phase: 31J - Real Local Research Fetcher Feasibility Audit

## 1. Purpose

This document evaluates whether Atelier Finance should add a real local research fetcher for Vnstock market prices.

Phase 31J does not implement a real fetcher, add a dependency, call Vnstock, call upstream data APIs, scrape, download market data, write to the database, or approve any production source. The goal is to choose a safe direction for a later phase.

## 2. Current Pipeline Status

- `package.json` includes the local npm script `import:market-prices:vnstock:local`.
- The command runner fails closed by default and requires explicit env safety flags plus local import acknowledgement.
- The connector and persistence boundaries exist and are covered by tests.
- The real fetcher is not configured.
- Phase 31I smoke tests did not run `--write`, did not write DB records, and did not create raw output.
- There is no public API, UI button, cron job, scheduler, or app-start import.
- Source metadata keeps `productionApproved:false`.

## 3. Vnstock Ecosystem Finding

Public documentation checked during this audit:

- Vnstock homepage: https://vnstocks.com/
- Vnstock docs landing page: https://vnstocks.com/docs
- GitHub source: https://github.com/thinh-vu/vnstock
- PyPI package: https://pypi.org/project/vnstock/

Findings:

- Vnstock is primarily presented as a Python package/toolkit.
- Public install guidance uses PyPI, including `pip install -U vnstock`.
- The current PyPI project metadata lists Python support and `Requires: Python >=3.10`.
- Public docs describe Vnstock as a tool that reads and normalizes data from public websites, APIs, pages, feeds, and related sources.
- Public docs say Vnstock does not store or redistribute source data; users connect to sources directly and are responsible for legal use.
- PyPI lists a custom license focused on personal, research, and non-commercial use, with separate contact for other use.
- No official TypeScript/JavaScript SDK from the Vnstock project was identified during this audit.
- npm search results show community packages with similar names, but Phase 31J does not treat them as an official Vnstock SDK and does not evaluate them for integration.

## 4. Integration Options

| Option | Idea | Advantages | Risks / Tradeoffs |
| --- | --- | --- | --- |
| Option A - Python local bridge / subprocess | The Next/TypeScript command calls a local Python script. The Python script uses the Vnstock package and returns JSON to the existing TypeScript normalization boundary. | Matches Vnstock's Python-first ecosystem. Can follow current Vnstock docs more directly. | Requires a Python environment and pip dependency. Harder to reproduce on Windows and other machines. Adds path, encoding, timeout, process isolation, and output validation risks. May complicate repo setup. Still requires source-rights review. |
| Option B - TypeScript/Node fetcher direct | A Node fetcher calls a documented source/API directly or uses a JS package if one is later approved. | Fits the current Next/TypeScript repo and test setup. Easier to keep inside the existing command runner. | If no official SDK is available, this can become reverse-engineered scraping or unofficial API use. Legal/ToS and source ownership risk can be higher. |
| Option C - Manual export/import bridge | The user runs Vnstock outside this repo and exports CSV manually; Atelier Finance imports local files through reviewed import flows. | Lowest technical risk. No Python subprocess in the app. No app network fetch. Easy to explain for academic/local research. | Not automatic. Not live. Requires manual steps outside the app. |
| Option D - External local sidecar later | A separate local tool outside the Next app fetches data and exports JSON/CSV; the app only imports local files. | Separates fetch risk from app runtime. Keeps the app fail-closed. Can be documented and versioned independently. | Adds operational overhead. Requires clear docs and file-contract validation. |

## 5. Recommended Direction

Do not implement a real fetcher in Phase 31J. Do not add Python, Vnstock, or npm data dependencies yet.

Recommended next phase:

Phase 31K - Offline Fetcher Contract With Sample Fixture

This should define and test the exact JSON/CSV contract with local sample fixtures before any real data call. It verifies ticker/date/OHLCV/tradingValue mapping, null handling, rejection behavior, warnings, and metadata enforcement without adding dependency or network risk.

Alternative next phase:

Phase 31K - Manual Vnstock Export To Local Import Bridge

This keeps Vnstock usage outside the app runtime and lets Atelier Finance import manually reviewed local files. It is the safest path if the goal is thesis/academic validation with minimal integration risk.

If a later phase chooses a Python bridge, it must remain disabled by default, local only, env/ACK gated, dry-run by default, excluded from public API/UI/cron/app-start paths, and must never set production approval to true.

## 6. Data Contract Needed Before Real Fetcher

A future real fetcher must return only this minimum record shape:

```ts
{
  ticker: string;
  date: string;
  open: number | string | null;
  high: number | string | null;
  low: number | string | null;
  close: number | string | null;
  volume: number | string | null;
  tradingValue?: number | string | null;
}
```

Rules:

- Do not use `0` as a replacement for missing values.
- Missing values remain `null`.
- Invalid numbers become `null` plus a warning.
- Invalid ticker or date is rejected safely.
- Do not return recommendation, rating, target price, or action-signal fields.
- Do not commit raw payloads.

## 7. Safety Requirements For Any Future Real Fetcher

- Disabled by default.
- Local only.
- Env safety flags required.
- Local import acknowledgement required.
- Dry-run default.
- `--write` explicit.
- No public API, UI button, cron job, scheduler, or app-start import.
- No production approval.
- Source metadata required.
- Attribution required where applicable.
- No raw data, generated output, or local DB files committed.
- Rate limiting and timeouts required if network is ever added.
- Small ticker/date range only.
- No bulk all-market import by default.
- No intraday/live path in the first real fetcher.
- No financial statements or fundamentals in this market-price path.

## 8. Decision Checklist Before Coding Real Fetcher

- Is the integration path Python bridge, TypeScript direct, manual export, or sidecar?
- Has the user explicitly approved dependency addition?
- Has the user explicitly approved local network/data fetch?
- Is there a sample fixture/data contract test?
- Are source metadata and `productionApproved:false` enforced?
- Do smoke tests still fail closed?
- Are docs updated?
- Is git status clean?
- Are local DB, raw output, generated files, and temporary external docs excluded?

## 9. Non-Goals

Phase 31J does not:

- Add a real fetcher.
- Install Vnstock.
- Install Python dependencies.
- Install npm data dependencies.
- Call Vnstock.
- Call upstream data APIs.
- Scrape or download market data.
- Add public API.
- Add UI button.
- Add cron or scheduler.
- Auto import.
- Write DB records.
- Modify Prisma schema.
- Seed real data.
- Approve any production source.

## 10. Phase 31K Offline Fetcher Contract

Phase 31K defines `docs/product/VNSTOCK_OFFLINE_FETCHER_CONTRACT.md` and a fake/sample fixture before any real fetcher work. It adds no real fetcher, dependency, network call, Vnstock call, raw data download, DB write, or production source approval.

## 11. Phase 31L Manual Export/Import Bridge

Phase 31L implements the safer manual export/import bridge before any Python bridge or real fetcher. It reads user-provided local CSV/JSON files that conform to the offline contract. The real fetcher remains not configured.
