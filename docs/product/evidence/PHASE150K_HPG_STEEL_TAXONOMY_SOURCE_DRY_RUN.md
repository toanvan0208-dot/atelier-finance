# Phase 150K: HPG Steel Taxonomy Source Package Dry Run

## Objective
Add one manually reviewed taxonomy source package for HPG steel/materials mapping using Vietstock provider taxonomy, then dry-run the taxonomy reviewed-source validator.

## Changes Made
- Updated `scripts/industry-taxonomy-reviewed-sources.ts` to include the HPG source package for `industrySourcePackages` and `companyIndustrySourcePackages`.
- Sourced from Vietstock: https://finance.vietstock.vn/HPG/ho-so-doanh-nghiep.htm
- Mapped to `STEEL_MATERIALS` with role `primary` and confidence `medium`.
- Data mode set to `research_only`, `productionApproved` set to `false`.

## Expected Output Packages
1. One Industry package (`industryCode=STEEL_MATERIALS`).
2. One CompanyIndustry package (`ticker=HPG`).
3. No peer group package yet.

## Validation Performed
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- Targeted lint for touched files
- `node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-taxonomy-reviewed-sources.ts`

The dry run confirms that the source package structure matches expectations and correctly resolves the relationships.
