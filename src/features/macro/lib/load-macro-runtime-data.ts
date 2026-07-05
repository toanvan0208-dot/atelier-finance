import { loadLatestMacroObservations } from "./macro-observation-read-path";
import { macroCompassData } from "../data/macroCompass.data";
import type { MacroCompassData, MacroCompassMetric } from "../types";
import { MACRO_INDICATOR_UNIVERSE } from "./macro-indicator-registry";
import { evaluateMacroObservationFreshness } from "./macro-stale-policy";
import { DOMESTIC_RATE_FRONTEND_INDICATOR_CODE } from "./macro-domestic-rate-semantic-mapping";
import { formatMacroCompassMetricValue } from "./macro-compass-data-contract";
import { buildMacroPracticalReading as buildSharedMacroPracticalReading } from "./macro-practical-reading";

type MacroObservationRuntimeRow = Awaited<ReturnType<typeof loadLatestMacroObservations>>["observations"][number];
type MacroIndicatorRegistryItem = (typeof MACRO_INDICATOR_UNIVERSE)[number];
type MacroIndicatorRuntimeItem = MacroIndicatorRegistryItem & {
  latestObservation: MacroObservationRuntimeRow | null;
  latestObservations: MacroObservationRuntimeRow[];
  freshness: ReturnType<typeof evaluateMacroObservationFreshness>;
};

const VIETNAM_DB_CANDIDATE_INDICATORS = new Set([
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
  "FOREIGN_NET_FLOW",
  "PMI_MANUFACTURING",
  "POLICY_RATE",
  "MARKET_TRADING_VALUE",
]);

const candidateCaveatByIndicator: Record<string, string> = {
  USD_VND: "Ty gia chuyen khoan Vietcombank, khong phai ty gia trung tam SBV.",
  EXPORT_GROWTH: "Tang truong duoc tinh tu tri gia xuat khau GSO, khong phai chi tieu tang truong cong bo truc tiep.",
  CREDIT_GROWTH: "Tang truong tin dung duoc tong hop thu cong tu nguon SBV/tin cong bo, khong phai CSV chinh thuc machine-readable cua SBV.",
  PUBLIC_INVESTMENT: "Don vi quyet dinh y nghia: billion_vnd la gia tri, percent_of_plan_ytd la ty le ke hoach luy ke.",
  FOREIGN_NET_FLOW: "Manual aggregated HOSE-only foreign investor net flow; positive and negative values describe market-flow terminology, not investment advice.",
  PMI_MANUFACTURING: "Manual/secondary-source PMI manufacturing candidate; unit is index and source/provenance must be reviewed before production approval.",
  POLICY_RATE: "Monthly carry-forward snapshot of the SBV refinancing rate; not a machine-readable official SBV feed.",
  MARKET_TRADING_VALUE: "Average daily/session trading value by month for HOSE, not total monthly trading value.",
};

const isReadableCandidateObservation = (
  observation: MacroObservationRuntimeRow | null | undefined,
): boolean => {
  if (!observation) return false;

  return (
    observation.productionApproved === false &&
    observation.needsReview === true &&
    typeof observation.value === "number" &&
    Number.isFinite(observation.value) &&
    typeof observation.unit === "string" &&
    observation.unit.length > 0 &&
    /candidate|manual|derived|provider/.test(
      `${observation.dataMode ?? ""} ${observation.sourceLabel ?? ""} ${observation.provenance?.providerType ?? ""}`,
    ) &&
    observation.provenance?.available === true
  );
};

const getLatestObservationsForIndicator = (
  observations: MacroObservationRuntimeRow[],
  indicatorCode: string,
): MacroObservationRuntimeRow[] => {
  const rows = observations.filter((observation) => observation.indicatorCode === indicatorCode);
  if (indicatorCode !== "PUBLIC_INVESTMENT") return rows.slice(0, 1);

  const latestByUnit = new Map<string, MacroObservationRuntimeRow>();
  for (const row of rows) {
    if (typeof row.unit === "string" && !latestByUnit.has(row.unit)) {
      latestByUnit.set(row.unit, row);
    }
  }
  return Array.from(latestByUnit.values());
};

const isReviewedStaticMetric = (metric: MacroCompassMetric): boolean =>
  metric.value !== null && (metric.dataMode === "reviewed" || metric.dataMode === "manual_reviewed");

const isReadableMetric = (metric: MacroCompassMetric | undefined): metric is MacroCompassMetric =>
  Boolean(metric && metric.value !== null && metric.status !== "missing");

const hydratePracticalReadings = (data: MacroCompassData): void => {
  for (const metric of [...data.worldMetrics, ...data.vietnamMetrics]) {
    metric.practicalReading = buildSharedMacroPracticalReading(metric);
  }
};

