# Phase 142G PostgreSQL Staging Dry-Run Checklist

## Pre-flight Checks
- [ ] Xác nhận branch hiện tại là `phase-142f-postgres-docker-dry-run` hoặc nhánh kế thừa.
- [ ] Môi trường chạy có đủ NPM/NodeJS và công cụ kết nối DB.

## Secret Checks
- [ ] Kiểm tra không tồn tại file `.env` hay `.env.local` ở máy/host thực thi.
- [ ] Xác nhận CI/CD variables chỉ lưu vào bộ nhớ, không tạo file vật lý nếu không có cơ chế tự xoá.
- [ ] Không có Production credentials trong process.

## Staging DB Identity Checks
- [ ] `DATABASE_URL` bắt đầu bằng `postgresql://` (hoặc `postgres://`).
- [ ] `DATABASE_URL` **không** chứa `localhost`, `127.0.0.1`, `file:`.
- [ ] `DATABASE_URL` trỏ tới cụm database được gán nhãn staging.

## Migration Command Checklist
- [ ] Chạy `npx prisma validate`.
- [ ] Chạy lệnh migrate staging hợp lệ: `npx prisma migrate deploy` (tuyệt đối không dùng `migrate dev` trên staging).
- [ ] Verify kết quả trả về: Schema sync/Migration applied thành công.

## Table Verification Checklist
- [ ] Xác nhận các bảng cốt lõi đã có mặt (`Company`, `FinancialStatement`, `MarketPrice`, ...).
- [ ] Không chứa table của dev SQLite cũ nếu không khai báo.
- [ ] Database rỗng, chỉ chứa schema và bảng `_prisma_migrations`.

## Validation Checklist
- [ ] `npx prisma generate` thành công với provider mới.
- [ ] `npm run typecheck` (tsc) không ném lỗi.
- [ ] `npm run lint` (eslint) không ném lỗi.

## Build Checklist
- [ ] Chạy `npm run build` (hoặc validation build command chuyên dụng) và pass quá trình "Collecting page data" (chứng tỏ cấu trúc code tương thích Postgres Schema).

## Skipped Tests Reporting Checklist
- [ ] Kiểm tra số lượng file test skip đúng bằng 7.
- [ ] Ghi chú tình trạng skip vào evidence report Phase 142G.

## Rollback Checklist
- [ ] Nếu thất bại: Chạy lệnh drop schema hoặc DB tương ứng trên PostgreSQL panel.
- [ ] Ghi chú logs/error message vào evidence và revert branch nếu cần.
- [ ] Xác nhận không ảnh hưởng main.

## Stop Conditions (Điều kiện Dừng Khẩn Cấp)
- DỪNG NGAY LẬP TỨC NẾU `DATABASE_URL` là `file:` hoặc chứa `localhost` trong giai đoạn staging execution.
- DỪNG NẾU Production credentials bị phát hiện.
- DỪNG NẾU `.env.local` override làm hỏng staging logic.
- DỪNG NẾU tiến trình migration ném lỗi schema.
- DỪNG NẾU Build fail.
- DỪNG NẾU data tự động import sai lệch ý định.
- DỪNG NẾU tìm thấy `productionApproved: true` xuất hiện.
- DỪNG NẾU có dấu hiệu/kế hoạch merge main khi chưa xử lý 7 skipped tests legacy.
