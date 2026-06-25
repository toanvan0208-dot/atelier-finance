# Phase 142F-R: PostgreSQL Dry-Run Branch Review and Blocker Audit

## 1. Branch Information
- **Phase:** 142F-R
- **Branch:** `phase-142f-postgres-docker-dry-run`
- **Reviewed Commit Hash:** `c8eb6ec6fc36b5e3a2800f8a75a62aa79a8f0fb9`
- **Compared Against:** `origin/main`

## 2. Diff Summary
- **Files Changed:** `package.json`, `package-lock.json`, `prisma/schema.prisma`, `prisma.config.ts`, `.env.example`, `scripts/reset-local-db.mjs` (indirectly via package manager), and various test skip updates. Total 49 files changed, bao gồm sự thêm vào của các file source-pdfs và ERD từ các phase trước.
- **Provider/Config/Runtime Changes:** `prisma/schema.prisma` (provider switched to `postgresql`), `prisma.config.ts` (removed SQLite fallback URL), `.env.example` (PostgreSQL local connection string).
- **Migration Files:** Tạo baseline migration `20260625164749_init_postgres`, xóa các file migration SQLite cũ.
- **Test Skips/Mocks:** Dùng `describe.skip` cho 7 files (2 mock từ trước, 5 skip mới) dựa trên SQLite hoặc data cứng. Mocked logic `PrismaBetterSqlite3` trong adapter test phụ.
- **Evidence Files:** Thêm `PHASE142F_POSTGRES_DOCKER_DRY_RUN_RESULT.md/json`.
- **Out of Scope Files:** Các file PDF evidence lớn đã được commit, không gây lỗi runtime nhưng khiến repo nặng hơn.

## 3. Migration SQL Review
- **Path:** `prisma/migrations/20260625164749_init_postgres/migration.sql`
- **Review Checkpoints:**
  - [x] **Enums:** Được tạo bằng native PostgreSQL `CREATE TYPE ... AS ENUM`. (Ví dụ: `DataMode`, `SourceType`).
  - [x] **DateTime Mapping:** Sử dụng `TIMESTAMP(3)` hoàn toàn hợp lý với Prisma.
  - [x] **Decimal Precision/Scale:** Sử dụng kiểu `DECIMAL(65,30)` bảo đảm không làm mất thông tin số liệu nghìn tỷ VND hoặc shares. Không chuyển nhầm sang Float/BigInt.
  - [x] **Nullable Fields:** Giữ nguyên các trường tuỳ chọn theo đúng schema (vd: `revenue DECIMAL(65,30)`).
  - [x] **Indexes/Unique Constraints:** Đầy đủ `CREATE UNIQUE INDEX` và `CREATE INDEX`.
  - [x] **Foreign Keys/Cascade:** Được định nghĩa rõ ràng với `ON DELETE CASCADE` ở unit metadata, `ON DELETE SET NULL` ở profileSourceId.
  - [x] **Unit Metadata Sidecar Relations:** Cascade setup chuẩn.
  - [x] **Data Manipulation:** Không có câu lệnh UPDATE/INSERT nào, đây thuần túy là DDL.
  - [x] **JSON-like Strings:** Các fields JSON-like (e.g. `missingFields`, `warnings`) đang được khai báo an toàn là `TEXT NOT NULL DEFAULT '[]'` -> Không gặp issue chuyển đổi `Json` bất ngờ từ Prisma.
- **Issues/Blockers:** 0 blockers từ code migration SQL sinh ra. PostgreSQL script này hoàn toàn có thể dùng làm baseline an toàn.

