# Macro/Industry Readiness UI Skeleton

Phase: 88

## 1. Phase purpose

Phase 88 adds a lightweight browser-visible readiness/transparency skeleton for the existing Macro and Industry modules using the Phase 87 Macro/Industry data boundary helper.

The goal is to show that Macro/Industry data now has a defined boundary and current readiness state, without adding real ingestion, DB writes, source approval, or production claims.

## 2. Existing module/route inspection

Inspection confirmed the existing workspace module keys:

- `macro` at `/workspace?module=macro`
- `industry` at `/workspace?module=industry`
- related modules such as `screening` and `business`

Phase 88 reuses the existing `macro` and `industry` module keys. It does not create a new route or disconnected module key.

## 3. UI skeleton

The UI skeleton appears in:

- Macro page, below the Macro header;
- Industry page, below the Industry header.

It shows:

- source/evidence status as missing/partial/not approved;
- explicit unit metadata requirement;
- `productionApproved:false`;
- blocked readiness;
- required Macro/Industry fields;
- future data gates.

## 4. Phase 87 helper usage

The UI model uses:

```text
src/features/macro/lib/macro-industry-data-boundary.ts
```

The new UI model lives in:

```text
src/features/macro/lib/macro-industry-readiness-ui.ts
```

It is a pure model helper. It does not read files, write files, write DB rows, call APIs, scrape, parse files, or import real data.

## 5. Guardrail statements

Real macro/industry data imported: no

DB write performed: no

Migration/schema changed: no

External API/vnstock used: no

Parser/importer added: no

UI/browser behavior changed: yes

productionApproved/source approval added: no

Recommendation/target/fair value/risk scoring added: no

## 6. Browser verification expectations

Browser verification should check:

- `/workspace?module=macro`
- `/workspace?module=industry`

The routes should load without framework overlay or console errors. The skeleton should show source/evidence gaps, explicit unit requirements, future gates, and `productionApproved:false`.

## 7. Validation

Focused validation:

```bash
npx vitest run src/features/macro/lib/__tests__/macro-industry-readiness-ui.test.ts src/features/macro/lib/__tests__/macro-industry-data-boundary.test.ts
```

Full validation is recorded in the Phase 88 final report.