const hydrateCurrentPictureFromMetrics = (data: MacroCompassData): void => {
  const metricById = new Map(data.vietnamMetrics.map((metric) => [metric.id, metric]));
  const gdp = metricById.get("gdp");
  const cpi = metricById.get("cpi");
  const usdVnd = metricById.get("usd-vnd");
  const creditGrowth = metricById.get("credit-growth");
  const publicInvestment = metricById.get("public-investment");
  const pmi = metricById.get("pmi");
  const domesticRate = metricById.get("domestic-rate");
  const foreignFlow = metricById.get("foreign-flow");

  const readableReferenceCount = [gdp, cpi, usdVnd].filter(isReadableMetric).length;
  if (readableReferenceCount === 0) return;

  data.currentPicture = {
    ...data.currentPicture,
    state: "Có dữ liệu tham chiếu, chưa đủ để kết luận hiện tại",
    tone: "watch",
    summary:
      "Đã có dữ liệu tham chiếu cho một số biến vĩ mô chính. Các biến ngắn hạn như lãi suất, PMI, dòng vốn và dữ liệu cập nhật hơn vẫn cần được bổ sung trước khi kết luận bối cảnh hiện tại.",
    supports: [
      isReadableMetric(gdp)
        ? {
            label: "Tăng trưởng GDP",
            value:
              gdp.practicalReading?.current ??
              `${formatMacroCompassMetricValue(gdp)}. Dùng như nền tham chiếu cho sức khỏe kinh tế chung, không phải kết luận riêng cho một cổ phiếu.`,
            tone: "support",
          }
        : {
            label: "Tăng trưởng GDP",
            value: "Chưa đủ dữ liệu để đánh giá sức khỏe kinh tế chung.",
            tone: "neutral",
          },
      isReadableMetric(creditGrowth)
        ? {
            label: "Tín dụng",
            value:
              creditGrowth.practicalReading?.current ??
              `${formatMacroCompassMetricValue(creditGrowth)}. Cần đọc cùng chất lượng tín dụng và nhu cầu vay thật.`,
            tone: "watch",
          }
        : {
            label: "Tín dụng",
            value: "Chưa đủ dữ liệu để đánh giá lực hỗ trợ từ tín dụng.",
            tone: "neutral",
          },
      isReadableMetric(publicInvestment)
        ? {
            label: "Đầu tư công",
            value:
              publicInvestment.practicalReading?.current ??
              `${formatMacroCompassMetricValue(publicInvestment)}. Cần đối chiếu tiến độ giải ngân với doanh thu ngành liên quan.`,
            tone: "watch",
          }
        : {
            label: "Đầu tư công",
            value: "Chưa đủ dữ liệu để đánh giá lực hỗ trợ từ đầu tư công.",
            tone: "neutral",
          },
    ],
    pressures: [
      isReadableMetric(usdVnd)
        ? {
            label: "USD/VND",
            value:
              usdVnd.practicalReading?.current ??
              `${formatMacroCompassMetricValue(usdVnd)}. Đây là biến cần theo dõi với doanh nghiệp nhập khẩu, vay ngoại tệ hoặc chịu tác động dòng vốn.`,
            tone: "watch",
          }
        : {
            label: "USD/VND",
            value: "Chưa đủ dữ liệu để đánh giá áp lực tỷ giá.",
            tone: "neutral",
          },
      isReadableMetric(cpi)
        ? {
            label: "CPI",
            value:
              cpi.practicalReading?.current ??
              `${formatMacroCompassMetricValue(cpi)}. Cần đọc cùng sức mua, giá đầu vào và biên lợi nhuận từng ngành.`,
            tone: "watch",
          }
        : {
            label: "CPI",
            value: "Chưa đủ dữ liệu để đánh giá áp lực lạm phát.",
            tone: "neutral",
          },
      isReadableMetric(foreignFlow)
        ? {
            label: "Dòng vốn ngoại",
            value:
              foreignFlow.practicalReading?.current ??
              `${formatMacroCompassMetricValue(foreignFlow)}. Cần đọc cùng thanh khoản và nhóm vốn hóa lớn.`,
            tone: "watch",
          }
        : {
            label: "Dòng vốn ngoại",
            value: "Chưa đủ dữ liệu để đánh giá áp lực từ dòng vốn ngoại.",
            tone: "neutral",
          },
    ],
    unconfirmed: [
      {
        label: "Lãi suất",
        value: isReadableMetric(domesticRate)
          ? (domesticRate.practicalReading?.current ??
            `${formatMacroCompassMetricValue(domesticRate)}. Cần đọc cùng chi phí vay và chính sách tiền tệ.`)
          : "Chưa đủ dữ liệu để mô tả bối cảnh lãi suất hiện tại.",
        tone: isReadableMetric(domesticRate) ? "watch" : "neutral",
      },
      {
        label: "PMI",
        value: isReadableMetric(pmi)
          ? (pmi.practicalReading?.current ??
            `${formatMacroCompassMetricValue(pmi)}. Cần đọc cùng đơn hàng mới và sản xuất thực tế.`)
          : "Chưa đủ dữ liệu để biết trạng thái sản xuất gần nhất.",
        tone: isReadableMetric(pmi) ? "watch" : "neutral",
      },
      {
        label: "Dòng vốn ngoại",
        value: isReadableMetric(foreignFlow)
          ? (foreignFlow.practicalReading?.caveat ??
            `${formatMacroCompassMetricValue(foreignFlow)}. Cần theo dõi thêm để tránh đọc một kỳ dữ liệu như xu hướng chắc chắn.`)
          : "Chưa đủ dữ liệu để xác nhận xu hướng dòng vốn ngoại.",
        tone: isReadableMetric(foreignFlow) ? "watch" : "neutral",
      },
    ],
  };
};

