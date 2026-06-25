# Phase 142G-P: Staging PostgreSQL Readiness Plan

## 1. Phase Information
- **Phase Name:** Staging PostgreSQL readiness plan and environment contract
- **Branch:** `phase-142f-postgres-docker-dry-run`
- **Starting Commit:** `72e6182dd9342c1b8580d6acd8418ef4d753da03`

## 2. Files Changed (Created)
- `docs/product/POSTGRES_STAGING_READINESS_CONTRACT.md`
- `docs/product/POSTGRES_STAGING_DRY_RUN_CHECKLIST.md`
- `docs/product/evidence/PHASE142G_P_POSTGRES_STAGING_READINESS_PLAN.md`
- `docs/product/evidence/PHASE142G_P_POSTGRES_STAGING_READINESS_PLAN_RESULT.json`

## 3. What Was Prepared
- Thiết lập bảng hợp đồng chặt chẽ (Contract) đối với môi trường Staging.
- Phác thảo Checklist cho toàn bộ quá trình Phase 142G (Actual Staging Dry-run).
- Định nghĩa rõ các điều kiện dừng khẩn cấp (Stop Conditions) và kế hoạch Rollback.
- Xác định và khoanh vùng 7 file test chưa tương thích để xử lý sau.

## 4. What Was Explicitly Not Done
- No staging DB created.
- No staging migrate.
- No production DB created or touched.
- No data import run.
- No Vercel or production deployment.
- No merge to `main`.

## 5. Current Readiness
- `readyFor142GActual`: **true** (Checklist và quy tắc đã thiết lập đầy đủ).
- `readyForMainMerge`: **false**.
- `readyForProduction`: **false**.

## 6. Remaining Blockers
- 7 test files phụ thuộc vào `PrismaBetterSqlite3`, SQLite data tĩnh (file `dev.db`) và hardcode path của các bản migration SQLite trước đó.
- Các hàm/phần bổ trợ legacy đang sử dụng adapter trực tiếp vào file SQLite.
- Các test post-import smoke cần phải viết lại bằng mock data provider hoặc test-container PostgreSQL, thay vì đọc data giả định từ file `dev.db`.
