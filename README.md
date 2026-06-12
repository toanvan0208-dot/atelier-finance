# Atelier Finance

Atelier Finance là prototype giao diện cho một hệ thống hỗ trợ phân tích đầu tư chứng khoán dành cho người mới, sinh viên và nhà đầu tư cá nhân có mức độ hiểu biết tài chính còn hạn chế.

Dự án không được xây dựng để đưa ra khuyến nghị mua, bán hoặc nắm giữ cổ phiếu. Mục tiêu chính của hệ thống là giúp người dùng đi qua một quy trình phân tích có cấu trúc, hiểu dữ liệu theo ngôn ngữ dễ tiếp cận, kiểm tra rủi ro trước khi ra quyết định và từng bước hình thành tư duy đầu tư độc lập.

---

## Mục tiêu sản phẩm

Atelier Finance được thiết kế theo triết lý:

> Không bắt người mới nhìn vào một đống chỉ số rồi tự hiểu.
> Hệ thống phải dẫn họ đi từng bước, giải thích vì sao cần xem dữ liệu đó và dữ liệu đó ảnh hưởng gì đến quyết định đầu tư.

Các mục tiêu chính:

* Biến quy trình phân tích cổ phiếu thành một lộ trình rõ ràng.
* Giúp người dùng hiểu bối cảnh trước khi nhìn vào từng doanh nghiệp.
* Tách từng lớp phân tích để tránh quá tải thông tin.
* Giải thích dữ liệu tài chính bằng ngôn ngữ dễ hiểu.
* Giúp người dùng nhận diện rủi ro, giả định và dữ liệu còn thiếu.
* Hạn chế hành vi ra quyết định theo cảm xúc, tin đồn hoặc tín hiệu đơn lẻ.
* Chuẩn bị nền tảng để tích hợp dữ liệu thật và AI giải thích trong các giai đoạn sau.

---

## Đối tượng người dùng

Dự án hướng tới:

* Nhà đầu tư cá nhân mới bắt đầu.
* Người có kiến thức tài chính thấp hoặc trung bình.
* Sinh viên đang học về tài chính, chứng khoán, fintech hoặc phân tích dữ liệu.
* Người muốn học cách phân tích cổ phiếu theo quy trình thay vì chỉ xem tín hiệu mua bán.
* Người cần một hệ thống hỗ trợ tư duy đầu tư nhưng vẫn tự chịu trách nhiệm với quyết định của mình.

---

## Triết lý thiết kế

Atelier Finance được thiết kế theo hướng:

* Dễ hiểu trước, chuyên sâu sau.
* Mỗi module có một nhiệm vụ rõ ràng.
* Không biến giao diện thành bảng số liệu dày đặc.
* Không đưa ra kết luận đầu tư quá sớm.
* Luôn cho người dùng biết họ đang ở bước nào trong quy trình phân tích.
* Mỗi dữ liệu quan trọng cần đi kèm ý nghĩa, cách đọc và cảnh báo.
* Kết quả phân tích chỉ là thông tin tham khảo, không phải khuyến nghị đầu tư.

Hệ thống ưu tiên trải nghiệm học và phân tích có dẫn dắt, phù hợp với nhóm người dùng chưa quen đọc báo cáo tài chính hoặc chưa có khung tư duy đầu tư hoàn chỉnh.

---

## Lộ trình phân tích trong hệ thống

Atelier Finance tổ chức quá trình phân tích theo một chuỗi logic từ tổng quan đến hành động:

1. Tổng quan hệ thống.
2. Học tập kiến thức nền.
3. Phân tích vĩ mô.
4. Phân tích ngành.
5. Lọc cổ phiếu ứng viên.
6. Hiểu doanh nghiệp.
7. Phân tích báo cáo tài chính.
8. Định giá.
9. Kiểm tra rủi ro và minh bạch.
10. Quan sát Giá - Thanh khoản - Thời điểm.
11. Kiểm tra và luyện tư duy.
12. Mô phỏng quyết định.
13. Theo dõi Watchlist.

Luồng này giúp người dùng tránh lỗi phổ biến là nhảy thẳng vào giá cổ phiếu hoặc chỉ số định giá mà chưa hiểu bối cảnh, ngành, mô hình kinh doanh, chất lượng tài chính và rủi ro chính.

