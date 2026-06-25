# PostgreSQL Schema Switch Dry-Run Instructions

## 1. Mục tiêu
Tài liệu này hướng dẫn cách thực hiện an toàn việc chuyển đổi Prisma provider từ SQLite sang PostgreSQL trên một nhánh độc lập (isolated branch) để thực hiện dry-run. Mục tiêu là kiểm chứng việc chuyển đổi cấu trúc (schema) và khởi tạo baseline migration mới cho PostgreSQL mà không gây ảnh hưởng tới quá trình phát triển trên nhánh `main` hay dữ liệu hiện tại.

## 2. Lý do chưa đổi provider trên `main`
- **An toàn:** Việc đổi provider trực tiếp sẽ phá vỡ các migration cũ, làm các local dev khác bị crash nếu họ pull code về.
- **Tính khả thi:** Quá trình dry-run có thể gặp rủi ro tương thích khi thay adapter/client cho PostgreSQL.
- **Kiểm soát:** Yêu cầu một môi trường Docker PostgreSQL sẵn sàng và cần review generated SQL thật cẩn thận trước khi hợp nhất (merge).

## 3. Điều kiện trước khi bắt đầu Phase 142F
- [ ] User đã xác nhận việc cài đặt và có thể chạy Docker PostgreSQL (hoặc 1 local PostgreSQL instance).
- [ ] Môi trường `main` đang clean, test pass, không có thay đổi rác.
- [ ] Chưa có bất kỳ thay đổi provider nào bị rò rỉ vào `main`.

## 4. Đề xuất tên branch
Tạo branch isolated trước khi bắt đầu sửa code:
`phase-142f-postgres-docker-dry-run`

## 5. Docker PostgreSQL Placeholder (Phase 142F)
Sử dụng placeholder connection string sau cho biến môi trường `DATABASE_URL` khi thực hiện dry-run local:
```text
postgresql://atelier:atelier@localhost:5432/atelier_finance?schema=public
```

## 6. Các file dự kiến sẽ sửa ở Phase 142F
*(Lưu ý: Không sửa các file này trong Phase 142E)*
- `prisma/schema.prisma` (Đổi `provider = "postgresql"`)
- `prisma.config.ts` (Gỡ bỏ fallback `file:./dev.db`)
- `src/lib/database/client.ts` (Thay adapter SQLite bằng PostgreSQL adapter)
- `package.json` & `package-lock.json` (Cài package `pg`, gỡ `better-sqlite3`, cập nhật command `db:reset`, v.v.)
- `.env.example` (Cập nhật placeholder sang Postgres)
- `scripts/reset-local-db.mjs` / DB commands (Thay đổi logic xoá file .db cứng)
- `prisma/migrations/` (Xóa các thư mục migration cũ của SQLite)
- Tests/smoke phụ thuộc SQLite (Gỡ các hardcode phụ thuộc vào file SQLite local)

## 7. Quy trình Dry-Run Dự kiến (Phase 142F)
1. **Tạo branch isolated**: `git checkout -b phase-142f-postgres-docker-dry-run`
2. **Bật PostgreSQL disposable local**: Chạy Docker container với thông tin placeholder.
3. **Switch provider trên branch**: Sửa các file cấu hình và package như danh sách ở phần 6.
4. **Tạo fresh baseline**: Chạy `npx prisma migrate dev --name init_postgres`.
5. **Review generated SQL**: Kiểm tra kĩ các Enum, String, Date... xem đã map đúng kiểu native trên Postgres chưa.
6. **Chạy validation**: `npx prisma validate`, typecheck, lint, build, test. Đảm bảo toàn bộ hệ thống test pass với adapter mới.
7. **Không import data**: Nghiêm cấm chạy import dữ liệu ở phase này.
8. **Không merge**: Nếu chưa có evidence đầy đủ và user chưa approve, tuyệt đối không merge về `main`.

## 8. Rollback Plan
- Nếu có bất cứ sai sót nào trong quá trình chuyển đổi, hoặc setup Postgres gặp lỗi:
  - Bỏ branch (Delete branch) hoặc reset cứng (`git reset --hard origin/main`).
  - Không ảnh hưởng gì đến `main`.
  - Chỉ xóa disposable local PostgreSQL DB/container đã tạo ở Phase 142F là mọi thứ trở về trạng thái bình thường.

## 9. Explicit Stop Conditions
Bất kỳ điều kiện nào dưới đây xảy ra, quy trình Dry-Run 142F phải DỪNG NGAY LẬP TỨC:
- **Docker/PostgreSQL chưa sẵn sàng**: Không có nơi để test migration.
- **Migration SQL chứa điểm không hiểu**: Code Prisma tự sinh ra các schema lạ/rủi ro cao.
- **Tests fail**: Các file test cũ bị fail do vẫn dựa dẫm vào cơ chế file của SQLite.
- **Runtime vẫn phụ thuộc SQLite adapter**: Chưa dọn dẹp sạch mã nguồn khởi tạo DB cũ.
- **Import script có nguy cơ write nhầm**: Hardcode guard có thể ghi vào DB chính.
- **Có file ngoài scope bị modified**: Các logic liên quan tới investment advice, missing data (missing-to-zero)... bị đụng chạm.
