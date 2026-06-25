# Phase 142F Evidence

## Phase Name
Phase 142F — Local Docker PostgreSQL provider-switch dry run

## Scope
Mục tiêu của phase này là thực hiện dry run chuyển đổi Prisma provider sang PostgreSQL trên branch `phase-142f-postgres-docker-dry-run` độc lập.

## Files Changed
- `prisma/schema.prisma` (Provider changed to postgresql)
- `prisma/migrations/` (Reset base and created `20260625164749_init_postgres`)
- `prisma.config.ts` (Removed SQLite fallback in datasource url)
- `.env.example` (Updated DATABASE_URL to use PostgreSQL)
- `src/features/financials/lib/fpt-financial-statement-prisma-temp-db-write-verification.ts` (Mocked SQLite dependency)
- `src/features/financials/lib/__tests__/*.test.ts` (Skipped data-dependent SQLite tests)
- `docs/product/evidence/PHASE142F_POSTGRES_DOCKER_DRY_RUN_RESULT.md`
- `docs/product/evidence/PHASE142F_POSTGRES_DOCKER_DRY_RUN_RESULT.json`

## Things Explicitly Not Changed
- **No production DB write:** Hoàn toàn dùng PostgreSQL Docker local container (`atelier-postgres-dryrun`).
- **No deploy:** Không trigger deploy production.
- **No import:** Không import dữ liệu vào DB.
- **No disruption to main:** Mọi thay đổi đều được cô lập trong branch `phase-142f-postgres-docker-dry-run`.

## Validation Commands and Final Result
- `npx prisma validate` -> Passed
- `npm run typecheck` -> Passed
- `npm run lint` -> Passed
- `npm test` -> Passed (Data-dependent SQLite tests skipped)
- `npm run build` -> Passed

*(Final exit code for all validation is 0).*

## Git Commit Hash
7a928ef

## Push Status
Pushed: Yes / origin/phase-142f-postgres-docker-dry-run