---

## Các module chính

### 1. Tổng quan

Module Tổng quan giúp người dùng nhìn toàn bộ hệ thống, biết mình đang ở bước nào, bước nào đã hoàn thành, bước nào còn thiếu dữ liệu và nên phân tích tiếp theo ở đâu.

### 2. Học tập

Module Học tập đóng vai trò bổ trợ xuyên suốt. Người dùng có thể học các khái niệm cần thiết trong quá trình phân tích, thay vì phải tách riêng việc học lý thuyết và việc đọc cổ phiếu.

### 3. Vĩ mô

Module Vĩ mô giúp người dùng hiểu bối cảnh kinh tế trước khi chọn ngành hoặc cổ phiếu.

Mục tiêu của module này là trả lời các câu hỏi:

* Thị trường hiện đang thuận gió hay ngược gió?
* Lãi suất, tỷ giá, lạm phát, tăng trưởng và dòng tiền đang ảnh hưởng thế nào?
* Bối cảnh hiện tại phù hợp với nhóm ngành nào?
* Có rủi ro vĩ mô nào cần thận trọng không?

### 4. Ngành

Module Ngành giúp người dùng hiểu ngành trước khi chọn doanh nghiệp cụ thể.

Nội dung trọng tâm:

* Ngành đang ở pha nào?
* Ngành kiếm tiền từ đâu?
* Yếu tố nào ảnh hưởng mạnh đến lợi nhuận toàn ngành?
* Ngành có đang được vĩ mô hỗ trợ không?
* Doanh nghiệp nào có thể hưởng lợi hoặc chịu áp lực?

### 5. Lọc cổ phiếu

Module Lọc cổ phiếu giúp thu hẹp danh sách cổ phiếu ứng viên, nhưng không biến kết quả lọc thành khuyến nghị mua bán.

Module này cần giúp người dùng hiểu:

* Vì sao dùng tiêu chí lọc đó?
* Mỗi tiêu chí loại bỏ điều gì?
* Cổ phiếu còn lại phù hợp để phân tích tiếp ở điểm nào?
* Dữ liệu nào vẫn cần kiểm chứng ở các module sau?

### 6. Hiểu doanh nghiệp

Module Hiểu doanh nghiệp giúp người dùng hiểu bản chất hoạt động của doanh nghiệp trước khi nhìn vào số liệu tài chính.

Nội dung trọng tâm:

* Doanh nghiệp kiếm tiền bằng cách nào?
* Khách hàng chính là ai?
* Sản phẩm hoặc dịch vụ cốt lõi là gì?
* Doanh nghiệp nằm ở đâu trong chuỗi giá trị?
* Lợi thế cạnh tranh có thật không?
* Động lực tăng trưởng đến từ đâu?
* Rủi ro kinh doanh chính là gì?

Mục tiêu của module này là giúp người dùng hiểu “doanh nghiệp này thực sự đang làm gì” trước khi đọc báo cáo tài chính.

### 7. Báo cáo tài chính

Module Báo cáo tài chính giúp kiểm tra sức khỏe tài chính, chất lượng lợi nhuận, dòng tiền, nợ vay và hiệu quả vận hành.

Nội dung trọng tâm:

* Doanh thu và lợi nhuận có tăng trưởng bền vững không?
* Lợi nhuận có đi kèm dòng tiền không?
* Doanh nghiệp có dùng nợ quá mức không?
* Biên lợi nhuận có ổn định không?
* Vốn lưu động có vấn đề không?
* Có dấu hiệu cảnh báo nào trong báo cáo tài chính không?

### 8. Định giá

Module Định giá giúp người dùng tiếp cận giá trị hợp lý theo cách thận trọng.

Nguyên tắc của module:

* Định giá là một vùng ước lượng, không phải một con số tuyệt đối.
* Mọi kết quả định giá phải đi kèm giả định.
* Cần có kịch bản thận trọng, cơ sở và tích cực.
* Cần kiểm tra biên an toàn trước khi kết luận.
* Không dùng định giá để hợp thức hóa cảm xúc muốn mua cổ phiếu.

