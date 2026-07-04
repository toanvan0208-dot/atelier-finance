"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, Chip, EmptyState, LoadingState, SectionHeader } from "@/components/ui";
import { industryPageData } from "../data/industry.data";
import { industryCompassData } from "../data/industryCompass.data";
import type { IndustryContextRuntimePayload } from "../lib/load-industry-context";
import {
  IndustryCompanyMapSection,
  IndustryConditionalConclusion,
  IndustryCurrentHeader,
  IndustryDataConfirmationSection,
  type IndustryLayer4SectionContext,
  IndustryMacroPressureSection,
  IndustryMoneyMap,
  IndustryQuickPicture,
} from "./IndustryCompassSections";

type IndustryPageProps = {
  initialIndustryContexts?: Record<string, IndustryContextRuntimePayload>;
  onNavigate?: (moduleKey: string) => void;
};

const industryCodeByCompassKey: Record<string, string> = {
  consumer_staples_dairy: "CONSUMER_STAPLES_DAIRY",
  dairy_consumer_staples: "CONSUMER_STAPLES_DAIRY",
  retail: "RETAIL",
  steel_materials: "STEEL_MATERIALS",
};

const runtimeDataModeLabel = (value: string | null | undefined): string => {
  if (value === "research_only") return "Dữ liệu nghiên cứu";
  if (!value) return "Chưa có";
  return value;
};

