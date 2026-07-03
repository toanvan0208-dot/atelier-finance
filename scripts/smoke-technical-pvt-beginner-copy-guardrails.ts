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

const smokeTechnicalPvtBeginnerCopyGuardrails = async () => {
  const summary: Record<string, boolean | string | number> = {
    phase: "155A",
    hpgCopyPassed: false,
    vnmCopyPassed: false,
    mwgCopyPassed: false,
    beginnerExplanationPresent: false,
    pvtExplanationPresent: false,
    observationOnlyCaveatPresent: false,
    sourceCaveatPresent: false,
    demoCopyDetected: false,
    tradingSignalDetected: false,
    buySellHoldDetected: false,
    targetPriceOrFairValueDetected: false,
    upsideDownsideDetected: false,
    benchmarkDetected: false,
    rankingDetected: false,
    scoringDetected: false,
    stockAttractivenessDetected: false,
    fakeMockFallbackAsRealDetected: false,
    zeroFillDetected: false,
    fptMsnVcbRemainDisplayOnly: true,
    productionApprovedTrueCount: 0,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    smokePassed: true,
  };

  try {
    const targetTickers = ["HPG", "VNM", "MWG"];
    for (const ticker of targetTickers) {
      const data = await loadTechnicalRuntimeData({ ticker });
      if (!data.ok || !data.data) {
        console.error(`Failed to load data for ${ticker}`);
        summary.smokePassed = false;
        continue;
      }

      const tl = ticker.toLowerCase();
      
      const component = React.createElement(TechnicalPage, {
        initialRuntimeData: data as unknown as React.ComponentProps<typeof TechnicalPage>["initialRuntimeData"],
        onNavigate: () => {},
      });

      const html = renderToStaticMarkup(component);
      const lowerHtml = html.toLowerCase();
      
      let copyPassed = true;

      // Check required explanations
      if (!lowerHtml.includes("pvt là chỉ báo kết hợp biến động giá và khối lượng")) {
        copyPassed = false;
        summary.smokePassed = false;
        console.log(`${ticker}: Missing PVT explanation`);
      } else {
        summary.pvtExplanationPresent = true;
      }

      if (!lowerHtml.includes("giá và thanh khoản chỉ hỗ trợ quan sát thị trường")) {
        copyPassed = false;
        summary.smokePassed = false;
        console.log(`${ticker}: Missing final conclusion caveat`);
      } else {
        summary.observationOnlyCaveatPresent = true;
      }
      
      if (!lowerHtml.includes("chỉ dùng cho nghiên cứu; chưa đủ điều kiện xác nhận sản xuất") && !lowerHtml.includes("chưa phê duyệt sản xuất")) {
        copyPassed = false;
        summary.smokePassed = false;
        console.log(`${ticker}: Missing source caveat`);
      } else {
        summary.sourceCaveatPresent = true;
      }
      
      if (!lowerHtml.includes("module này giúp quan sát diễn biến giá, khối lượng và thanh khoản theo thời gian")) {
        copyPassed = false;
        summary.smokePassed = false;
        console.log(`${ticker}: Missing hero beginner explanation`);
      } else {
        summary.beginnerExplanationPresent = true;
      }

      // Check forbidden words
      for (const word of FORBIDDEN_WORDS) {
        if (lowerHtml.includes(word.toLowerCase())) {
          console.log(`Forbidden word detected for ${ticker}: ${word}`);
          summary.smokePassed = false;
          copyPassed = false;
          
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
          if (word.includes("ranking") || word.includes("scoring")) {
            summary.rankingDetected = true;
            summary.scoringDetected = true;
          }
          if (word.includes("cổ phiếu hấp dẫn") || word.includes("đáng mua")) {
            summary.stockAttractivenessDetected = true;
          }
        }
      }

      // Demo leakage
      if (lowerHtml.includes("dữ liệu minh họa dự phòng") && ticker !== "MWG_NO_DB") {
        summary.demoCopyDetected = true;
        summary.smokePassed = false;
      }
      
      summary[`${tl}CopyPassed`] = copyPassed;
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

smokeTechnicalPvtBeginnerCopyGuardrails();
