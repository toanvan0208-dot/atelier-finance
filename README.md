# Atelier Finance

Atelier Finance là prototype giao diện cho một hệ thống hỗ trợ đầu tư chứng khoán dành cho người mới hoặc người có mức độ hiểu biết tài chính còn thấp. Dự án tập trung vào việc biến quy trình phân tích đầu tư thành một lộ trình học có thứ tự, dễ hiểu và ít gây quá tải.

Mục tiêu chính của dự án không phải là đưa ra khuyến nghị mua hoặc bán cổ phiếu, mà là giúp người dùng hiểu dữ liệu, đặt câu hỏi đúng và tự hình thành luận điểm đầu tư cá nhân trước khi ra quyết định.

---

## 1. Mục tiêu sản phẩm

Atelier Finance được xây dựng theo tư duy “đi từng bước trước khi ra quyết định”. Người dùng được dẫn qua các lớp phân tích từ tổng quan đến chi tiết:

1. Hiểu bản thân và khẩu vị rủi ro.
2. Đọc bối cảnh vĩ mô.
3. Hiểu ngành.
4. Lọc cổ phiếu ứng viên.
5. Hiểu doanh nghiệp.
6. Phân tích báo cáo tài chính.
7. Định giá.
8. Quan sát Price - Volume - Time.
9. Kiểm tra rủi ro và minh bạch.
10. Tổng hợp checklist.
11. Theo dõi watchlist.
12. Mô phỏng quyết định.
13. Ghi lại nhật ký đầu tư.

Dự án ưu tiên cách trình bày đơn giản, có giải thích, có checklist và có cảnh báo để hạn chế việc người dùng hiểu sai dữ liệu hoặc ra quyết định theo cảm xúc.

---

## 2. Đối tượng người dùng

Dự án hướng tới:

- Nhà đầu tư cá nhân mới bắt đầu.
- Người có kiến thức tài chính thấp hoặc trung bình.
- Sinh viên hoặc người học đầu tư muốn có một quy trình phân tích rõ ràng.
- Người muốn học cách đọc cổ phiếu thay vì chỉ xem tín hiệu mua bán.
- Người muốn có một hệ thống hỗ trợ tư duy đầu tư nhưng vẫn giữ quyền tự ra quyết định.

---

## 3. Triết lý thiết kế

Atelier Finance đang được thiết kế theo hướng:

- Dễ hiểu trước, chuyên sâu sau.
- Không biến giao diện thành một bảng số liệu dày đặc.
- Mỗi module có nhiệm vụ rõ ràng.
- Mỗi bước đều giải thích ý nghĩa dữ liệu cho người mới.
- Có nhắc nhở rằng dữ liệu không phải là khuyến nghị đầu tư.
- Có lộ trình phân tích để người dùng biết mình đang ở đâu trong toàn bộ quy trình.

Giao diện sử dụng bố cục dạng shell gồm:

- Sidebar bên trái: danh sách module và lộ trình phân tích.
- Khu vực chính: nội dung module đang xem.
- Panel bên phải: trợ giảng hoặc trợ lý giải thích.
- Mobile navigation: điều hướng tối ưu cho màn hình nhỏ.

---

## 4. Công nghệ sử dụng

| Nhóm | Công nghệ |
| --- | --- |
| Framework | Next.js |
| UI Library | React |
| Ngôn ngữ | TypeScript |
| Styling | Tailwind CSS |
| Lint | ESLint |
| Font | Inter, Be Vietnam Pro |

Dự án hiện sử dụng App Router của Next.js và tổ chức source code trong thư mục `src`.

---

## 5. Tính năng hiện có

### 5.1. App Shell

App Shell là khung giao diện chính của toàn bộ hệ thống. Thành phần này quản lý module đang được chọn và render nội dung tương ứng.

Các thành phần chính:

- `Topbar`: thanh trên cùng.
- `Sidebar`: điều hướng module bên trái.
- `MainContent`: vùng nội dung trung tâm.
- `RightAssistantPanel`: panel trợ giảng bên phải.
- `MobileNavigation`: điều hướng trên thiết bị nhỏ.

Hiện tại việc chuyển module được xử lý bằng state trong React, chưa phải routing nhiều trang theo URL.

---

### 5.2. Module Vĩ mô

Module Vĩ mô giúp người dùng hiểu bối cảnh kinh tế trước khi nhìn vào ngành hoặc cổ phiếu riêng lẻ.

Nội dung chính:

- Tổng quan vĩ mô.
- Giải thích đơn giản cho người mới.
- Các lớp phân tích vĩ mô toàn cầu.
- Các chỉ số vĩ mô Việt Nam.
- Dashboard cảnh báo.
- Tín hiệu cần chú ý.
- Gợi ý bước tiếp theo.
- Tóm tắt module.

Mục tiêu của module này là giúp người dùng trả lời câu hỏi: thị trường hiện đang thuận gió, ngược gió hay cần thận trọng?

---

### 5.3. Module Ngành

Module Ngành giúp người dùng hiểu ngành trước khi chọn doanh nghiệp cụ thể.