### 9. Rủi ro và minh bạch

Module Rủi ro và minh bạch giúp người dùng kiểm tra điều gì có thể sai trước khi đưa cổ phiếu vào watchlist hoặc mô phỏng.

Nội dung trọng tâm:

* Rủi ro kinh doanh.
* Rủi ro tài chính.
* Rủi ro quản trị.
* Rủi ro minh bạch thông tin.
* Rủi ro định giá.
* Rủi ro thanh khoản.
* Rủi ro từ giả định phân tích.

### 10. Giá - Thanh khoản - Thời điểm

Module này giúp người dùng quan sát hành vi giá, thanh khoản và thời điểm, nhưng không thay thế cho phân tích cơ bản.

Mục tiêu:

* Tránh mua đuổi theo FOMO.
* Quan sát thanh khoản có xác nhận xu hướng không.
* Nhận diện vùng giá cần theo dõi.
* Kết hợp hành vi giá với luận điểm đầu tư, không tách rời khỏi nền tảng doanh nghiệp.

### 11. Kiểm tra và luyện tư duy

Module này giúp người dùng tự kiểm tra lại luận điểm trước khi ra quyết định.

Nội dung có thể bao gồm:

* Checklist hiểu doanh nghiệp.
* Checklist tài chính.
* Checklist định giá.
* Checklist rủi ro.
* Câu hỏi phản biện.
* Những điểm còn thiếu dữ liệu.
* Những giả định cần kiểm chứng.

### 12. Mô phỏng

Module Mô phỏng giúp người dùng ghi nhận quyết định giả lập trước khi hành động thật.

Mục tiêu:

* Ghi lại thesis đầu tư.
* Xác định kịch bản đúng và sai.
* Theo dõi kết quả giả lập.
* Rút kinh nghiệm từ quá trình phân tích.
* Hạn chế việc học đầu tư chỉ bằng cảm xúc sau khi lãi hoặc lỗ.

### 13. Watchlist

Module Watchlist giúp lưu các cổ phiếu cần theo dõi, trạng thái phân tích, dữ liệu còn thiếu và bước tiếp theo cần làm.

Watchlist không chỉ là danh sách mã cổ phiếu, mà là nơi quản lý tiến độ tư duy đầu tư.

---

## Công nghệ sử dụng

| Nhóm            | Công nghệ    |
| --------------- | ------------ |
| Framework       | Next.js      |
| UI Library      | React        |
| Ngôn ngữ        | TypeScript   |
| Styling         | Tailwind CSS |
| Lint            | ESLint       |
| Package Manager | npm          |

Dự án sử dụng App Router của Next.js và tổ chức mã nguồn trong thư mục `src`.

---

## Cấu trúc thư mục

```txt
atelier-finance/
├── docs/
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
│       ├── business/
│       ├── financials/
│       ├── industry/
│       ├── macro/
│       ├── screening/
│       └── valuation/
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

Ý nghĩa chính:

| Thư mục / File          | Vai trò                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `src/app`               | Entry point của Next.js App Router                               |
| `src/components/layout` | Các thành phần khung giao diện như sidebar, topbar, main content |
| `src/components/ui`     | Các UI component dùng lại nhiều nơi                              |
| `src/config`            | Cấu hình điều hướng, lộ trình module và nội dung shell           |
| `src/features`          | Các module nghiệp vụ của hệ thống                                |
| `docs`                  | Tài liệu mô tả yêu cầu, tiến độ hoặc định hướng phát triển       |
| `tailwind.config.ts`    | Cấu hình Tailwind CSS                                            |
| `tsconfig.json`         | Cấu hình TypeScript và alias                                     |

---

## Cách chạy dự án local

### 1. Clone repository

```bash
git clone https://github.com/toanvan0208-dot/atelier-finance.git
cd atelier-finance
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Chạy development server

```bash
npm run dev
```

Sau đó mở trình duyệt tại:

```txt
http://localhost:3000
```

---

## Scripts có sẵn

| Lệnh            | Chức năng                           |
| --------------- | ----------------------------------- |
| `npm run dev`   | Chạy dự án ở môi trường development |
| `npm run build` | Build production                    |
| `npm run start` | Chạy bản production sau khi build   |
| `npm run lint`  | Kiểm tra lint                       |

