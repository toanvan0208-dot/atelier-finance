import { existsSync, readFileSync } from "node:fs";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "159A";

const TARGET_INDUSTRIES = [
  {
    industryCode: "STEEL_MATERIALS",
    ticker: "HPG",
    displayNameVi: "Thép và vật liệu xây dựng",
    layer5MetricCandidates: [
      {
        metricCode: "STEEL_APPARENT_CONSUMPTION",
        labelVi: "Tiêu thụ thép biểu kiến",
        unit: "tonnes_or_index",
        frequency: "month_or_quarter",
        purpose: "Xác nhận nhu cầu ngành thép đang tăng, giảm hay đi ngang.",
        sourceNeed: "Nguồn hiệp hội/ngành hoặc báo cáo thị trường có bảng số liệu.",
      },
      {
        metricCode: "STEEL_FINISHED_SALES_VOLUME",
        labelVi: "Sản lượng thép thành phẩm bán ra",
        unit: "tonnes",
        frequency: "month_or_quarter",
        purpose: "Tách tín hiệu sản lượng khỏi tín hiệu giá bán.",
        sourceNeed: "Nguồn ngành hoặc báo cáo doanh nghiệp nếu chỉ dùng làm dữ liệu xác nhận theo ticker.",
      },
      {
        metricCode: "STEEL_EXPORT_VOLUME_OR_VALUE",
        labelVi: "Sản lượng hoặc giá trị xuất khẩu thép",
        unit: "tonnes_or_currency",
        frequency: "month_or_quarter",
        purpose: "Kiểm tra ngành đang phụ thuộc cầu nội địa hay cầu xuất khẩu.",
        sourceNeed: "Nguồn hải quan, hiệp hội, hoặc báo cáo thị trường có trích dẫn rõ.",
      },
      {
        metricCode: "STEEL_PRICE_INDEX",
        labelVi: "Chỉ số hoặc giá thép tham chiếu",
        unit: "index_or_currency_per_tonne",
        frequency: "week_or_month",
        purpose: "Đọc áp lực giá bán; không dùng làm tín hiệu giao dịch cổ phiếu.",
        sourceNeed: "Nguồn giá được phép hiển thị/lưu cache hoặc dữ liệu nghiên cứu được rà soát.",
      },
      {
        metricCode: "IRON_ORE_COAL_INPUT_COST",
        labelVi: "Chi phí đầu vào quặng sắt/than",
        unit: "index_or_currency_per_tonne",
        frequency: "week_or_month",
        purpose: "Đọc áp lực biên lợi nhuận của ngành thép.",
        sourceNeed: "Nguồn hàng hóa có điều kiện sử dụng rõ ràng.",
      },
    ],
  },
  {
    industryCode: "RETAIL",
    ticker: "MWG",
    displayNameVi: "Bán lẻ",
    layer5MetricCandidates: [
      {
        metricCode: "RETAIL_SALES_INDEX",
        labelVi: "Chỉ số bán lẻ hàng hóa/dịch vụ",
        unit: "index_or_percent",
        frequency: "month",
        purpose: "Xác nhận sức mua chung của ngành bán lẻ.",
        sourceNeed: "Nguồn thống kê chính thức hoặc báo cáo ngành được phép dùng.",
      },
      {
        metricCode: "RETAIL_SAME_STORE_SALES",
        labelVi: "Tăng trưởng doanh thu cùng cửa hàng nếu có",
        unit: "percent",
        frequency: "quarter",
        purpose: "Tách tăng trưởng do mở rộng cửa hàng khỏi tăng trưởng nhu cầu thật.",
        sourceNeed: "Báo cáo doanh nghiệp hoặc nguồn ngành; thiếu thì để N/A.",
      },
      {
        metricCode: "RETAIL_GROSS_MARGIN",
        labelVi: "Biên gộp bán lẻ",
        unit: "percent",
        frequency: "quarter",
        purpose: "Kiểm tra cạnh tranh giá và cơ cấu hàng hóa.",
        sourceNeed: "BCTC doanh nghiệp nếu dùng làm xác nhận; không dùng làm xếp hạng.",
      },
      {
        metricCode: "RETAIL_INVENTORY_TURNOVER",
        labelVi: "Vòng quay tồn kho",
        unit: "turns_or_days",
        frequency: "quarter",
        purpose: "Đọc rủi ro tồn kho và dòng tiền.",
        sourceNeed: "Tính từ BCTC hoặc nguồn doanh nghiệp; cần công thức và kỳ dữ liệu rõ.",
      },
      {
        metricCode: "RETAIL_SELLING_EXPENSE_RATIO",
        labelVi: "Tỷ lệ chi phí bán hàng/doanh thu",
        unit: "percent",
        frequency: "quarter",
        purpose: "Kiểm tra áp lực vận hành khi doanh thu thay đổi.",
        sourceNeed: "BCTC doanh nghiệp hoặc dữ liệu đã chuẩn hóa.",
      },
    ],
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    ticker: "VNM",
    displayNameVi: "Sữa và hàng tiêu dùng thiết yếu",
    layer5MetricCandidates: [
      {
        metricCode: "CONSUMER_STAPLES_RETAIL_SALES",
        labelVi: "Bán lẻ nhóm hàng tiêu dùng thiết yếu",
        unit: "index_or_percent",
        frequency: "month_or_quarter",
        purpose: "Đọc sức mua nhóm tiêu dùng thiết yếu.",
        sourceNeed: "Nguồn thống kê hoặc báo cáo ngành có quyền sử dụng rõ.",
      },
      {
        metricCode: "DAIRY_REVENUE_GROWTH",
        labelVi: "Tăng trưởng doanh thu nhóm sữa",
        unit: "percent",
        frequency: "quarter",
        purpose: "Xác nhận tăng trưởng ngành/ticker đến từ nhu cầu, giá hay mix sản phẩm.",
        sourceNeed: "Báo cáo doanh nghiệp hoặc báo cáo ngành chuyên biệt; nếu chỉ có báo cáo tiêu dùng rộng thì để needs_review.",
      },
      {
        metricCode: "DAIRY_GROSS_MARGIN",
        labelVi: "Biên gộp ngành/doanh nghiệp sữa",
        unit: "percent",
        frequency: "quarter",
        purpose: "Đọc áp lực giá nguyên liệu, khuyến mại và cơ cấu sản phẩm.",
        sourceNeed: "BCTC hoặc nguồn ngành chuyên biệt.",
      },
      {
        metricCode: "MILK_INPUT_COST_INDEX",
        labelVi: "Chỉ số chi phí sữa/nguyên liệu đầu vào",
        unit: "index_or_currency",
        frequency: "month_or_quarter",
        purpose: "Đọc áp lực chi phí đầu vào cho ngành sữa.",
        sourceNeed: "Nguồn hàng hóa/nguyên liệu có quyền sử dụng rõ.",
      },
      {
        metricCode: "SELLING_EXPENSE_RATIO",
        labelVi: "Tỷ lệ chi phí bán hàng/doanh thu",
        unit: "percent",
        frequency: "quarter",
        purpose: "Kiểm tra áp lực phân phối và khuyến mại.",
        sourceNeed: "BCTC doanh nghiệp hoặc dữ liệu chuẩn hóa.",
      },
    ],
  },
] as const;

