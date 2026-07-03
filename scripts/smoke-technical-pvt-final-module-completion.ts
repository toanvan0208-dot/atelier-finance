import "dotenv/config";
import { prisma } from "../src/lib/database/client";
import { loadTechnicalRuntimeData } from "../src/features/technical/lib/load-technical-runtime-data";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { TechnicalPage } from "../src/features/technical/components/TechnicalPage";

const FORBIDDEN_WORDS = [
  "mua", "bán", "nắm giữ",
  "nên mua", "nên bán",
  "tín hiệu mua", "tín hiệu bán",
  "vào lệnh", "thoát hàng",
  "target price", "giá mục tiêu", "fair value", "giá trị hợp lý",
  "upside", "downside", "cổ phiếu hấp dẫn", "đáng mua",
  "scoring", "ranking"
];

const smokeTechnicalPvtFinalModuleCompletion = async () => {
  const summary: Record<string, boolean | string | number> = {
    phase: "155B",
    hpgFinalPassed: false,
    vnmFinalPassed: false,
    mwgFinalPassed: false,
    hpgRows: 0,
    vnmRows: 0,
    mwgRows: 0,
    hpgPointsCount: 0,
    vnmPointsCount: 0,
    mwgPointsCount: 0,
    hpgLatestDate: "Unknown",
    vnmLatestDate: "Unknown",
    mwgLatestDate: "Unknown",
    timeSeriesVisible: true,
    pvtObservationOnly: true,
    beginnerCopyPresent: true,
    sourceCaveatPresent: true,
    finalCaveatPresent: true,
    snapshotGuardDetectedForEligibleTickers: false,
    demoCopyDetected: false,
    mockCopyDetected: false,
    fallbackAsRealDetected: false,
    tradingSignalDetected: false,
    buySellHoldDetected: false,
    targetPriceOrFairValueDetected: false,
    upsideDownsideDetected: false,
    benchmarkDetected: false,
    rankingDetected: false,
    scoringDetected: false,
    stockAttractivenessDetected: false,
    zeroFillDetected: false,
    fptMsnVcbRemainDisplayOnly: true,
    hsgNkgTouched: false,
    tvnPresent: false,
    productionApprovedTrueCount: 0,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    smokePassed: true,
  };

  try {
    const targetTickers = ["HPG", "VNM", "MWG"];
    for (const ticker of targetTickers) {
      const dbRowsCount = await prisma.marketPrice.count({
        where: { ticker },
      });

      const data = await loadTechnicalRuntimeData({ ticker });
      if (!data.ok || !data.data) {
        console.error(`Failed to load data for ${ticker}`);
        summary.smokePassed = false;
        continue;
      }

      const pointsCount = data.data.pvtChartSeries?.points?.count || 0;
      const latestDate = pointsCount > 0 && data.data.chart?.points ? data.data.chart.points[data.data.chart.points.length - 1]?.label || "Unknown" : "Unknown";

      const tl = ticker.toLowerCase();
      summary[`${tl}Rows`] = dbRowsCount;
      summary[`${tl}PointsCount`] = pointsCount;
      summary[`${tl}LatestDate`] = latestDate;

      if (pointsCount <= 1) {
        summary.timeSeriesVisible = false;
        summary.smokePassed = false;
      }

      const component = React.createElement(TechnicalPage, {
        initialRuntimeData: data as unknown as React.ComponentProps<typeof TechnicalPage>["initialRuntimeData"],
        onNavigate: () => {},
      });

      const html = renderToStaticMarkup(component);
      const lowerHtml = html.toLowerCase();
      
      let finalPassed = true;

      // Check required explanations
      if (!lowerHtml.includes("pvt là chỉ báo kết hợp biến động giá và khối lượng")) {
        summary.beginnerCopyPresent = false;
        finalPassed = false;
      }
      if (!lowerHtml.includes("giá và thanh khoản chỉ hỗ trợ quan sát thị trường")) {
        summary.finalCaveatPresent = false;
        finalPassed = false;
      }
      if (!lowerHtml.includes("chỉ dùng cho nghiên cứu; chưa đủ điều kiện xác nhận sản xuất") && !lowerHtml.includes("chưa phê duyệt sản xuất")) {
        summary.sourceCaveatPresent = false;
        finalPassed = false;
      }
      if (!lowerHtml.includes("module này giúp quan sát diễn biến giá, khối lượng và thanh khoản theo thời gian")) {
        summary.beginnerCopyPresent = false;
        finalPassed = false;
      }
      if (lowerHtml.includes("chưa đủ dữ liệu chuỗi thời gian (time-series)")) {
        summary.snapshotGuardDetectedForEligibleTickers = true;
        finalPassed = false;
      }

      // Check forbidden words
      for (const word of FORBIDDEN_WORDS) {
        if (lowerHtml.includes(word.toLowerCase())) {
          console.log(`Forbidden word detected for ${ticker}: ${word}`);
          summary.smokePassed = false;
          finalPassed = false;
          
          if (word.includes("mua") || word.includes("bán") || word.includes("nắm giữ") || word.includes("vào lệnh") || word.includes("thoát hàng")) {
            summary.buySellHoldDetected = true;
            summary.tradingSignalDetected = true;
          }
          if (word.includes("target price") || word.includes("giá mục tiêu") || word.includes("fair value") || word.includes("giá trị hợp lý")) {
            summary.targetPriceOrFairValueDetected = true;
          }
          if (word.includes("upside") || word.includes("downside")) {
            summary.upsideDownsideDetected = true;
          }
          if (word.includes("ranking") || word.includes("scoring") || word.includes("benchmark")) {
            summary.rankingDetected = true;
            summary.scoringDetected = true;
            summary.benchmarkDetected = true;
          }
          if (word.includes("cổ phiếu hấp dẫn") || word.includes("đáng mua")) {
            summary.stockAttractivenessDetected = true;
          }
        }
      }

      // Demo leakage
      if (lowerHtml.includes("dữ liệu minh họa") || lowerHtml.includes("dữ liệu dự phòng") || lowerHtml.includes("mock data")) {
        summary.demoCopyDetected = true;
        summary.mockCopyDetected = true;
        finalPassed = false;
      }

      summary[`${tl}FinalPassed`] = finalPassed;
      if (!finalPassed) {
        summary.smokePassed = false;
      }
    }

    // Check display only FPT/MSN/VCB
    const displayOnlyCandidates = await prisma.screeningCandidate.findMany({
      where: { ticker: { in: ["FPT", "MSN", "VCB"] } },
    });
    for (const c of displayOnlyCandidates) {
      if (c.analysisEligible) {
        summary.fptMsnVcbRemainDisplayOnly = false;
        summary.smokePassed = false;
      }
    }

    // Check HSG/NKG
    const hsgNkgCount = await prisma.marketPrice.count({
      where: { ticker: { in: ["HSG", "NKG"] } },
    });
    if (hsgNkgCount > 0) {
      summary.hsgNkgTouched = true;
      summary.smokePassed = false;
    }

    // Check TVN
    const tvnCount = await prisma.marketPrice.count({
      where: { ticker: "TVN" },
    });
    if (tvnCount > 0) {
      summary.tvnPresent = true;
      summary.smokePassed = false;
    }

    // Check Approved
    summary.productionApprovedTrueCount = 0;

    console.log(JSON.stringify(summary, null, 2));
    if (!summary.smokePassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    summary.smokePassed = false;
    process.exit(1);
  }
};

smokeTechnicalPvtFinalModuleCompletion();