const surfaceMacroFreshnessWarnings = (data: MacroCompassData): void => {
  const staleMetrics = [...data.vietnamMetrics, ...data.worldMetrics].filter(
    (metric) => metric.freshness?.staleStatus === "stale",
  );

  if (staleMetrics.length === 0) return;

  const staleNames = staleMetrics.map((metric) => metric.name).slice(0, 4).join(", ");
  const staleReason = staleMetrics[0]?.freshness?.reason ?? "Một số dữ liệu vĩ mô có thể đã cũ.";

  data.currentPicture = {
    ...data.currentPicture,
    tone: data.currentPicture.tone === "support" ? "watch" : data.currentPicture.tone,
    summary: `${data.currentPicture.summary} Lưu ý dữ liệu: ${staleNames} có thể đã cũ; không nên dùng như bức tranh hiện tại nếu chưa cập nhật hoặc đối chiếu nguồn mới hơn.`,
    unconfirmed: [
      {
        label: "Độ mới dữ liệu",
        value: `${staleNames} cần cập nhật/đối chiếu trước khi kết luận bối cảnh hiện tại. ${staleReason}`,
        tone: "watch",
      },
      ...data.currentPicture.unconfirmed,
    ],
  };

  data.warnings = [
    {
      id: "macro-stale-runtime-data",
      title: "Một số dữ liệu vĩ mô có thể đã cũ",
      level: "Chưa đủ dữ liệu",
      tone: "watch",
      why: `${staleNames} đang vượt ngưỡng cập nhật nhanh. Đây là cảnh báo chất lượng dữ liệu, không phải kết luận thị trường.`,
      confirmingData: "Cần cập nhật nguồn mới hơn hoặc đối chiếu lại ngày quan sát trước khi dùng để diễn giải hiện tại.",
      affected: ["Vĩ mô", "Ngành", "Lọc cổ phiếu"],
      nextAction: "Cập nhật nguồn dữ liệu hoặc đọc kèm ngày quan sát/asOf trong từng card chỉ số.",
      isPrimary: true,
    },
    ...data.warnings.filter((warning) => warning.id !== "macro-stale-runtime-data"),
  ];
};