Nội dung chính:

- Tổng quan ngành.
- Điểm sức khỏe ngành.
- Các yếu tố tác động đến ngành.
- Triển vọng ngành.
- Nhóm ngành hoặc doanh nghiệp hưởng lợi.
- Cổ phiếu đại diện.
- Phần đào sâu ngành.

Mục tiêu của module này là giúp người dùng biết ngành đang ở pha nào, chịu tác động bởi yếu tố gì và có phù hợp với bối cảnh vĩ mô hay không.

---

### 5.4. Module Lọc cổ phiếu

Module Lọc cổ phiếu giúp tạo danh sách cổ phiếu ứng viên, nhưng không biến kết quả lọc thành khuyến nghị mua bán.

Nội dung chính:

- Panel nhập tiêu chí lọc.
- Tóm tắt bối cảnh lọc.
- Tóm tắt dễ hiểu cho người mới.
- Nhóm kết quả lọc.
- Phân tích sâu từng nhóm.
- Bảng so sánh.
- Cảnh báo và disclaimer.
- Kiểm tra mức độ hiểu.
- Gợi ý hành động tiếp theo.

Mục tiêu của module này là giúp người dùng thu hẹp phạm vi phân tích thay vì chọn cổ phiếu theo cảm tính.

---

### 5.5. Module Hiểu doanh nghiệp

Module Hiểu doanh nghiệp giúp người dùng hiểu doanh nghiệp kiếm tiền bằng cách nào và rủi ro chính nằm ở đâu.

Nội dung chính:

- Header doanh nghiệp.
- Tóm tắt nhanh.
- Sidebar tiến trình phân tích.
- Nhận diện doanh nghiệp.
- Loại hình kinh doanh.
- Sản phẩm và khách hàng.
- Nguồn doanh thu.
- Động lực tăng trưởng.
- Vị thế trong chuỗi giá trị.
- Hệ sinh thái kinh doanh.
- Quản trị doanh nghiệp.
- Phân bổ vốn.
- Liên kết với luận điểm ngành.
- Lợi thế cạnh tranh.
- Khả năng mở rộng.
- Rủi ro kinh doanh.
- Luận điểm cá nhân.
- Checklist hiểu doanh nghiệp.
- Disclaimer và bước tiếp theo.

Mục tiêu của module này là giúp người dùng hiểu “doanh nghiệp này thực sự đang làm gì” trước khi nhìn vào số liệu tài chính.

---

### 5.6. Module Báo cáo tài chính

Module Báo cáo tài chính giúp người dùng kiểm tra sức khỏe tài chính, chất lượng lợi nhuận, dòng tiền và rủi ro tài chính.

Nội dung chính:

- Header báo cáo tài chính.
- Tóm tắt nhanh.
- Sidebar tiến trình phân tích.
- Snapshot tài chính.
- Báo cáo kết quả kinh doanh.
- Bảng cân đối kế toán.
- Lưu chuyển tiền tệ.
- So sánh lợi nhuận và dòng tiền.
- Chất lượng lợi nhuận.
- Cấu trúc nợ.
- Vốn lưu động.
- Phân bổ vốn.
- Nhóm chỉ số tài chính.
- Chỉ số đặc thù ngành.
- Dấu hiệu cảnh báo.
- Cầu nối sang định giá.
- Luận điểm tài chính cá nhân.
- Checklist hiểu báo cáo tài chính.
- Disclaimer và bước tiếp theo.

Mục tiêu của module này là giúp người dùng hiểu doanh nghiệp có đang khỏe thật hay chỉ đẹp trên bề mặt số liệu.

---

### 5.7. Module Định giá

Module Định giá giúp người dùng tiếp cận giá trị hợp lý theo cách thận trọng, có giả định rõ ràng và có biên an toàn.

Nội dung chính:

- Header định giá.
- Tóm tắt nhanh.
- Sidebar tiến trình phân tích.
- Kiểm tra điều kiện trước khi định giá.
- Chuẩn hóa đầu vào.
- Xác định loại hình doanh nghiệp để chọn phương pháp phù hợp.
- Đọc định giá thị trường.
- Chọn phương pháp định giá.
- Các phương pháp định giá.
- So sánh lịch sử.
- Kỳ vọng thị trường.
- Kịch bản định giá.
- Catalyst và rủi ro.
- Biên an toàn.
- Độ tin cậy của định giá.
- Vùng giá trị hợp lý.
- Trợ giảng định giá.
- Luận điểm định giá cá nhân.
- Disclaimer và bước tiếp theo.

Mục tiêu của module này là giúp người dùng hiểu rằng định giá là một vùng ước lượng dựa trên giả định, không phải một con số tuyệt đối.

---

## 6. Các module đã có trong điều hướng nhưng chưa render đầy đủ

Sidebar hiện đã khai báo thêm các module sau:

- Hiểu bản thân.
- Price - Volume - Time.
- Rủi ro và minh bạch.
- Checklist.
- Watchlist.
- Mô phỏng.
- Nhật ký.