const FORBIDDEN_PATTERNS = [
  /\b(buy|sell|hold)\b/i,
  /khuyến nghị mua/i,
  /khuyến nghị bán/i,
  /giá mục tiêu/i,
  /target price/i,
  /fair value/i,
  /upside/i,
  /downside/i,
  /đáng mua/i,
  /stock attractiveness/i,
] as const;

type PrismaClientLike = typeof PrismaClientInstance;

const read = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of read(filePath).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const modelBlock = (schema: string, modelName: string): string => {
  const match = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? "";
};

const hasModel = (schema: string, modelName: string): boolean => modelBlock(schema, modelName).length > 0;

const hasForbiddenPattern = (value: string): boolean =>
  FORBIDDEN_PATTERNS.some((pattern) => pattern.test(value));

const countTableRows = async (db: PrismaClientLike, tableName: string) => {
  try {
    const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
      `select count(*)::bigint as count from "${tableName}"`,
    );
    return Number(result[0]?.count ?? 0);
  } catch {
    return 0;
  }
};

const countProductionApprovedTrue = async (db: PrismaClientLike, tableNames: string[]) => {
  const counts = await Promise.all(
    tableNames.map(async (tableName) => {
      try {
        const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
          `select count(*)::bigint as count from "${tableName}" where "productionApproved" = true`,
        );
        return Number(result[0]?.count ?? 0);
      } catch {
        return 0;
      }
    }),
  );

  return counts.reduce((sum, count) => sum + count, 0);
};