const parseRuntimeList = (value: string | null | undefined): string[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  } catch {
    return value
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const contextSourceStatusLabel = (payload: IndustryContextRuntimePayload): string => {
  if (payload.context?.reviewedQualitativeContextAvailable) return "Có nội dung ngành kèm nguồn";
  if (payload.context) return "Có nội dung ngành nhưng chưa đủ nguồn";
  return "Chưa có bối cảnh ngành có nguồn";
};

type Layer4DisplayContext = {
  industryName: string;
  industryOverview: string | null;
  howIndustryMakesMoney: string | null;
  keyDrivers: string[];
  industryRisks: string[];
  macroSensitivity: string[];
  nextChecks: string[];
  commonMisread: string | null;
  translationMode: "pdf_vi_display" | "source_text";
};

const pdfBackedVietnameseDisplayByIndustryCode: Record<string, Omit<Layer4DisplayContext, "translationMode">> = {
  STEEL_MATERIALS: {
    industryName: "Thep va vat lieu",
    industryOverview:
      "Ngành thép cần đọc qua cung cầu thép trong và ngoài nước, sản lượng tiêu thụ, xuất khẩu, giá bán, chi phí nguyên liệu và chu kỳ tồn kho.",
    howIndustryMakesMoney:
      "Doanh thu đến từ sản lượng bán ra, giá bán, cơ cấu sản phẩm, mức sử dụng công suất, tỷ trọng nội địa/xuất khẩu và chênh lệch giữa giá thép với chi phí đầu vào, năng lượng, logistics.",
    keyDrivers: [
      "Nhu cầu xây dựng và đầu tư hạ tầng trong nước",
      "Sản lượng tiêu thụ thép thành phẩm và nhu cầu xuất khẩu",
      "Biến động chi phí nguyên liệu, năng lượng và logistics",
      "Kỷ luật tồn kho khi giá thép thay đổi nhanh",
      "Rào cản thương mại và gián đoạn xuất nhập khẩu",
    ],
    industryRisks: [
      "Nhu cầu bất động sản hoặc xây dựng yếu có thể kéo giảm sản lượng và công suất.",
      "Chi phí đầu vào tăng có thể làm biên lợi nhuận bị ép nếu giá bán điều chỉnh chậm.",
      "Biện pháp phòng vệ thương mại có thể ảnh hưởng kênh xuất khẩu.",
      "Tồn kho cao có thể gây áp lực dòng tiền khi giá thép đảo chiều.",
    ],
    macroSensitivity: [
      "Chu kỳ hạ tầng và xây dựng",
      "Điều kiện bất động sản và tín dụng",
      "Giá quặng sắt, than, năng lượng và logistics",
      "Tỷ giá với đầu vào nhập khẩu hoặc doanh thu xuất khẩu",
      "Căng thẳng thương mại toàn cầu",
    ],
    nextChecks: [
      "Kiểm tra sản lượng/doanh thu, biên gộp, tồn kho, dòng tiền hoạt động và nợ vay.",
      "Tách tín hiệu nhu cầu trong nước khỏi tín hiệu xuất khẩu.",
      "Kiểm tra giá thép tăng do nhu cầu tốt lên hay do chi phí đẩy.",
    ],
    commonMisread:
      "Báo cáo thị trường thép chỉ giúp hiểu bối cảnh cầu, chi phí, thương mại và tồn kho; không tự quyết định chất lượng cổ phiếu hay hành động thị trường.",
  },
  RETAIL: {
    industryName: "Ban le",
    industryOverview:
      "Ngành bán lẻ cần đọc qua sức mua, lưu lượng khách, kênh cửa hàng và online, mở rộng chuỗi hiện đại, độ phủ khu vực, danh mục hàng, tồn kho và kiểm soát chi phí vận hành.",
    howIndustryMakesMoney:
      "Doanh thu phụ thuộc vào lượng khách, tỷ lệ chuyển đổi, giá trị đơn hàng, năng suất cửa hàng, quy mô kênh online, điều khoản với nhà cung cấp, vòng quay tồn kho và kiểm soát chi phí bán hàng/logistics.",
    keyDrivers: [
      "Sức mua hộ gia đình và niềm tin tiêu dùng",
      "Mở rộng chuỗi bán lẻ hiện đại",
      "Độ phủ ở khu vực nông thôn và ngoại thành",
      "Khả năng vận hành thương mại điện tử và đa kênh",
      "Vòng quay tồn kho và kỷ luật danh mục hàng",
    ],
    industryRisks: [
      "Nhu cầu chậm lại có thể làm giảm lượng khách và giá trị giỏ hàng.",
      "Lệch tồn kho có thể gây áp lực lên biên và dòng tiền.",
      "Cạnh tranh giá có thể làm giảm biên gộp.",
      "Chi phí thuê mặt bằng, nhân sự, logistics và tài chính có thể ép lợi nhuận.",
    ],
    macroSensitivity: [
      "Tăng trưởng GDP và thu nhập",
      "Lạm phát và áp lực giá tiêu dùng",
      "Chính sách hỗ trợ tiêu dùng hoặc thuế",
      "Điều kiện việc làm và tín dụng tiêu dùng",
      "Tỷ giá và chi phí hàng nhập khẩu",
    ],
    nextChecks: [
      "Kiểm tra chất lượng doanh thu, biên gộp, tồn kho, chi phí bán hàng, chi phí tài chính và dòng tiền hoạt động.",
      "Tách tăng trưởng từ mở rộng cửa hàng khỏi tăng trưởng cùng cửa hàng.",
      "Kiểm tra tăng trưởng online có cải thiện lợi nhuận hay chỉ tăng quy mô.",
    ],
    commonMisread:
      "Báo cáo ngành bán lẻ chỉ cung cấp bối cảnh về nhu cầu, kênh bán, tồn kho và chi phí; các phần nói về cổ phiếu riêng lẻ không được biến thành kết luận tự động.",
  },
  CONSUMER_STAPLES_DAIRY: {
    industryName: "Sua va hang tieu dung thiet yeu",
    industryOverview:
      "Ngành sữa và hàng tiêu dùng thiết yếu cần đọc qua thu nhập hộ gia đình, sức mua, niềm tin tiêu dùng, chi phí thực phẩm/đầu vào, kênh phân phối và dịch chuyển sang kênh bán lẻ chuyên nghiệp.",
    howIndustryMakesMoney:
      "Doanh thu phụ thuộc vào nhu cầu tiêu dùng lặp lại, cơ cấu sản phẩm, giá bán, sức mạnh thương hiệu, độ phủ phân phối và khả năng kiểm soát chi phí sữa, bao bì, logistics, bán hàng.",
    keyDrivers: [
      "Thu nhập khả dụng và sức mua hộ gia đình",
      "Niềm tin tiêu dùng và mức chi tiêu bình thường hóa",
      "Chi phí thực phẩm, bao bì, logistics và đầu vào nông nghiệp",
      "Kênh bán lẻ hiện đại và hệ thống phân phối chuyên nghiệp",
      "Cơ cấu sản phẩm giữa nhóm thiết yếu và nhóm tiêu dùng khác",
    ],
    industryRisks: [
      "Chi phí đầu vào tăng có thể ép biên nếu giá bán không điều chỉnh kịp.",
      "Sức mua yếu có thể làm chậm sản lượng tiêu thụ.",
      "Hàng nhập khẩu hoặc nguyên liệu cạnh tranh có thể gây áp lực cho nhà sản xuất nội địa.",
      "Chi phí khuyến mại và phân phối có thể kéo lợi nhuận giảm.",
    ],
    macroSensitivity: [
      "Tăng trưởng GDP và thu nhập hộ gia đình",
      "Lạm phát thực phẩm, nhiên liệu và logistics",
      "Chính sách tài khóa/tiền tệ hỗ trợ tiêu dùng",
      "Tỷ giá với nguyên liệu hoặc bao bì nhập khẩu",
    ],
    nextChecks: [
      "Kiểm tra tăng trưởng doanh thu, biên gộp, chi phí bán hàng, vốn lưu động, dòng tiền hoạt động và nợ vay nếu có.",
      "Dùng báo cáo tiêu dùng làm bối cảnh cầu chung; vẫn cần kiểm tra riêng nguồn cung và sản phẩm ngành sữa.",
      "Xác nhận tăng trưởng đến từ sản lượng, giá bán hay cơ cấu sản phẩm.",
    ],
    commonMisread:
      "Báo cáo ngành tiêu dùng rộng có thể hỗ trợ đọc bối cảnh cầu và chi phí cho ngành sữa, nhưng không phải kết luận riêng cho ngành sữa và không tự quyết định chất lượng cổ phiếu hay hành động thị trường.",
  },
};

const isPdfBackedLayer4Context = (
  context: NonNullable<IndustryContextRuntimePayload["context"]>,
): boolean => context.sourceLabel.startsWith("Phase 158D PDF Layer 4 - ");

const layer4DisplayContext = (
  context: NonNullable<IndustryContextRuntimePayload["context"]>,
): Layer4DisplayContext => {
  const pdfDisplay = context.industryCode ? pdfBackedVietnameseDisplayByIndustryCode[context.industryCode] : null;
  if (isPdfBackedLayer4Context(context) && pdfDisplay) {
    return {
      ...pdfDisplay,
      translationMode: "pdf_vi_display",
    };
  }

  return {
    industryName: context.industryName,
    industryOverview: context.industryOverview,
    howIndustryMakesMoney: context.howIndustryMakesMoney,
    keyDrivers: parseRuntimeList(context.keyDrivers),
    industryRisks: parseRuntimeList(context.industryRisks),
    macroSensitivity: parseRuntimeList(context.macroSensitivity),
    nextChecks: parseRuntimeList(context.nextChecks),
    commonMisread: context.commonMisread,
    translationMode: "source_text",
  };
};

const layer4SectionContextFromPayload = (
  payload: IndustryContextRuntimePayload,
): IndustryLayer4SectionContext | null => {
  const context = payload.context;
  if (!context?.reviewedQualitativeContextAvailable) return null;

  const displayContext = layer4DisplayContext(context);

  return {
    industryOverview: displayContext.industryOverview,
    howIndustryMakesMoney: displayContext.howIndustryMakesMoney,
    keyDrivers: displayContext.keyDrivers,
    industryRisks: displayContext.industryRisks,
    macroSensitivity: displayContext.macroSensitivity,
    nextChecks: displayContext.nextChecks,
    commonMisread: displayContext.commonMisread,
    sourceLabel: context.sourceLabel,
    asOfDate: context.asOfDate,
    translationMode: displayContext.translationMode,
  };
};

const runtimeContextsForIndustry = (
  runtimeContexts: IndustryContextRuntimePayload[],
  industryCode: string | null,
) =>
  runtimeContexts.filter((payload) =>
    payload.taxonomy.mappings.some((mapping) => mapping.industryCode === industryCode),
  );

const formatMetricValue = (value: number, unit: string): string => {
  const formatted = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);

  const unitLabelByCode: Record<string, string> = {
    million_tonnes: "trieu tan",
    percent: "%",
    vnd_trillion: "nghin ty VND",
  };

  return `${formatted} ${unitLabelByCode[unit] ?? unit}`;
};