Một số module đã có trong cấu hình lộ trình nhưng chưa được render thành trang nội dung hoàn chỉnh trong `AppShell`. Đây là phần cần tiếp tục phát triển ở các giai đoạn sau.

---

## 7. Cấu trúc thư mục

Cấu trúc tổng quan:

```txt
atelier-finance/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── config/
│   │   ├── navigation.config.ts
│   │   └── shell.config.ts
│   └── features/
│       ├── macro/
│       ├── industry/
│       ├── screening/
│       ├── business/
│       ├── financials/
│       └── valuation/
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

Ý nghĩa chính:

| Thư mục / file | Vai trò |
| --- | --- |
| `src/app` | Entry point của Next.js App Router |
| `src/components/layout` | Các thành phần khung giao diện như sidebar, topbar, main content |
| `src/components/ui` | Các UI component dùng lại nhiều nơi |
| `src/config` | Cấu hình điều hướng, lộ trình module và nội dung shell |
| `src/features` | Các module nghiệp vụ của hệ thống |
| `tailwind.config.ts` | Theme màu, font, shadow và cấu hình Tailwind |
| `tsconfig.json` | Cấu hình TypeScript và alias `@/*` |

---

## 8. Cách chạy dự án local

### 8.1. Clone repository

```bash
git clone https://github.com/toanvan0208-dot/atelier-finance.git
cd atelier-finance
```

### 8.2. Cài dependencies

```bash
npm install
```

### 8.3. Chạy development server

```bash
npm run dev
```

Sau đó mở trình duyệt tại:

```txt
http://localhost:3000
```

---

## 9. Scripts có sẵn

| Lệnh | Chức năng |
| --- | --- |
| `npm run dev` | Chạy dự án ở môi trường development |
| `npm run build` | Build production |
| `npm run start` | Chạy bản production sau khi build |
| `npm run lint` | Kiểm tra lint |

---

## 10. Quy ước phát triển module

Khi thêm một module mới, nên đi theo cấu trúc:

```txt
src/features/module-name/
├── components/
│   └── ModulePage.tsx
├── data/
│   └── module.data.ts
└── index.ts
```

Nguyên tắc nên giữ:

- Component chỉ lo hiển thị.
- Dữ liệu mock hoặc nội dung tĩnh nên đặt trong `data`.
- Các block nhỏ nên tách component riêng.
- Không nhồi toàn bộ logic vào một file quá dài.
- Mỗi module nên có header, summary, lộ trình, cảnh báo, checklist và bước tiếp theo.

---

## 11. Hướng phát triển tiếp theo

Các việc nên làm tiếp:

1. Hoàn thiện module Hiểu bản thân.
2. Hoàn thiện module Price - Volume - Time.
3. Hoàn thiện module Rủi ro và minh bạch.
4. Thêm module Checklist quyết định.
5. Thêm Watchlist.
6. Thêm Mô phỏng quyết định đầu tư.
7. Thêm Nhật ký đầu tư.
8. Chuyển điều hướng state sang routing nếu cần URL riêng cho từng module.
9. Kết nối dữ liệu thật cho cổ phiếu, báo cáo tài chính và vĩ mô.
10. Thêm trạng thái loading, empty, error đồng bộ cho toàn bộ module.
11. Thêm test cho component quan trọng.
12. Chuẩn hóa design system.
13. Kết nối AI Chat hoặc trợ giảng giải thích dữ liệu.

---

## 12. Định hướng dữ liệu

Hiện tại nhiều phần trong dự án phù hợp với prototype hoặc dữ liệu tĩnh. Khi chuyển sang sản phẩm thật, có thể cần thêm:

- API dữ liệu cổ phiếu.
- API báo cáo tài chính.
- API dữ liệu vĩ mô.
- Cơ sở dữ liệu người dùng.
- Watchlist cá nhân.
- Nhật ký đầu tư.
- Lịch sử mô phỏng.
- Hệ thống giải thích dữ liệu bằng AI.

---

## 13. Lưu ý quan trọng

Atelier Finance là hệ thống hỗ trợ học và phân tích đầu tư. Dự án không nên được trình bày như một công cụ khuyến nghị mua bán cổ phiếu.

Các nội dung phân tích, điểm số, cảnh báo hoặc định giá trong hệ thống chỉ nên được hiểu là thông tin tham khảo và công cụ hỗ trợ tư duy. Người dùng cần tự chịu trách nhiệm với quyết định đầu tư của mình.

---

## 14. Trạng thái dự án

Dự án đang ở giai đoạn prototype giao diện và kiến trúc module. Trọng tâm hiện tại là:

- Xây dựng layout tổng thể.
- Tách module thành các feature độc lập.
- Thiết kế lộ trình phân tích dễ hiểu.
- Chuẩn bị nền tảng để nối dữ liệu thật và AI ở các bước sau.

---

## 15. Tác giả

Repository: `toanvan0208-dot/atelier-finance`

Dự án phục vụ quá trình xây dựng hệ thống hỗ trợ đầu tư cho người có mức độ hiểu biết tài chính thấp.