---

## Quy ước phát triển module

Khi thêm một module mới, nên tổ chức theo hướng:

```txt
src/features/module-name/
├── components/
│   └── ModulePage.tsx
├── data/
│   └── module.data.ts
└── index.ts
```

Nguyên tắc nên giữ:

* Component chỉ nên tập trung vào hiển thị.
* Dữ liệu mock hoặc nội dung tĩnh nên tách ra khỏi component.
* Các block giao diện lặp lại nên tách thành component nhỏ.
* Không nhồi toàn bộ nội dung module vào một file quá dài.
* Mỗi module nên có mục tiêu rõ ràng, phần giải thích, dữ liệu chính, cảnh báo, checklist và bước tiếp theo.
* Không dùng dữ liệu mẫu như kết luận đầu tư thật.
* Không viết nội dung khiến người dùng hiểu rằng hệ thống đang khuyến nghị mua hoặc bán cổ phiếu.

---

## Trạng thái hiện tại

Dự án đang ở giai đoạn prototype giao diện và kiến trúc module.

Trọng tâm hiện tại:

* Xây dựng layout tổng thể.
* Tách các module thành feature độc lập.
* Chuẩn hóa lộ trình phân tích.
* Thiết kế giao diện dễ hiểu cho người mới.
* Chuẩn bị nền tảng để kết nối dữ liệu thật và AI giải thích ở các giai đoạn sau.

Một số module đã có trong điều hướng nhưng chưa nhất thiết hoàn thiện đầy đủ nội dung hoặc logic xử lý dữ liệu thật. Vì vậy, dự án hiện nên được hiểu là prototype sản phẩm, không phải hệ thống phân tích đầu tư hoàn chỉnh.

---

## Định hướng phát triển tiếp theo

Các hướng phát triển quan trọng:

1. Hoàn thiện đầy đủ các module còn thiếu.
2. Chuẩn hóa design system cho toàn bộ giao diện.
3. Tách dữ liệu mẫu khỏi component.
4. Bổ sung trạng thái loading, empty và error cho từng module.
5. Kết nối dữ liệu thật cho cổ phiếu, báo cáo tài chính và vĩ mô.
6. Xây dựng Watchlist cá nhân.
7. Bổ sung mô phỏng quyết định đầu tư.
8. Bổ sung nhật ký phân tích và hậu kiểm.
9. Tích hợp AI giải thích dữ liệu theo ngữ cảnh.
10. Thêm kiểm thử cho các component quan trọng.
11. Tối ưu responsive cho mobile và tablet.
12. Chuyển điều hướng state sang routing nếu cần URL riêng cho từng module.

---

## Định hướng dữ liệu

Ở giai đoạn hiện tại, nhiều phần trong hệ thống có thể sử dụng dữ liệu mẫu để phục vụ thiết kế giao diện và kiểm thử trải nghiệm.

Khi phát triển thành sản phẩm hoàn chỉnh, hệ thống cần bổ sung:

* API dữ liệu giá cổ phiếu.
* API báo cáo tài chính.
* API dữ liệu vĩ mô.
* Cơ sở dữ liệu người dùng.
* Dữ liệu watchlist cá nhân.
* Lịch sử mô phỏng.
* Nhật ký phân tích.
* Hệ thống giải thích dữ liệu bằng AI.

---

## Lưu ý quan trọng

Atelier Finance là hệ thống hỗ trợ học và phân tích đầu tư. Dự án không cung cấp khuyến nghị mua, bán hoặc nắm giữ cổ phiếu.

Các nội dung phân tích, điểm số, cảnh báo, mô phỏng hoặc định giá trong hệ thống chỉ nên được hiểu là thông tin tham khảo và công cụ hỗ trợ tư duy. Người dùng cần tự chịu trách nhiệm với quyết định đầu tư của mình.

---

## Tác giả

Repository: `toanvan0208-dot/atelier-finance`

Dự án phục vụ quá trình xây dựng hệ thống hỗ trợ đầu tư cho người có mức độ hiểu biết tài chính thấp.
