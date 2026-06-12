import type { BusinessUnderstandingProfile } from "./businessUnderstandingByTicker";

export type BusinessIndustryRuleKey = "retail" | "technology" | "steel" | "bank" | "default";

export type BusinessIndustryRule = {
  key: BusinessIndustryRuleKey;
  label: string;
  focusAreas: string[];
  watchSignals: string[];
  interpretation: string;
};

export const businessUnderstandingIndustryRules: Record<BusinessIndustryRuleKey, BusinessIndustryRule> = {
  retail: {
    key: "retail",
    label: "Bán lẻ",
    focusAreas: ["Sức mua", "Tồn kho", "Biên lợi nhuận", "Hiệu quả cửa hàng"],
    watchSignals: ["Doanh thu", "Biên lợi nhuận", "Tồn kho", "Dòng tiền kinh doanh"],
    interpretation:
      "Với doanh nghiệp bán lẻ, sức mua và vòng quay hàng hóa là biến số chính cần kiểm tra.",
  },
  technology: {
    key: "technology",
    label: "Công nghệ",
    focusAreas: ["Backlog", "Nhân sự", "Biên dịch vụ", "Doanh thu quốc tế"],
    watchSignals: ["Doanh thu dịch vụ công nghệ", "Biên lợi nhuận", "Backlog", "Chi phí nhân sự"],
    interpretation:
      "Với doanh nghiệp công nghệ, chất lượng nhân sự và backlog quyết định khả năng giữ biên.",
  },
  steel: {
    key: "steel",
    label: "Thép",
    focusAreas: ["Giá thép", "Sản lượng", "Spread", "Tồn kho nguyên liệu"],
    watchSignals: ["Sản lượng bán hàng", "Giá thép", "Biên lợi nhuận", "Tồn kho"],
    interpretation:
      "Với doanh nghiệp thép, chu kỳ hàng hóa và giá nguyên liệu thường chi phối kết quả kinh doanh.",
  },
  bank: {
    key: "bank",
    label: "Ngân hàng",
    focusAreas: ["NIM", "CASA", "Nợ xấu", "Dự phòng"],
    watchSignals: ["NIM", "CASA", "Tăng trưởng tín dụng", "Nợ xấu", "Dự phòng", "CIR", "ROE"],
    interpretation:
      "Với ngân hàng, chi phí vốn, chất lượng tài sản và dự phòng là ba điểm cần đọc trước.",
  },
  default: {
    key: "default",
    label: "Tổng quát",
    focusAreas: ["Mô hình kinh doanh", "Dòng tiền", "Biên lợi nhuận", "Rủi ro vận hành"],
    watchSignals: ["Doanh thu", "Biên lợi nhuận", "Dòng tiền kinh doanh"],
    interpretation: "Với doanh nghiệp này, cần đọc mô hình kinh doanh trước khi sang báo cáo tài chính.",
  },
};

export function getBusinessIndustryRule(profile: BusinessUnderstandingProfile) {
  const industry = profile.industry.toLowerCase();
  const businessType = profile.businessType.toLowerCase();

  if (industry.includes("bán lẻ") || businessType.includes("bán lẻ")) {
    return businessUnderstandingIndustryRules.retail;
  }

  if (industry.includes("công nghệ") || businessType.includes("công nghệ")) {
    return businessUnderstandingIndustryRules.technology;
  }

  if (industry.includes("thép") || businessType.includes("thép")) {
    return businessUnderstandingIndustryRules.steel;
  }

  if (industry.includes("ngân") || businessType.includes("ngân")) {
    return businessUnderstandingIndustryRules.bank;
  }

  return businessUnderstandingIndustryRules.default;
}