async function main() {
  loadEnvFile(".env");
  const [{ prisma }, { loadIndustryContextRuntimeByTicker }] = await Promise.all([
    import("../src/lib/database/client.js"),
    import("../src/features/industry/lib/load-industry-context.js"),
  ]);

  const schema = read("prisma/schema.prisma");
  const industryMetricModelPresent = hasModel(schema, "IndustryMetric");
  const currentCounts = {
    industryRows: await countTableRows(prisma, "Industry"),
    companyIndustryRows: await countTableRows(prisma, "CompanyIndustry"),
    industryContextRows: await countTableRows(prisma, "IndustryContext"),
    industryContextProvenanceRows: await countTableRows(prisma, "IndustryContextProvenance"),
    industryMetricRows: industryMetricModelPresent ? await countTableRows(prisma, "IndustryMetric") : 0,
    productionApprovedTrueCount: await countProductionApprovedTrue(prisma, [
      "Industry",
      "CompanyIndustry",
      "IndustryContext",
      "IndustryContextProvenance",
      ...(industryMetricModelPresent ? ["IndustryMetric"] : []),
    ]),
  };

  const targetReadiness = await Promise.all(
    TARGET_INDUSTRIES.map(async (industry) => {
      const runtime = await loadIndustryContextRuntimeByTicker(industry.ticker);
      return {
        ticker: industry.ticker,
        industryCode: industry.industryCode,
        displayNameVi: industry.displayNameVi,
        layer4ContextAvailable: runtime.context?.reviewedQualitativeContextAvailable ?? false,
        layer4SourceLabel: runtime.context?.sourceLabel ?? null,
        layer4ProductionApproved: runtime.context?.productionApproved ?? null,
        layer4NeedsReview: runtime.context?.needsReview ?? null,
        proposedMetricCount: industry.layer5MetricCandidates.length,
        proposedMetricCodes: industry.layer5MetricCandidates.map((metric) => metric.metricCode),
      };
    }),
  );

  const proposedDesign = TARGET_INDUSTRIES.map((industry) => ({
    industryCode: industry.industryCode,
    displayNameVi: industry.displayNameVi,
    tickerLane: industry.ticker,
    metricCandidates: industry.layer5MetricCandidates,
  }));

  const serializedDesign = JSON.stringify(proposedDesign);
  const forbiddenAdviceDetected = hasForbiddenPattern(serializedDesign);
  const blockersToLayer5 = [
    industryMetricModelPresent ? null : "IndustryMetric schema is missing, so no Layer 5 rows can be stored safely yet.",
    "Metric source rights and runtime display permissions are not reviewed in this dry run.",
    "Metric units, period alignment, and missing-value rules need a schema contract before import.",
    "Industry metrics must remain descriptive time-series/check metrics, not stock ranking, scoring, or recommendation.",
  ].filter((item): item is string => Boolean(item));

  const result = {
    phase: PHASE,
    mode: "dry_run_layer5_metric_design_only",
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    rawSourceImportAttempted: false,
    industryMetricWriteAttempted: false,
    benchmarkRankingScoringIntroduced: false,
    buySellHoldIntroduced: false,
    targetPriceFairValueUpsideDownsideIntroduced: false,
    stockAttractivenessIntroduced: false,
    industryMetricModelPresent,
    layer4ContextAvailableForTargets: targetReadiness.every((item) => item.layer4ContextAvailable),
    currentCounts,
    targetReadiness,
    proposedDesign,
    forbiddenAdviceDetected,
    layer5ReadyForImport: industryMetricModelPresent && !forbiddenAdviceDetected,
    blockersToLayer5,
    recommendedNextPhase: industryMetricModelPresent
      ? "Phase 159B - Industry Layer 5 Metric Source Review Dry Run"
      : "Phase 159B - IndustryMetric Schema Design Dry Run",
    auditPassed:
      !forbiddenAdviceDetected &&
      currentCounts.industryMetricRows === 0 &&
      currentCounts.productionApprovedTrueCount === 0,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.auditPassed) {
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
