import { describe, expect, it } from "vitest";
import {
  businessCompanyProfileTickers,
  businessCompanyProfiles,
} from "../../data/businessCompanyProfiles.data";
import { resolveBusinessJourneyData } from "../../components/BusinessPage";
import {
  findBusinessCompanyProfile,
  formatBusinessProfileField,
  getBusinessTickerFromSearch,
} from "../business-company-selection";

const expectedTickers = ["FPT", "MWG", "VNM"];

describe("business company data audit", () => {
  it("contains the three focused company profiles", () => {
    expect([...businessCompanyProfileTickers]).toEqual(expectedTickers);
    expect(Object.keys(businessCompanyProfiles)).toEqual(expectedTickers);
  });

  it.each(expectedTickers)("resolves %s from a Business query handoff", (ticker) => {
    const search = `?module=business&ticker=${ticker.toLowerCase()}`;
    const selectedTicker = getBusinessTickerFromSearch(search);

    expect(selectedTicker).toBe(ticker);
    expect(findBusinessCompanyProfile(selectedTicker)?.ticker).toBe(ticker);
  });

  it("keeps identity fields explicit and missing fields visible", () => {
    for (const profile of Object.values(businessCompanyProfiles)) {
      expect(profile.ticker).toBeTruthy();
      expect(profile.companyName).toBeTruthy();
      expect(profile.exchange || profile.missingFields).toBeTruthy();
      expect(profile.industry || profile.sector || profile.missingFields).toBeTruthy();
      expect(profile.dataMode).toBe("research_only");
      expect(profile.productionApproved).toBe(false);
      expect(profile.warnings.length).toBeGreaterThan(0);
    }
  });

  it("does not classify static metadata without period/asOf as available", () => {
    for (const profile of Object.values(businessCompanyProfiles)) {
      expect(profile.dataOrigin).toBe("static_hardcode");
      expect(profile.period).toBeNull();
      expect(profile.asOf).toBeNull();
      expect(profile.dataStatus).not.toBe("available");
    }
  });

  it("does not present sample or static content as production-approved", () => {
    for (const profile of Object.values(businessCompanyProfiles)) {
      if (["sample", "static_hardcode", "unknown"].includes(profile.dataOrigin)) {
        expect(profile.productionApproved).toBe(false);
        expect(profile.dataStatus).not.toBe("available");
      }
    }
  });

  it("formats missing fields without fake placeholders or zero-fill", () => {
    expect(formatBusinessProfileField(null)).toBe("Chưa đủ dữ liệu");
    expect(formatBusinessProfileField(undefined)).toBe("Chưa đủ dữ liệu");
    expect(formatBusinessProfileField("")).toBe("Chưa đủ dữ liệu");
    expect(formatBusinessProfileField(null)).not.toBe("0");
  });

  it("keeps VNM description missing instead of borrowing another ticker's content", () => {
    expect(businessCompanyProfiles.VNM.businessDescription).toBeNull();
    expect(businessCompanyProfiles.VNM.missingFields).toContain(
      "Mô tả hoạt động doanh nghiệp đã xác minh"
    );
  });

  it("does not borrow the MWG journey when an explicit FPT ticker is selected", () => {
    const result = resolveBusinessJourneyData("FPT");

    expect(result.profile?.ticker).toBe("FPT");
    expect(result.data).toBeNull();
    expect(result.isUsingSampleData).toBe(false);
  });

  it("does not borrow the MWG journey when an explicit VNM ticker is selected", () => {
    const result = resolveBusinessJourneyData("VNM");

    expect(result.profile?.ticker).toBe("VNM");
    expect(result.data).toBeNull();
    expect(result.isUsingSampleData).toBe(false);
  });

  it("uses the MWG sample journey only when the URL has no ticker", () => {
    const result = resolveBusinessJourneyData(null);

    expect(result.profile?.ticker).toBe("MWG");
    expect(result.data?.businessIdentity.ticker).toBe("MWG");
    expect(result.isUsingSampleData).toBe(true);
  });

  it("does not contain positive recommendation copy in company profile data", () => {
    const profileCopy = JSON.stringify(businessCompanyProfiles).toLowerCase();
    const forbiddenClaims = [
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
      "doanh nghiệp tốt",
      "doanh nghiệp xấu",
    ];

    for (const term of forbiddenClaims) {
      expect(profileCopy).not.toContain(term);
    }
  });
});