export async function loadMacroRuntimeData(): Promise<MacroCompassData> {
  // Extract all indicator codes from the registry
  const indicatorCodes = MACRO_INDICATOR_UNIVERSE.map(item => item.indicatorCode);

  const dbResult = await loadLatestMacroObservations({
    indicatorCodes,
    limit: Math.max(500, indicatorCodes.length * 20),
  });

  const cloned = JSON.parse(JSON.stringify(macroCompassData)) as MacroCompassData;

  if (dbResult.error) {
    cloned.warnings = [
      {
        id: "macro-observation-read-error",
        title: "Không đọc được dữ liệu vĩ mô từ cơ sở dữ liệu",
        level: "Chưa đủ dữ liệu",
        tone: "watch",
        why: "Hệ thống không xác nhận được dữ liệu vĩ mô hiện tại từ bảng MacroObservation.",
        confirmingData: dbResult.error,
        affected: ["Vĩ mô", "Ngành", "Lọc cổ phiếu"],
        nextAction: "Kiểm tra kết nối Supabase và bảng MacroObservation trước khi kết luận bối cảnh hiện tại.",
        isPrimary: true,
      },
      ...cloned.warnings,
    ];
  }

  const indicatorUniverse: MacroIndicatorRuntimeItem[] = [];
  const dbBackedIndicators: string[] = [];
  const plannedIndicators: string[] = [];
  const sourceAssessmentNeededIndicators: string[] = [];
  const unsupportedIndicators: string[] = [];
  const indicatorsByCategory: Record<string, MacroIndicatorRuntimeItem[]> = {
    growth: [],
    inflation: [],
    rates: [],
    fx: [],
    market: []
  };

  // Build the new universe payload
  for (const registryItem of MACRO_INDICATOR_UNIVERSE) {
    const dbObservations = getLatestObservationsForIndicator(
      dbResult.observations ?? [],
      registryItem.indicatorCode,
    ).filter((observation) =>
      registryItem.supportStatus === "db_backed" || isReadableCandidateObservation(observation),
    );
    const dbObs = dbObservations[0] ?? null;
    const hasReadableDbObs = Boolean(dbObs);

    const finalItem: MacroIndicatorRuntimeItem = {
      ...registryItem,
      latestObservation: null as MacroObservationRuntimeRow | null,
      latestObservations: dbObservations,
      freshness: evaluateMacroObservationFreshness({
        observationDate: dbObs ? dbObs.observationDate : null,
        expectedFrequency: registryItem.expectedFrequency
      })
    };

    if (hasReadableDbObs) {
      dbBackedIndicators.push(registryItem.indicatorCode);
      finalItem.latestObservation = dbObs;
      if (VIETNAM_DB_CANDIDATE_INDICATORS.has(registryItem.indicatorCode)) {
        finalItem.limitations = Array.from(new Set([
          ...registryItem.limitations,
          "Du lieu he thong hien co, can kiem duyet; productionApproved=false; needsReview=true.",
          candidateCaveatByIndicator[registryItem.indicatorCode],
        ]));
      }
    } else if (registryItem.supportStatus === "planned" || registryItem.supportStatus === "candidate_source_identified") {
      plannedIndicators.push(registryItem.indicatorCode);
    } else if (registryItem.supportStatus === "source_assessment_needed") {
      sourceAssessmentNeededIndicators.push(registryItem.indicatorCode);
    } else {
      unsupportedIndicators.push(registryItem.indicatorCode);
    }

    indicatorUniverse.push(finalItem);
    indicatorsByCategory[registryItem.category]?.push(finalItem);
  }

  cloned.indicatorUniverse = indicatorUniverse;
  cloned.indicatorsByCategory = indicatorsByCategory;
  cloned.dbBackedIndicators = dbBackedIndicators;
  cloned.plannedIndicators = plannedIndicators;
  cloned.sourceAssessmentNeededIndicators = sourceAssessmentNeededIndicators;
  cloned.unsupportedIndicators = unsupportedIndicators;

  // Backward compatibility with legacy worldMetrics and vietnamMetrics
  const dbGdp = dbResult.observations?.find(o => o.indicatorCode === "GDP_GROWTH");
  const dbCpi = dbResult.observations?.find(o => o.indicatorCode === "CPI_YOY");
  
  const gdpReg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === "GDP_GROWTH");
  const cpiReg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === "CPI_YOY");

  function patchMetric(
    id: string,
    dbObs: MacroObservationRuntimeRow | null | undefined,
    registryMatch: MacroIndicatorRegistryItem | null | undefined,
    list: MacroCompassMetric[],
  ) {
    const idx = list.findIndex(m => m.id === id);
    if (idx !== -1) {
      const metric = list[idx];
      metric.supportStatus = registryMatch?.supportStatus;
      
      const freshness = evaluateMacroObservationFreshness({
        observationDate: dbObs ? dbObs.observationDate : null,
        expectedFrequency: registryMatch?.expectedFrequency
      });
      metric.freshness = freshness;

      if (dbObs) {
        metric.value = dbObs.value;
        metric.unit = dbObs.unit || "% YoY";
        metric.period = dbObs.observationDate.split("-")[0];
        metric.asOf = dbObs.observationDate.split("T")[0];
        metric.sourceName = dbObs.provenance?.providerType ?? dbObs.sourceLabel;
        metric.sourceLabel = dbObs.sourceLabel;
        metric.sourceRef = dbObs.provenance?.sourceUrl || null;
        metric.dataMode = "research_only";
        metric.productionApproved = dbObs.productionApproved;
        
        if (freshness.staleStatus === "stale") {
          metric.status = "stale";
          metric.statusLabel = "Dữ liệu có thể đã cũ";
        } else {
          metric.status = "available";
          metric.statusLabel = "Dữ liệu hệ thống";
        }
        
        metric.confidence = "Du lieu he thong hien co, can kiem duyet; productionApproved=false; needsReview=true.";
        
        const newWarnings: string[] = [];
        if (!dbObs.productionApproved) {
          newWarnings.push("Du lieu candidate tu he thong, chua duoc phe duyet production.");
        }
        if (dbObs.needsReview) {
          newWarnings.push("needsReview=true: can kiem duyet truoc khi xem la du lieu production.");
        }
        if (freshness.staleStatus === "stale") {
          newWarnings.push(freshness.reason);
        }
        const warningCodes = dbObs.provenance?.warningCodes ?? [];
        if (warningCodes.length > 0) {
          newWarnings.push(...warningCodes);
        }
        const semanticCaveats = dbObs.provenance?.semanticCaveats ?? [];
        if (semanticCaveats.length > 0) {
          newWarnings.push(...semanticCaveats);
        }
        if (registryMatch && candidateCaveatByIndicator[registryMatch.indicatorCode]) {
          newWarnings.push(candidateCaveatByIndicator[registryMatch.indicatorCode]);
        }
        if (newWarnings.length > 0) {
          metric.warnings = Array.from(new Set(newWarnings));
        }
      } else if (isReviewedStaticMetric(metric)) {
        metric.supportStatus = registryMatch?.supportStatus;
        metric.freshness = freshness;
      } else {
        // Force the missing metric data structure but update the reason
        metric.value = null;
        metric.unit = null;
        metric.period = null;
        metric.asOf = null;
        metric.sourceName = null;
        metric.sourceLabel = null;
        metric.sourceRef = null;
        metric.dataMode = "unavailable";
        metric.productionApproved = false;
        metric.status = "missing";
        
        if (registryMatch?.supportStatus === "planned" || registryMatch?.supportStatus === "candidate_source_identified") {
          metric.statusLabel = "Dự kiến hỗ trợ";
        } else if (registryMatch?.supportStatus === "source_assessment_needed") {
          metric.statusLabel = "Cần đánh giá nguồn";
        } else {
          metric.statusLabel = "Chưa có dữ liệu hệ thống";
        }
        metric.confidence = "Chưa có dữ liệu hệ thống";
        metric.whatToCheckNext = "Đang chờ tích hợp nguồn dữ liệu.";
      }
    }
  }

  patchMetric("gdp", dbGdp, gdpReg, cloned.vietnamMetrics);
  patchMetric("cpi", dbCpi, cpiReg, cloned.vietnamMetrics);

  // Clear fake data from all other non-db-backed legacy metrics
  // Also patch the non DB backed metrics to match registry
  const legacyMap: Record<string, string> = {
    "gdp": "GDP_GROWTH",
    "cpi": "CPI_YOY",
    "usd-vnd": "USD_VND",
    "fed-rate": "FED_FUNDS_RATE",
    "dxy": "DXY",
    "commodities": "BRENT_OIL_PRICE",
    "global-flow": "GLOBAL_FLOW",
    "pmi": "PMI_MANUFACTURING",
    "exports": "EXPORT_GROWTH",
    "domestic-rate": DOMESTIC_RATE_FRONTEND_INDICATOR_CODE,
    "foreign-flow": "FOREIGN_NET_FLOW",
    "credit-growth": "CREDIT_GROWTH",
    "public-investment": "PUBLIC_INVESTMENT",
    "market-liquidity": "MARKET_TRADING_VALUE"
  };

  const dynamicDbBackedIds = ["usd-vnd", "fed-rate", "dxy", "commodities", "global-flow", "pmi", "exports", "domestic-rate", "foreign-flow", "credit-growth", "public-investment", "market-liquidity"];

  for (const vMetric of cloned.vietnamMetrics) {
    if (dynamicDbBackedIds.includes(vMetric.id)) {
      const code = legacyMap[vMetric.id];
      const reg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === code);
      const dbObs = dbResult.observations?.find(o => o.indicatorCode === code);
      patchMetric(vMetric.id, dbObs || null, reg, cloned.vietnamMetrics);
    }
  }
  
  for (const wMetric of cloned.worldMetrics) {
    if (dynamicDbBackedIds.includes(wMetric.id)) {
      const code = legacyMap[wMetric.id];
      const reg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === code);
      const dbObs = dbResult.observations?.find(o => o.indicatorCode === code);
      patchMetric(wMetric.id, dbObs || null, reg, cloned.worldMetrics);
    }
  }

  hydratePracticalReadings(cloned);
  hydrateCurrentPictureFromMetrics(cloned);
  surfaceMacroFreshnessWarnings(cloned);

  return cloned;
}
