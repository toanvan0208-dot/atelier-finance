import {
  buildMacroIndustryDataBoundary,
  validateMacroIndustryBoundaryInput,
  type MacroIndustryDomain,
} from "./macro-industry-data-boundary";

export type MacroIndustryReadinessUiModel = {
  domain: MacroIndustryDomain;
  moduleKey: "macro" | "industry";
  title: string;
  summary: string;
  badgeLabel: string;
  statusCards: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  requiredFields: string[];
  futureGates: Array<{
    label: string;
    detail: string;
  }>;
  boundaryBadges: string[];
  forbiddenCapabilities: {
    importUploadApi: false;
    dbWrite: false;
    parserOrFilesystemRead: false;
    recommendationOrScoring: false;
  };
};

const safeFieldLabels: Record<MacroIndustryDomain, Record<string, string>> = {
  macro: {
    creditGrowth: "Credit growth",
    exchangeRate: "Exchange rate",
    gdpGrowth: "GDP growth",
    inflation: "Inflation",
    moneySupplyGrowth: "Money supply growth",
    pmi: "PMI",
    policyRate: "Policy rate",
    unemploymentRate: "Unemployment rate",
  },
  industry: {
    exportValue: "Export value",
    grossMargin: "Gross margin",
    importValue: "Import value",
    industryCode: "Industry code",
    industryName: "Industry name",
    inventoryGrowth: "Inventory growth",
    profitGrowth: "Profit growth",
    revenueGrowth: "Revenue growth",
    sectorIndexChange: "Sector index change",
    sectorIndexLevel: "Sector index level",
  },
};

const gateLabels: Record<string, string> = {
  parser_or_adapter_design_required: "Thiết kế cách nhận dữ liệu",
  production_ingestion_blocked_by_default: "Mở kết nối dữ liệu thật",
  schema_design_required: "Thiết kế nơi lưu trữ",
  source_approval_workflow_required: "Kiểm tra và duyệt nguồn",
  ui_readiness_review_required: "Kiểm tra cách hiển thị",
  unit_metadata_persistence_required: "Lưu rõ đơn vị dữ liệu",
};

const gateDetails: Record<string, string> = {
  parser_or_adapter_design_required: "Chưa có cách nhận dữ liệu được duyệt.",
  production_ingestion_blocked_by_default: "Mặc định vẫn đóng cho đến khi có phase riêng được kiểm chứng.",
  schema_design_required: "Chưa có nơi lưu trữ dữ liệu được duyệt.",
  source_approval_workflow_required: "Cần ghi rõ nguồn, người rà soát, tài liệu tham chiếu và ghi chú kiểm tra.",
  ui_readiness_review_required: "Cần rà soát riêng trước khi đưa vào các module phân tích tiếp theo.",
  unit_metadata_persistence_required: "Cần khai báo và lưu rõ đơn vị trước khi dùng số liệu.",
};

export function buildMacroIndustryReadinessUiModel(
  domain: MacroIndustryDomain,
): MacroIndustryReadinessUiModel {
  const boundary = buildMacroIndustryDataBoundary();
  const validation = validateMacroIndustryBoundaryInput({
    asOf: null,
    dataMode: "sample",
    domain,
    fieldId: domain === "macro" ? "inflation" : "revenueGrowth",
    period: null,
    productionApproved: false,
    sourceEvidence: null,
    unit: null,
    value: null,
  });

  const fields = domain === "macro" ? boundary.macroSupportedFields : boundary.industrySupportedFields;
  const moduleKey = domain === "macro" ? "macro" : "industry";
  const title =
    domain === "macro"
      ? "Trạng thái sẵn sàng dữ liệu vĩ mô"
      : "Trạng thái sẵn sàng dữ liệu ngành";
  const vietnameseSubject = domain === "macro" ? "vĩ mô" : "ngành";

  return {
    domain,
    moduleKey,
    title,
    summary: `Dữ liệu ${vietnameseSubject} hiện ở trạng thái chuẩn bị kết nối. Màn hình này chỉ cho biết điều kiện cần có, chưa phải dữ liệu chính thức.`,
    badgeLabel: "Đang chuẩn bị",
    statusCards: [
      {
        label: "Nguồn và bằng chứng",
        value: validation.evidenceStatus === "missing" ? "Thiếu bằng chứng" : validation.evidenceStatus,
        detail: "Cần nhãn nguồn, người rà soát, tài liệu tham chiếu và ghi chú kiểm tra trước khi dùng tiếp.",
      },
      {
        label: "Đơn vị dữ liệu",
        value: validation.unit === "unknown_unit" ? "Cần khai báo rõ" : validation.unit,
        detail: "Không đoán đơn vị từ độ lớn số; thiếu đơn vị thì giá trị sẽ bị chặn.",
      },
      {
        label: "Rà soát nguồn",
        value: "Chưa đủ điều kiện",
        detail: "Nguồn mẫu, thủ công hoặc nghiên cứu chưa được dùng như nguồn chính thức.",
      },
      {
        label: "Sẵn sàng sử dụng",
        value: validation.readiness === "blocked" ? "Chưa sẵn sàng" : validation.readiness,
        detail: "Chưa đủ cơ sở để dùng cho phân tích tiếp theo; dữ liệu thiếu không được thay bằng 0.",
      },
    ],
    requiredFields: fields.map((field) => safeFieldLabels[domain][field.id] ?? field.id),
    futureGates: boundary.futurePhaseGates.map((gate) => ({
      label: gateLabels[gate] ?? gate,
      detail: gateDetails[gate] ?? "Cần phase riêng trước khi mở.",
    })),
    boundaryBadges: ["Thiếu bằng chứng nguồn", "Cần đơn vị rõ", "Nguồn chưa đủ điều kiện"],
    forbiddenCapabilities: {
      dbWrite: false,
      importUploadApi: false,
      parserOrFilesystemRead: false,
      recommendationOrScoring: false,
    },
  };
}
