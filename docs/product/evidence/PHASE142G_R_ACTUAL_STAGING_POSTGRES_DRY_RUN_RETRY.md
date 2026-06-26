# Phase 142G-R: Retry actual staging PostgreSQL dry run with local secret file

## 1. Phase Information
- **Phase Name:** Retry actual staging PostgreSQL dry run with local secret file
- **Branch:** `phase-142f-postgres-docker-dry-run`
- **Starting Commit:** `d3f4069551bd3a3d22bc44755590869890673c03`
- **Staging Provider:** Supabase
- **Connection Type:** Session pooler
- **Credentials Source:** `ignored_local_env_file` (`.env.staging.local`)
- **Secret File Committed:** false
- **Full connection string redacted:** yes

## 2. Pre-migration Checks
- **Connection Check:** OK
- **Initial Public Schema Table Count:** 0
- Biến môi trường đã được bọc qua Node process để ngăn chặn rò rỉ URL trong logs/stdout.

## 3. Migration
- **Command Used:** `npx prisma migrate deploy`
- **Migration Result:** Áp dụng thành công 1 migration.
- **Migration Name:** `20260625164749_init_postgres`

## 4. Post-migration Schema Verification
- **Tables Count:** 15 (bao gồm `_prisma_migrations`, `Company`, `FinancialStatement`, v.v.)
- **Enums Count:** Đầy đủ 31 enums tuân thủ prisma schema (`PeriodType`, `DataMode`, v.v.)
- **Business Data Imported:** Không có dữ liệu business nào được đưa vào. Các bảng hoàn toàn rỗng.

## 5. Validation Results
- **`prisma validate`**: Pass
- **`prisma generate`**: Pass
- **`typecheck`**: Pass
- **`lint`**: Pass
- **`tests`**: Pass with skips (135 files passed, 7 skipped; 1137 tests passed, 48 skipped).
- **`build`**: Pass (Tất cả static/dynamic routes được sinh thành công).

## 6. DB Write Scope & Data Import
- **Scope:** Staging schema migration only.
- **Data Import:** No.
- **Deploy:** No.
- **Merge to main:** No.

## 7. Readiness
- `readyForDataImportPhase`: **true**
- `readyForMainMerge`: **false** (vẫn cần giải quyết 7 skipped test files do phụ thuộc local SQLite logic).
- `readyForProduction`: **false**
