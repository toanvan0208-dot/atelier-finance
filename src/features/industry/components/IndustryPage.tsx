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
  if (value === "research_only") return "Du lieu nghien cuu";
  if (!value) return "Chua co";
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
  if (payload.context?.reviewedQualitativeContextAvailable) return "Co context co provenance";
  if (payload.context) return "Co context nhung chua du provenance";
  return "Chua co qualitative context co nguon";
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

const runtimeContextsForIndustry = (
  runtimeContexts: IndustryContextRuntimePayload[],
  industryCode: string | null,
) =>
  runtimeContexts.filter((payload) =>
    payload.taxonomy.mappings.some((mapping) => mapping.industryCode === industryCode),
  );

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
        title="Du lieu nganh dang doc tu he thong"
        description="Phan nay chi hien mapping nganh da co trong DB. Neu qualitative context chua co nguon, UI giu trang thai thieu du lieu."
      />
      <Card className="parent-surface-card">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant={hasMappings ? "success" : "warning"}>
              {hasMappings ? "Da doc mapping DB" : "Chua co mapping DB cho nganh dang chon"}
            </Chip>
            <Chip variant="warning">research_only</Chip>
            <Chip variant="warning">needsReview</Chip>
            <Chip variant="neutral">productionApproved=false</Chip>
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
                        <dt className="font-semibold text-subtle">Nguon mapping</dt>
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
                      Mapping nay chi dung de dieu huong doc nganh. Chua co metric nganh, chua co context Layer 4 day du, va khong thay the buoc doc BCTC/rui ro/dinh gia.
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-4 lg:col-span-3">
                <p className="text-sm font-bold text-ink">Chua co mapping DB phu hop cho nganh nay.</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Trang khong tu suy luan ticker hay nganh thay the. Du lieu thieu giu nguyen trang thai N/A.
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
          title="Ho so nganh co nguon"
          description="Chua co context co provenance cho nganh dang chon. UI khong tu lay noi dung tinh thay the."
        />
        <Card>
          <CardBody>
            <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-sm leading-6 text-muted">
              Layer 4 dang thieu cho nganh nay. Du lieu thieu giu nguyen la N/A, khong lay static guidance lam reviewed context.
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
        title="Ho so nganh co nguon"
        description="Noi dung ben duoi doc tu IndustryContext trong DB, kem provenance. Day la du lieu nghien cuu, chua production-approved."
      />
      <div className="space-y-4">
        {contexts.map((payload) => {
          const context = payload.context;
          if (!context) return null;

          const sourceUrl = context.provenanceSummary.sourceUrls[0] ?? null;
          const displayContext = layer4DisplayContext(context);

          return (
            <Card key={`${payload.ticker}-${context.industryCode ?? context.industryName}`}>
              <CardBody className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-[820px]">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip variant="success">Co provenance</Chip>
                      <Chip variant="warning">{runtimeDataModeLabel(context.dataMode)}</Chip>
                      <Chip variant="warning">needsReview</Chip>
                      <Chip variant="neutral">productionApproved=false</Chip>
                      {displayContext.translationMode === "pdf_vi_display" ? (
                        <Chip variant="accent">Ban hien thi tieng Viet</Chip>
                      ) : null}
                    </div>
                    <h2 className="text-xl font-bold leading-tight text-ink">{displayContext.industryName}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{displayContext.industryOverview ?? "N/A"}</p>
                  </div>
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-xs leading-5 text-muted lg:w-[320px]">
                    <p className="font-bold text-ink">Nguon</p>
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

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                    <p className="text-sm font-bold text-ink">Nganh kiem tien nhu the nao?</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{displayContext.howIndustryMakesMoney ?? "N/A"}</p>
                  </div>
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                    <p className="text-sm font-bold text-ink">Khong duoc ket luan qua da</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{displayContext.commonMisread ?? "N/A"}</p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-4">
                  {[
                    ["Drivers can xem", displayContext.keyDrivers],
                    ["Rui ro nganh", displayContext.industryRisks],
                    ["Nhay voi vi mo", displayContext.macroSensitivity],
                    ["Can kiem tra tiep", displayContext.nextChecks],
                  ].map(([title, items]) => (
                    <div key={title as string} className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
                      <p className="text-sm font-bold text-ink">{title as string}</p>
                      {(items as string[]).length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {(items as string[]).map((item) => (
                            <li key={item} className="border-l-2 border-warning pl-3 text-xs leading-5 text-muted">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs leading-5 text-muted">N/A</p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-xs leading-5 text-muted">
                  Layer 4 chi la qualitative context co nguon. Chua co metric nganh, chua co so sanh dinh luong, chua xep hang/cham diem, va khong thay the viec doc BCTC/rui ro/dinh gia.
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
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
      <IndustryQuickPicture selectedIndustry={selectedIndustry} />
      <IndustryMoneyMap
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryMacroPressureSection selectedIndustry={selectedIndustry} />
      <IndustryDataConfirmationSection
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryConditionalConclusion
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