## 4. Skipped Tests Audit
Phát hiện 7 file test sử dụng `describe.skip`:
1. `financial-statement-csv-to-prisma-temp-db-write-trial.test.ts`: Test workflow Temp DB ngày xưa, dựa dẫm vào driver `PrismaBetterSqlite3` -> Lỗi nếu chạy Postgres.
2. `fpt-financial-statement-prisma-temp-db-write-verification.test.ts`: Kiểm tra ghi Temp SQLite file DB.
3. `financials-unit-metadata-sidecar-schema.test.ts`: Bị skip do hardcode đọc file nội dung `prisma/migrations/20260621070000_phase_68.../migration.sql` (file đã bị xoá).
4. `fpt-pdf-reviewed-post-import-smoke.test.ts`: Test kiểm tra dữ liệu thật, mong đợi FPT có trong `dev.db`.
5. `hpg-pdf-reviewed-post-import-smoke.test.ts`: Tương tự (HPG).
6. `msn-pdf-reviewed-post-import-smoke.test.ts`: Tương tự (MSN).
7. `market-pvt-unit-metadata-persistence-boundary.test.ts`: Hardcode `migration.sql` SQLite Phase 75 cũ.

**Rủi ro:** Khi merge lên production, ta đang mù coverage ở post-import smoke tests (4,5,6).
**Đề xuất xử lý trước staging:** Xóa hẳn test 1, 2, 3, 7 (vì legacy Temp DB bị loại bỏ và code đọc SQLite migrate đã chết). Test 4, 5, 6 cần thiết kế cơ chế seed data động để test logic mà không phụ thuộc file `dev.db` tĩnh.

## 5. SQLite Dependency Audit
Sử dụng tìm kiếm với các term `PrismaBetterSqlite3`, `sqlite`, `dev.db`, tìm thấy các loại blocker sau:
- **Runtime Blockers (Rất Nguy Hiểm):**
  - `src/lib/data-sources/financial-statement-local-write-guard.ts`: Hàm chặn cứng không cho write database nếu URL không chứa `file:` và mode `local_sqlite_dev`. Nếu mang script này lên Production sẽ khiến toàn bộ lệnh write bị từ chối.
  - `src/lib/data-sources/reviewed-financial-missing-fields-import.ts` & `reviewed-source-records-import.ts`: Chứa kiểm tra `if (confirmWrite && databaseUrl?.trim() !== "file:./dev.db") { errors.push(...) }`.
- **Script/Command Blockers:**
  - `src/features/financials/lib/fpt-financial-statement-prisma-temp-db-write-verification.ts`: Chứa code mock `PrismaBetterSqlite3`.
  - `package.json`:
    - `db:migrate` trỏ cứng `prisma/migrations/20260618162000.../migration.sql` (file không còn tồn tại).
    - `db:reset` gọi `scripts/reset-local-db.mjs`.
  - `scripts/reset-local-db.mjs`: Script hardcode tìm xoá file `dev.db` và `prisma/dev.db`.
- **Documentation/Type Mentions (Chấp nhận được):**
  - `financials-unit-metadata-storage-plan.ts` định nghĩa type `provider: "sqlite" | "postgresql"`.

## 6. Validation Results
Môi trường Dry Run với Provider PostgreSQL vượt qua các bước kiểm định cấu trúc:
- `npx prisma validate`: **Pass**
- `npm run typecheck`: **Pass**
- `npm run lint`: **Pass**
- `npm test`: **Pass_with_skips**
- `npm run build`: **Pass**

## 7. Recommendation
- **`readyFor142G`**: `true`
- **Required Fixes before Phase 142G/Staging:**
  1. Loại bỏ các file test legacy Temp DB và test đọc text file migration cũ.
  2. Xoá điều kiện chặn cứng `file:./dev.db` và cập nhật `financial-statement-local-write-guard.ts` để hỗ trợ PostgreSQL staging/prod.
  3. Xoá/Cập nhật các lệnh `db:migrate`, `db:reset` ở `package.json` và script reset để thao tác với PostgreSQL thay vì xóa file `.db`.
  4. Xem xét chiến lược push dữ liệu mẫu cho post-import smoke test thay vì dựa vào `dev.db`.