type MetricReadingGuide = {
  meaning: string;
  companyChecks: string[];
  watchCase: string;
};

const metricReadingGuide = (
  metricCode: string,
  industryCode: string,
  value: number,
): MetricReadingGuide => {
  if (metricCode === "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION") {
    return {
      meaning:
        "So nay cho biet quy mo san xuat thep trong ky, dung de nhin nen cung-cau chung truoc khi doc doanh nghiep thep.",
      companyChecks: [
        "San luong ban hang cua doanh nghiep co di cung chieu thi truong khong",
        "Gia ban va bien gop co bi ep khi thi truong yeu khong",
        "Ton kho co tang nhanh hon doanh thu khong",
      ],
      watchCase:
        "Neu san luong nganh yeu ma doanh nghiep van giu duoc san luong, bien gop va ton kho, can doc ky de xem do loi the rieng hay do do tre so lieu.",
    };
  }

  if (metricCode === "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION_YOY") {
    const direction = value < 0 ? "giam" : "tang";
    return {
      meaning: `Toc do ${direction} so voi cung ky giup nhan dien chu ky thep dang nong len hay ha nhiet.`,
      companyChecks: [
        "Doanh thu thep tang/giam do san luong hay do gia ban",
        "Gia nguyen lieu co di nguoc voi gia ban thanh pham khong",
        "Dong tien van hanh co kem di khi chu ky yeu khong",
      ],
      watchCase:
        "Neu nganh giam nhung doanh nghiep rieng le van co ket qua vuot nen, dung vo vang gan do la xu huong ben vung; can doi chieu san luong, bien gop va ton kho.",
    };
  }

  if (metricCode === "RETAIL_SALES_VALUE_CURRENT_PRICE") {
    return {
      meaning:
        "Tong muc ban le theo gia hien hanh cho biet quy mo chi tieu danh nghia; so nay co the bi day len boi gia, khong chi boi luong hang ban ra.",
      companyChecks: [
        "Doanh thu cua doanh nghiep tang nhanh hon hay cham hon tong muc ban le",
        "Tang truong den tu mo them diem ban hay tu cua hang hien huu",
        "Bien gop va chi phi ban hang co giu duoc khi doanh thu tang khong",
      ],
      watchCase:
        "Neu doanh thu tang nhung bien gop, ton kho hoac chi phi kem di, can coi day la tang quy mo chua chac la tang chat luong loi nhuan.",
    };
  }

  if (metricCode === "RETAIL_SALES_VALUE_YOY_CURRENT_PRICE") {
    return {
      meaning:
        "Tang truong ban le danh nghia cho thay suc mua tinh theo gia tien, nhung can tach anh huong lam phat va gia ban.",
      companyChecks: [
        "Tang truong doanh thu co cao hon tang truong nganh khong",
        "Gia tri don hang va luong khach thay doi ra sao",
        "Ton kho co phu hop voi toc do ban hang khong",
      ],
      watchCase:
        "Neu nganh tang danh nghia manh nhung tang truong thuc thap, hay canh giac viec doanh thu tang chu yeu do gia, khong phai nhu cau that.",
    };
  }

  if (metricCode === "RETAIL_SALES_REAL_GROWTH") {
    return {
      meaning:
        "Tang truong thuc da loai bot mot phan anh huong gia, nen huu ich hon de doc suc mua that cua nguoi tieu dung.",
      companyChecks: [
        "Doanh thu cung cua hang co cai thien theo suc mua that khong",
        "Nhom hang nao dang keo tang truong va nhom nao yeu",
        "Chi phi van hanh co tang nhanh hon tang truong thuc khong",
      ],
      watchCase:
        "Neu tang truong thuc cham lai, doanh nghiep ban le can duoc kiem tra ky ve luong khach, hang ton va ap luc khuyen mai.",
    };
  }

  return {
    meaning:
      "Metric nay chi la dau vao de dat cau hoi khi doc nganh va doanh nghiep, khong phai ket luan san.",
    companyChecks:
      industryCode === "RETAIL"
        ? ["Doanh thu", "Bien gop", "Ton kho", "Chi phi ban hang", "Dong tien van hanh"]
        : ["San luong", "Gia ban", "Bien gop", "Ton kho", "Dong tien van hanh"],
    watchCase:
      "Neu metric nganh va so lieu doanh nghiep di khac nhau, can uu tien kiem tra ly do thay vi ket luan tu mot con so rieng le.",
  };
};

