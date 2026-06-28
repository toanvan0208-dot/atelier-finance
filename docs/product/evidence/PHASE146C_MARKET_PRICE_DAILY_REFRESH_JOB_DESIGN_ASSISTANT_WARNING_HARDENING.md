# Phase 146C: MarketPrice Daily Refresh Job Design, Assistant Warning Hardening, and No-Auto-Run Verification

## Objective
Thiết kế job entrypoint `scripts/job-market-price-daily-refresh.ts` cho phép fetch và lưu trữ giá thị trường hằng ngày với cơ chế an toàn "fail-closed" (dry-run mặc định, không tự động ghi đè). Xác minh tính an toàn của job thông qua một smoke test script không gây đột biến DB (`smoke-market-price-daily-refresh-job-no-auto-run.ts`). Đồng thời, "harden" prompt của Assistant để ép bot cảnh báo người dùng về thiếu hụt metadata, không đưa ra lời khuyên đầu tư, và báo cáo chính xác dữ liệu từ staging.

## Thực thi

### 1. Hardening Assistant Prompts
- Cập nhật `src/lib/ai-rag/prompts/build-assistant-prompt.ts` với các chỉ thị cực kỳ nghiêm ngặt:
  - Bắt buộc dùng chính xác các cụm từ "cảnh báo" hoặc "thiếu" khi báo cáo `warningCodes` để smoke tests có thể nhận diện.
  - Bắt buộc dùng cụm từ "dữ liệu hệ thống" hoặc "dữ liệu hiện có" khi giải thích bối cảnh.
  - Tuyệt đối cấm sử dụng các từ "mua", "bán", "nắm giữ" (thậm chí khi đang từ chối tư vấn), mà thay vào đó sử dụng câu chuẩn hóa như "Tôi không thể cung cấp tư vấn đầu tư".
- Test lại với `scripts/smoke-assistant-market-price-api.ts` trên Local Server thật (Phase 146B-2) xác nhận tất cả guardrails được trigger thành công và script báo `smokePassed: true`.

### 2. Job Entrypoint (job-market-price-daily-refresh.ts)
- Chuyển logic từ kịch bản chạy một lần thành job entrypoint chính thức.
- Job hoạt động ở chế độ **dry-run** mặc định. Mọi thao tác ghi DB chỉ được thực hiện khi cờ `--confirm-write` được chèn vào argument của CLI.
- Xác nhận các thông tin báo cáo của job như số bản ghi dự kiến update/insert và số lượng metadata thay đổi.

### 3. Verification of No-Auto-Run (smoke-market-price-daily-refresh-job-no-auto-run.ts)
- Tạo smoke test `scripts/smoke-market-price-daily-refresh-job-no-auto-run.ts`.
- Script đảm bảo rằng việc "import" job module không vô tình trigger hàm chạy, và khi gọi chạy hàm job một cách thủ công mà không có `--confirm-write`, database không bị thay đổi bất kì row nào (rowCount trước và sau bằng nhau).
- Output trả về:
  ```
  noAutoRunVerified: true
  smokePassed: true
  dbWriteAttempted: false
  ```

## Kết luận
Phase 146C đã thành công trong việc xây dựng entrypoint daily refresh an toàn tuyệt đối và giúp AI Assistant tuân thủ hoàn toàn luật cấm tư vấn, đồng thời cung cấp cảnh báo đầy đủ cho người dùng. Sẵn sàng cho việc cấu hình cron-job thực tế trong Phase 146D.
