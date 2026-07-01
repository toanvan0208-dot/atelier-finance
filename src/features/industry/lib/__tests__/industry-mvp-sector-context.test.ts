import { describe, expect, it } from "vitest";
import { industryCompassData } from "../../data/industryCompass.data";

const expectedProfiles = {
  steel_materials: "HPG",
  retail: "MWG",
  dairy_consumer_staples: "VNM",
} as const;

const forbiddenRecommendationTerms = [
  "nên mua",
  "nên bán",
  "nên nắm giữ",
  "tín hiệu mua",
  "tín hiệu bán",
  "điểm mua",
  "cổ phiếu an toàn",
  "đáng mua",
  "giá mục tiêu",
  "fair value",
  "target price",
  "upside",
  "downside",
  "recommendation",
  "ngành hấp dẫn",
  "ngành tốt nhất",
  "cổ phiếu tốt nhất",
];

function normalizeText(value: unknown) {
  return JSON.stringify(value)
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function recommendationOccurrences(text: string, term: string) {
  const matches: string[] = [];
  let index = text.indexOf(term);

  while (index !== -1) {
    matches.push(text.slice(Math.max(0, index - 80), index + term.length + 80));
    index = text.indexOf(term, index + term.length);
  }

  return matches;
}

describe("industry MVP sector context", () => {
  it("contains exactly the three reviewed milestone industry profiles for HPG, MWG, and VNM", () => {
    expect(industryCompassData.industries.map((industry) => industry.industryKey)).toEqual(
      Object.keys(expectedProfiles)
    );

    for (const [industryKey, ticker] of Object.entries(expectedProfiles)) {
      const profile = industryCompassData.industries.find(
        (industry) => industry.industryKey === industryKey
      );

      expect(profile).toBeDefined();
      expect(profile?.relatedTickers).toContain(ticker);
    }
  });

  it("requires every profile to carry the minimum industry MVP contract", () => {
    for (const profile of industryCompassData.industries) {
      expect(profile.industryName).toBeTruthy();
      expect(profile.relatedTickers.length).toBeGreaterThan(0);
      expect(profile.shortDescription).toBeTruthy();
      expect(profile.mainDrivers.length).toBeGreaterThan(0);
      expect(profile.keyRisks.length).toBeGreaterThan(0);
      expect(profile.macroLinks.length).toBeGreaterThan(0);
      expect(profile.whatToCheckNext.length).toBeGreaterThan(0);
      expect(profile.dataStatus).toBeTruthy();
      expect(profile.dataMode).toBe("research_only");
      expect(profile.productionApproved).toBe(false);
    }
  });

  it("does not mark records available when source, period, or asOf metadata is missing", () => {
    for (const profile of industryCompassData.industries) {
      const hasRequiredMetadata = Boolean(profile.sourceName && profile.period && profile.asOf);

      if (!hasRequiredMetadata) {
        expect(profile.dataStatus).not.toBe("available");
      }
    }
  });

  it("keeps sample, research, unverified, partial, and missing profiles out of production approval", () => {
    for (const profile of industryCompassData.industries) {
      if (
        profile.dataMode === "sample" ||
        profile.dataMode === "research_only" ||
        profile.dataMode === "unavailable" ||
        profile.dataStatus === "sample" ||
        profile.dataStatus === "unverified" ||
        profile.dataStatus === "partial" ||
        profile.dataStatus === "missing"
      ) {
        expect(profile.productionApproved).toBe(false);
      }
    }
  });

  it("requires incomplete industry profiles to show warnings", () => {
    for (const profile of industryCompassData.industries) {
      if (profile.dataStatus !== "available") {
        expect(profile.warnings.length).toBeGreaterThan(0);
        expect(normalizeText(profile.warnings)).toContain("đang được hoàn thiện");
      }
    }
  });

  it("does not include old mock industry scores as real data in the compass data", () => {
    const text = normalizeText(industryCompassData);

    expect(text).not.toContain("58/100");
    expect(text).not.toContain("\"score\":58");
    expect(text).not.toContain("0-100");
  });

  it("does not use recommendation terms as positive industry copy", () => {
    const text = normalizeText(industryCompassData);

    for (const term of forbiddenRecommendationTerms) {
      const occurrences = recommendationOccurrences(text, term);
      const unsafeOccurrences = occurrences.filter((context) => !context.includes("không"));

      expect(unsafeOccurrences).toEqual([]);
    }
  });
});