function IndustryRuntimeReadPathPanel({
  runtimeContexts,
  selectedIndustry,
}: {
  runtimeContexts: IndustryContextRuntimePayload[];
  selectedIndustry: (typeof industryCompassData.industries)[number];
}) {
  const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry.industryKey] ?? null;
  const matchingContexts = runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode);
  const hasMappings = matchingContexts.length > 0;

  return (
    <section>
      <SectionHeader
        eyebrow="Read-path"
        title="Dữ liệu ngành đang đọc từ hệ thống"
        description="Phần này chỉ hiện mapping ngành đã có trong DB. Nếu chưa có bối cảnh ngành có nguồn, UI giữ trạng thái thiếu dữ liệu."
      />
      <Card className="parent-surface-card">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant={hasMappings ? "success" : "warning"}>
              {hasMappings ? "Đã đọc mapping DB" : "Chưa có mapping DB cho ngành đang chọn"}
            </Chip>
            <Chip variant="warning">Dữ liệu nghiên cứu</Chip>
            <Chip variant="warning">Cần rà soát</Chip>
            <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {hasMappings ? (
              matchingContexts.map((payload) => {
                const primaryMapping =
                  payload.taxonomy.mappings.find((mapping) => mapping.industryCode === expectedIndustryCode) ??
                  payload.taxonomy.mappings[0];
                const qualitativeStatus = contextSourceStatusLabel(payload);

                return (
                  <article
                    key={`${payload.ticker}-${primaryMapping.industryCode}`}
                    className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{payload.ticker}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {primaryMapping.industryCode} - {primaryMapping.displayNameVi}
                        </p>
                      </div>
                      <Chip size="sm" variant="accent">
                        {primaryMapping.roleType}
                      </Chip>
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs leading-5">
                      <div>
                        <dt className="font-semibold text-subtle">Nguồn mapping</dt>
                        <dd className="font-bold text-ink">{primaryMapping.sourceLabel}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-subtle">Data mode</dt>
                        <dd className="font-bold text-ink">{runtimeDataModeLabel(primaryMapping.dataMode)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-subtle">IndustryContext</dt>
                        <dd className="font-bold text-ink">{qualitativeStatus}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 rounded-[4px] border border-warning bg-warning/10 px-3 py-2 text-xs leading-5 text-muted">
                      Mapping này chỉ dùng để điều hướng đọc ngành. Chưa có metric ngành, chưa có so sánh định lượng, và không thay thế bước đọc BCTC/rủi ro/định giá.
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-4 lg:col-span-3">
                <p className="text-sm font-bold text-ink">Chưa có mapping DB phù hợp cho ngành này.</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Trang không tự suy luận ticker hay ngành thay thế. Dữ liệu thiếu giữ nguyên trạng thái N/A.
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

function IndustryLayer4ContextPanel({
  runtimeContexts,
  selectedIndustry,
}: {
  runtimeContexts: IndustryContextRuntimePayload[];
  selectedIndustry: (typeof industryCompassData.industries)[number];
}) {
  const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry.industryKey] ?? null;
  const contexts = runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode).filter(
    (payload) => payload.context?.reviewedQualitativeContextAvailable,
  );

  if (contexts.length === 0) {
    return (
      <section>
        <SectionHeader
          eyebrow="Layer 4"
          title="Nguồn dữ liệu Layer 4"
          description="Chưa có bối cảnh ngành có nguồn cho ngành đang chọn. UI không tự lấy nội dung tĩnh để giả làm dữ liệu đã rà soát."
        />
        <Card>
          <CardBody>
            <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-sm leading-6 text-muted">
              Ngành này chưa có Layer 4 có nguồn. Dữ liệu thiếu giữ nguyên là N/A, không dùng hướng dẫn tĩnh để giả làm context đã rà soát.
            </p>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Layer 4"
        title="Nguồn dữ liệu Layer 4"
        description="Layer 4 đang làm nguồn cho các phần bên dưới. Khối này chỉ giữ nguồn, ngày dữ liệu và trạng thái rà soát."
      />
      <div className="space-y-4">
        {contexts.map((payload) => {
          const context = payload.context;
          if (!context) return null;

          const sourceUrl = context.provenanceSummary.sourceUrls[0] ?? null;
          const displayContext = layer4DisplayContext(context);

          return (
            <Card key={`${payload.ticker}-${context.industryCode ?? context.industryName}`}>
              <CardBody className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip variant="success">Có nguồn</Chip>
                      <Chip variant="warning">{runtimeDataModeLabel(context.dataMode)}</Chip>
                      <Chip variant="warning">Cần rà soát</Chip>
                      <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
                      {displayContext.translationMode === "pdf_vi_display" ? (
                        <Chip variant="accent">Bản hiển thị tiếng Việt</Chip>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-ink">
                      {payload.ticker} - {context.industryCode ?? displayContext.industryName}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Nội dung Layer 4 đang được dùng cho các phần bên dưới. Thẻ này chỉ giữ nguồn và trạng thái dữ liệu.
                    </p>
                  </div>
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-xs leading-5 text-muted">
                    <p className="font-bold text-ink">Nguồn</p>
                    <p className="mt-1">{context.sourceLabel}</p>
                    {sourceUrl ? (
                      <a
                        className="mt-2 block break-words font-semibold text-ink underline-offset-2 hover:underline"
                        href={sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Mo source URL
                      </a>
                    ) : (
                      <p className="mt-2 font-semibold text-ink">Source URL: N/A</p>
                    )}
                    <p className="mt-2">Rows provenance: {context.provenanceSummary.rowsFound}</p>
                    <p>As of: {context.asOfDate.slice(0, 10)}</p>
                  </div>
                </div>

                <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-xs leading-5 text-muted">
                  Đây là bối cảnh ngành có nguồn. Chưa có metric ngành, chưa có so sánh định lượng, chưa xếp hạng/chấm điểm, và không thay thế việc đọc BCTC/rủi ro/định giá.
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function IndustryMetricReadPathPanel({
  runtimeContexts,
  selectedIndustry,
}: {
  runtimeContexts: IndustryContextRuntimePayload[];
  selectedIndustry: (typeof industryCompassData.industries)[number];
}) {
  const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry.industryKey] ?? null;
  const contexts = runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode);
  const metricSummary = contexts.find((payload) => payload.industryMetricSummary?.industryCode === expectedIndustryCode)
    ?.industryMetricSummary;
  const metrics = metricSummary?.metrics ?? [];
  const hasMetrics = metricSummary?.status === "available" && metrics.length > 0;

  return (
    <section>
      <SectionHeader
        eyebrow="Layer 5"
        title="Ghi chu cach doc so lieu nganh"
        description="Cac metric hien co chi la dau vao nho de nguoi dung biet nen tu soi tiep dieu gi khi doc doanh nghiep."
      />
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Chip variant={hasMetrics ? "success" : "warning"}>
              {hasMetrics ? "Co metric DB" : "Chua co metric DB"}
            </Chip>
            <Chip variant="warning">research_only</Chip>
            <Chip variant="warning">needsReview=true</Chip>
            <Chip variant="neutral">productionApproved=false</Chip>
            <Chip variant="neutral">Chi la ghi chu doc so</Chip>
          </div>

          {hasMetrics ? (
            <div className="space-y-3">
              {metrics.map((metric) => (
                (() => {
                  const guide = metricReadingGuide(metric.metricCode, metric.industryCode, metric.value);

                  return (
                    <article
                      key={metric.sourceKey}
                      className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="accent">
                              {metric.periodLabel}
                            </Chip>
                            <Chip size="sm" variant="neutral">
                              provenance={metric.provenanceCount}
                            </Chip>
                          </div>
                          <p className="mt-3 text-sm font-bold text-ink">{metric.metricLabelVi}</p>
                          <p className="mt-1 text-xl font-bold text-ink">
                            {formatMetricValue(metric.value, metric.unit)}
                          </p>
                          <p className="mt-2 break-words text-[11px] leading-5 text-muted">
                            {metric.sourceLabel}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-subtle">
                              So nay noi gi
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted">{guide.meaning}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-subtle">
                              Can soi tiep
                            </p>
                            <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
                              {guide.companyChecks.map((check) => (
                                <li key={check} className="border-l border-warning pl-3">
                                  {check}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-subtle">
                              Can doc than trong
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted">{guide.watchCase}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })()
              ))}
            </div>
          ) : (
            <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-4">
              <p className="text-sm font-bold text-ink">Chua co metric nganh du dieu kien de ghi chu.</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Gia tri thieu giu nguyen la N/A. He thong khong lay taxonomy, peer group hay context chu de thay the
                so lieu.
              </p>
            </div>
          )}

          <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-xs leading-5 text-muted">
            Ghi chu nay chi huong dan cach tu doc so lieu. He thong khong tu dong bien metric thanh ket luan dau tu,
            khong thay the viec doc BCTC, rui ro va boi canh doanh nghiep.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}

export function IndustryPage({ initialIndustryContexts, onNavigate }: IndustryPageProps) {
  const [selectedIndustryId, setSelectedIndustryId] = useState(
    industryCompassData.industries[0]?.id ?? ""
  );
  const selectedIndustry = useMemo(
    () =>
      industryCompassData.industries.find((industry) => industry.id === selectedIndustryId) ??
      industryCompassData.industries[0],
    [selectedIndustryId]
  );
  const runtimeContexts = useMemo(
    () => Object.values(initialIndustryContexts ?? {}),
    [initialIndustryContexts],
  );
  const selectedLayer4Context = useMemo(() => {
    const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry?.industryKey ?? ""] ?? null;
    return (
      runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode)
        .map(layer4SectionContextFromPayload)
        .find((context): context is IndustryLayer4SectionContext => Boolean(context)) ?? null
    );
  }, [runtimeContexts, selectedIndustry?.industryKey]);

  if (industryPageData.isLoading) {
    return (
      <LoadingState
        description={industryPageData.loading.description}
        title={industryPageData.loading.title}
      />
    );
  }

  if (!selectedIndustry) {
    return (
      <EmptyState
        description={industryPageData.emptyState.description}
        icon={industryPageData.emptyState.icon}
        title={industryPageData.emptyState.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-8">
      <IndustryCurrentHeader
        industries={industryCompassData.industries}
        selectedIndustry={selectedIndustry}
        onSelectIndustry={setSelectedIndustryId}
      />
      <IndustryRuntimeReadPathPanel
        runtimeContexts={runtimeContexts}
        selectedIndustry={selectedIndustry}
      />
      <IndustryLayer4ContextPanel
        runtimeContexts={runtimeContexts}
        selectedIndustry={selectedIndustry}
      />
      <IndustryMetricReadPathPanel
        runtimeContexts={runtimeContexts}
        selectedIndustry={selectedIndustry}
      />
      <IndustryQuickPicture
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
      />
      <IndustryMoneyMap
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryMacroPressureSection
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
      />
      <IndustryDataConfirmationSection
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryConditionalConclusion
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
        onNavigate={onNavigate}
      />
      <IndustryCompanyMapSection
        selectedIndustry={selectedIndustry}
        onNavigate={onNavigate}
      />
    </div>
  );
}
