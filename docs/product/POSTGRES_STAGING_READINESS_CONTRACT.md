# PostgreSQL Staging Readiness Contract (Phase 142G-P)

## A. Staging Environment Contract
* `DATABASE_URL` phải là PostgreSQL staging URL thật trên cloud/hệ thống quản trị, không được dùng `localhost` hoặc DB dùng chung.
* Không được dùng `localhost` trong staging.
* Không được dùng URL trỏ tới file: `./dev.db`.
* Không được load `.env.local` ở CI/Staging/Vercel. Các môi trường này chỉ được cấu hình biến thông qua Secret Manager hoặc Panel.
* Không commit `.env`, `.env.local`, hay bất kỳ secret nào.
* Staging DB phải tách biệt hoàn toàn với Production DB.
* Staging DB phải có tính chất disposable/recoverable (có thể drop, tạo lại dễ dàng phục vụ test).
* Staging DB phải bắt đầu empty hoặc ở một trạng thái known-clean, không chứa rác từ môi trường khác.
* Quá trình staging migration phải sử dụng migration PostgreSQL baseline hiện tại (`20260625164749_init_postgres`).
* Production credentials tuyệt đối không được dùng cho Staging, không được xuất hiện ở CI.

## B. Environment Variables
### Required
* `DATABASE_URL`: Bắt buộc cung cấp thông qua CI/CD Pipeline.

### Optional / Safe
* Các biến runtime không chứa secret (ví dụ: `NEXT_PUBLIC_API_URL`).

### Forbidden
* `DATABASE_URL` dạng SQLite `file:`
* `DATABASE_URL` trỏ tới Production DB.
* Load file `.env.local` trong môi trường Staging/CI.
* Các cờ (flags) local import (`ATELIER_LOCAL_IMPORTS_ENABLED=true`) khi chưa có explicit approval từ hệ thống/admin.

## C. Staging Migration Procedure
Trong thực tế, quá trình chạy migrate staging sẽ thực hiện như sau:
1. Checkout nhánh staging tương ứng.
2. Thiết lập staging `DATABASE_URL` từ CI secret.
3. Validate rằng `DATABASE_URL` là chuỗi PostgreSQL hợp lệ và không chứa `localhost`, `file:`, `dev.db`.
4. Chạy `npx prisma validate`.
5. Chạy `npx prisma migrate deploy` hoặc custom command tuỳ CI/CD để áp dụng cấu trúc.
6. Verify rằng các bảng (tables) đã tồn tại đầy đủ trong database bằng kết nối an toàn.
7. KHÔNG chạy import data tự động trong quá trình migrate.
8. Chạy validation/build smoke để đảm bảo source code tương thích schema vừa deploy.

## D. Validation Gate for Actual 142G
Phase 142G chỉ được cấp chứng nhận `Pass` nếu và chỉ nếu:
* `npx prisma validate` pass.
* `npx prisma generate` pass.
* Migration áp dụng được lên Staging DB.
* `npm run typecheck` pass.
* `npm run lint` pass.
* `npm test` pass (phải ghi chú cụ thể các skipped tests chưa thể run mà không có `dev.db`).
* `npm run build` pass với staging PostgreSQL env thuần tuý.
* Không có bất kỳ lệnh write/mutation nào nhắm đến Production.
* Không tự động import data từ dump.
* Không vội vã merge main khi chưa có sự xác nhận.
* Evidence report hoàn tất 100%.

## E. Skipped Tests Policy
Hiện đang có 7 file test và 48 tests bị skip bao gồm:
- `financial-statement-csv-to-prisma-temp-db-write-trial.test.ts`
- `fpt-financial-statement-prisma-temp-db-write-verification.test.ts`
- `financials-unit-metadata-sidecar-schema.test.ts`
- `fpt-pdf-reviewed-post-import-smoke.test.ts`
- `hpg-pdf-reviewed-post-import-smoke.test.ts`
- `msn-pdf-reviewed-post-import-smoke.test.ts`
- `market-pvt-unit-metadata-persistence-boundary.test.ts`

**Phân loại:**
- Thuộc nhóm test SQLite adapter / SQLite temp DB.
- Thuộc nhóm test phụ thuộc hardcode migration path cũ (đã xoá).
- Thuộc nhóm data-dependent post-import smoke tests (chờ file `dev.db` thật).

**Kết luận:**
- Chấp nhận trạng thái skip để thực hiện staging infra smoke test (chứng minh Postgres hoạt động) và sẽ được ghi vào evidence.
- Trạng thái skip này KHÔNG đủ điều kiện để merge vào nhánh main hoặc tuyên bố sẵn sàng cho production.
- Phải thực hiện quá trình viết lại (rewrite) bằng mock data hoặc test-container trước lần merge PostgreSQL quyết định.

## F. Rollback Plan
- Trình kiểm tra phải dừng ngay trước khi import hoặc deploy lên Production.
- Nếu staging lỗi: Revert PR/branch hiện tại, drop staging DB.
- Không chạm hoặc can thiệp Production.
- Không được phép merge main nếu validation hoặc staging process fail.
- Preserve toàn bộ console logs và evidence ở dạng văn bản (tuân thủ nguyên tắc không được rò rỉ password/secret).

## G. Exit criteria from 142G-P
- Contract document exists (File này).
- Evidence exists.
- Không thực thi bất kỳ thao tác nào với Staging DB.
- Không chạy migrate trên Staging DB.
- Không Import data.
- Quá trình validation cục bộ (docs-only pass) hoàn tất.
