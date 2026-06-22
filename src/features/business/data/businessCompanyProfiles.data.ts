import type { BusinessCompanyProfile } from "../types";

const LOCAL_RESEARCH_SOURCE = "Atelier Finance local research context";
const LOCAL_RESEARCH_LABEL = "Metadata nghiên cứu nội bộ, đang rà soát nguồn";
const LOCAL_RESEARCH_REF =
  "Screening MVP candidate metadata và Industry MVP context trong repo";
const SOURCE_WARNING =
  "Nguồn ngoài, kỳ dữ liệu và ngày asOf chưa được xác nhận. Dữ liệu doanh nghiệp đang được rà soát.";
const DECISION_WARNING =
  "Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định. Đây không phải khuyến nghị đầu tư.";

function buildProfile({
  ticker,
  companyName,
  sector,
  industry,
  businessDescription,
  relatedIndustryKey,
}: {
  ticker: "FPT" | "MWG" | "VNM";
  companyName: string;
  sector: string;
  industry: string;
  businessDescription: string | null;
  relatedIndustryKey: string;
}): BusinessCompanyProfile {
  return {
    ticker,
    companyName,
    exchange: "HOSE",
    sector,
    industry,
    businessDescription,
    relatedIndustryKey,
    dataStatus: "partial",
    dataMode: "research_only",
    dataOrigin: "static_hardcode",
    productionApproved: false,
    sourceName: LOCAL_RESEARCH_SOURCE,
    sourceLabel: LOCAL_RESEARCH_LABEL,
    sourceRef: LOCAL_RESEARCH_REF,
    period: null,
    asOf: null,
    missingFields: [
      "Nguồn ngoài có thể kiểm tra lại",
      "Kỳ dữ liệu",
      "Ngày asOf",
      ...(businessDescription ? [] : ["Mô tả hoạt động doanh nghiệp đã xác minh"]),
    ],
    warnings: [SOURCE_WARNING, DECISION_WARNING],
  };
}

export const businessCompanyProfiles: Record<"FPT" | "MWG" | "VNM", BusinessCompanyProfile> = {
  FPT: buildProfile({
    ticker: "FPT",
    companyName: "CTCP FPT",
    sector: "Công nghệ thông tin",
    industry: "Công nghệ thông tin / Dịch vụ công nghệ",
    businessDescription:
      "Doanh nghiệp cung cấp dịch vụ công nghệ, viễn thông và giáo dục cho nhiều nhóm khách hàng.",
    relatedIndustryKey: "information_technology",
  }),
  MWG: buildProfile({
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    sector: "Bán lẻ",
    industry: "Bán lẻ",
    businessDescription:
      "Doanh nghiệp vận hành các chuỗi bán lẻ và kênh online; nội dung chi tiết hiện là bối cảnh nghiên cứu nội bộ.",
    relatedIndustryKey: "retail",
  }),
  VNM: buildProfile({
    ticker: "VNM",
    companyName: "CTCP Sữa Việt Nam",
    sector: "Hàng tiêu dùng thiết yếu",
    industry: "Sữa / hàng tiêu dùng thiết yếu",
    businessDescription: null,
    relatedIndustryKey: "dairy_consumer_staples",
  }),
};

export const businessCompanyProfileTickers = ["FPT", "MWG", "VNM"] as const;
