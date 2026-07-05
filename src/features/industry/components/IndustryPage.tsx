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
  type IndustryLayer4SectionContext,
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
  if (value === "research_only") return "Dữ liệu nghiên cứu";
  if (!value) return "Chưa có";
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
  if (payload.context?.reviewedQualitativeContextAvailable) return "Có nội dung ngành kèm nguồn";
  if (payload.context) return "Có nội dung ngành nhưng chưa đủ nguồn";
  return "Chưa có bối cảnh ngành có nguồn";
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

const layer4DisplayContext = (
  context: NonNullable<IndustryContextRuntimePayload["context"]>,
): Layer4DisplayContext => {
  const pdfDisplay = context.industryCode ? pdfBackedVietnameseDisplayByIndustryCode[context.industryCode] : null;
  if (pdfDisplay) {
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

const layer4SectionContextFromPayload = (
  payload: IndustryContextRuntimePayload,
): IndustryLayer4SectionContext | null => {
  const context = payload.context;
  if (!context?.reviewedQualitativeContextAvailable) return null;

  const displayContext = layer4DisplayContext(context);

  return {
    industryOverview: displayContext.industryOverview,
    howIndustryMakesMoney: displayContext.howIndustryMakesMoney,
    keyDrivers: displayContext.keyDrivers,
    industryRisks: displayContext.industryRisks,
    macroSensitivity: displayContext.macroSensitivity,
    nextChecks: displayContext.nextChecks,
    commonMisread: displayContext.commonMisread,
    sourceLabel: context.sourceLabel,
    asOfDate: context.asOfDate,
    translationMode: displayContext.translationMode,
  };
};

const runtimeContextsForIndustry = (
  runtimeContexts: IndustryContextRuntimePayload[],
  industryCode: string | null,
) =>
  runtimeContexts.filter((payload) =>
    payload.taxonomy.mappings.some((mapping) => mapping.industryCode === industryCode),
  );

const formatMetricValue = (value: number, unit: string): string => {
  const formatted = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);

  const unitLabelByCode: Record<string, string> = {
    million_tonnes: "triệu tấn",
    percent: "%",
    vnd_trillion: "nghìn tỷ VND",
  };

  return `${formatted} ${unitLabelByCode[unit] ?? unit}`;
};

const metricDisplayLabel = (metricCode: string, fallback: string): string => {
  const labelByMetricCode: Record<string, string> = {
    RETAIL_SALES_REAL_GROWTH: "Tăng trưởng bán lẻ thực",
    RETAIL_SALES_VALUE_CURRENT_PRICE: "Tổng mức bán lẻ theo giá hiện hành",
    RETAIL_SALES_VALUE_YOY_CURRENT_PRICE: "Tăng trưởng tổng mức bán lẻ danh nghĩa",
    STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION: "Sản lượng thép thô toàn cầu",
    STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION_YOY: "Tăng trưởng sản lượng thép thô toàn cầu YoY",
    GROSS_MARGIN_COMPANY_REFERENCE: "Biên gộp tham chiếu một doanh nghiệp",
    NET_MARGIN_COMPANY_REFERENCE: "Biên ròng tham chiếu một doanh nghiệp",
  };

  return labelByMetricCode[metricCode] ?? fallback;
};

type MetricReadingGuide = {
  meaning: string;
  companyChecks: string[];
  watchCase: string;
};

type FutureMetricGuide = {
  label: string;
  readAs: string;
  nextCheck: string;
};

const futureMetricGuidesByIndustryCode: Record<string, FutureMetricGuide[]> = {
  STEEL_MATERIALS: [
    {
      label: "Sản lượng thép Việt Nam",
      readAs: "Dùng để xem nhu cầu và sản xuất trong nước đang mở rộng hay thu hẹp.",
      nextCheck: "Đối chiếu với sản lượng bán hàng, công suất sử dụng và tồn kho của doanh nghiệp thép.",
    },
    {
      label: "Tiêu thụ thép xây dựng",
      readAs: "Gắn trực tiếp với xây dựng, hạ tầng và bất động sản.",
      nextCheck: "Kiểm tra doanh thu nội địa, cơ cấu sản phẩm và nợ phải thu từ khách hàng xây dựng.",
    },
    {
      label: "Giá HRC",
      readAs: "Cho biết mặt bằng giá bán đầu ra của một nhóm sản phẩm thép quan trọng.",
      nextCheck: "So với giá nguyên liệu để xem biên gộp có nguy cơ bị ép hay được hỗ trợ.",
    },
    {
      label: "Giá quặng sắt",
      readAs: "Là đầu vào lớn của sản xuất thép, ảnh hưởng đến giá vốn.",
      nextCheck: "Kiểm tra biên gộp và tồn kho nguyên liệu khi giá quặng sắt biến động nhanh.",
    },
    {
      label: "Giá than luyện cốc",
      readAs: "Ảnh hưởng đến chi phí sản xuất, nhất là với doanh nghiệp dùng lò cao.",
      nextCheck: "Đối chiếu với biên gộp, giá bán và khả năng chuyển chi phí sang khách hàng.",
    },
    {
      label: "Biên lợi nhuận ngành nếu có nguồn",
      readAs: "Giúp nhìn áp lực lợi nhuận chung của ngành, nhưng không thay thế biên gộp doanh nghiệp.",
      nextCheck: "So với biên gộp riêng của doanh nghiệp để xem chênh lệch đến từ cơ cấu sản phẩm hay hiệu quả vận hành.",
    },
    {
      label: "Tồn kho thép",
      readAs: "Tồn kho cao có thể báo hiệu cầu yếu, giá đảo chiều hoặc chu kỳ đang chậm lại.",
      nextCheck: "Kiểm tra tồn kho/doanh thu, dự phòng giảm giá hàng tồn kho và dòng tiền vận hành.",
    },
  ],
  RETAIL: [
    {
      label: "Tổng mức bán lẻ",
      readAs: "Cho biết quy mô chi tiêu danh nghĩa của nền kinh tế.",
      nextCheck: "Tách tăng trưởng do giá và tăng trưởng do lượng khách/lượng hàng bán ra.",
    },
    {
      label: "Tăng trưởng bán lẻ thực",
      readAs: "Hữu ích để đọc sức mua thật sau khi loại bớt một phần tác động giá.",
      nextCheck: "Đối chiếu với doanh thu cùng cửa hàng, lượng khách và giá trị đơn hàng.",
    },
    {
      label: "Lưu lượng khách",
      readAs: "Cho biết cửa hàng/khu bán lẻ có hút khách hay không.",
      nextCheck: "Kiểm tra tỷ lệ chuyển đổi, giá trị đơn hàng và chi phí khuyến mãi.",
    },
    {
      label: "Doanh số online/offline nếu có",
      readAs: "Giúp tách tăng trưởng đến từ kênh bán và hành vi mua sắm.",
      nextCheck: "Kiểm tra biên lợi nhuận từng kênh, chi phí giao hàng và vòng quay tồn kho.",
    },
    {
      label: "Chỉ số niềm tin tiêu dùng",
      readAs: "Là tín hiệu sớm về tâm lý chi tiêu của hộ gia đình.",
      nextCheck: "Đối chiếu với doanh thu các nhóm hàng không thiết yếu và mức khuyến mãi.",
    },
    {
      label: "Tăng trưởng thu nhập/hộ gia đình",
      readAs: "Ảnh hưởng đến sức mua và khả năng chi cho hàng không thiết yếu.",
      nextCheck: "Kiểm tra cơ cấu hàng hóa, giá trị giỏ hàng và tỷ lệ hàng cao cấp/phổ thông.",
    },
  ],
  CONSUMER_STAPLES_DAIRY: [
    {
      label: "Sản lượng sữa",
      readAs: "Cho biết quy mô cung/cầu vật lý của ngành sữa.",
      nextCheck: "Đối chiếu với sản lượng bán ra, tồn kho và công suất nhà máy của doanh nghiệp.",
    },
    {
      label: "Tiêu thụ sữa bình quân",
      readAs: "Giúp đọc dư địa tăng trưởng dài hạn của nhu cầu sữa.",
      nextCheck: "Kiểm tra tăng trưởng theo nhóm sản phẩm và khu vực phân phối.",
    },
    {
      label: "Giá sữa bột nguyên liệu",
      readAs: "Ảnh hưởng đến giá vốn của doanh nghiệp sản xuất sữa.",
      nextCheck: "Đối chiếu với biên gộp, tồn kho nguyên liệu và khả năng điều chỉnh giá bán.",
    },
    {
      label: "Tăng trưởng FMCG",
      readAs: "Cho biết nền cầu của hàng tiêu dùng nhanh.",
      nextCheck: "Tách riêng ngành sữa với các nhóm FMCG khác, tránh đọc quá rộng.",
    },
    {
      label: "Tăng trưởng tiêu dùng thiết yếu",
      readAs: "Giúp xem nhóm hàng cần thiết có còn giữ được sức mua không.",
      nextCheck: "Kiểm tra sản lượng, giá bán, khuyến mãi và biên gộp doanh nghiệp.",
    },
    {
      label: "Biên gộp ngành nếu có nguồn",
      readAs: "Dùng để xem áp lực lợi nhuận chung, không phải mức chuẩn để kết luận doanh nghiệp.",
      nextCheck: "So với biên gộp riêng, chi phí bán hàng và cơ cấu sản phẩm của doanh nghiệp.",
    },
  ],
};

const metricReadingGuide = (
  metricCode: string,
  industryCode: string,
  value: number,
): MetricReadingGuide => {
  if (metricCode === "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION") {
    return {
      meaning:
        "Số này cho biết quy mô sản xuất thép trong kỳ, dùng để nhìn nền cung-cầu chung trước khi đọc doanh nghiệp thép.",
      companyChecks: [
        "Sản lượng bán hàng của doanh nghiệp có đi cùng chiều thị trường không",
        "Giá bán và biên gộp có bị ép khi thị trường yếu không",
        "Tồn kho có tăng nhanh hơn doanh thu không",
      ],
      watchCase:
        "Nếu sản lượng ngành yếu mà doanh nghiệp vẫn giữ được sản lượng, biên gộp và tồn kho, cần đọc kỹ để xem đó là lợi thế riêng hay do độ trễ số liệu.",
    };
  }

  if (metricCode === "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION_YOY") {
    const direction = value < 0 ? "giam" : "tang";
    return {
      meaning: `Tốc độ ${direction === "giam" ? "giảm" : "tăng"} so với cùng kỳ giúp nhận diện chu kỳ thép đang nóng lên hay hạ nhiệt.`,
      companyChecks: [
        "Doanh thu thép tăng/giảm do sản lượng hay do giá bán",
        "Giá nguyên liệu có đi ngược với giá bán thành phẩm không",
        "Dòng tiền vận hành có kém đi khi chu kỳ yếu không",
      ],
      watchCase:
        "Nếu ngành giảm nhưng doanh nghiệp riêng lẻ vẫn có kết quả vượt nền, đừng vội gán đó là xu hướng bền vững; cần đối chiếu sản lượng, biên gộp và tồn kho.",
    };
  }

  if (metricCode === "RETAIL_SALES_VALUE_CURRENT_PRICE") {
    return {
      meaning:
        "Tổng mức bán lẻ theo giá hiện hành cho biết quy mô chi tiêu danh nghĩa; số này có thể bị đẩy lên bởi giá, không chỉ bởi lượng hàng bán ra.",
      companyChecks: [
        "Doanh thu của doanh nghiệp tăng nhanh hơn hay chậm hơn tổng mức bán lẻ",
        "Tăng trưởng đến từ mở thêm điểm bán hay từ cửa hàng hiện hữu",
        "Biên gộp và chi phí bán hàng có giữ được khi doanh thu tăng không",
      ],
      watchCase:
        "Nếu doanh thu tăng nhưng biên gộp, tồn kho hoặc chi phí kém đi, cần coi đây là tăng quy mô, chưa chắc là tăng chất lượng lợi nhuận.",
    };
  }

  if (metricCode === "RETAIL_SALES_VALUE_YOY_CURRENT_PRICE") {
    return {
      meaning:
        "Tăng trưởng bán lẻ danh nghĩa cho thấy sức mua tính theo giá tiền, nhưng cần tách ảnh hưởng lạm phát và giá bán.",
      companyChecks: [
        "Tăng trưởng doanh thu có cao hơn tăng trưởng ngành không",
        "Giá trị đơn hàng và lượng khách thay đổi ra sao",
        "Tồn kho có phù hợp với tốc độ bán hàng không",
      ],
      watchCase:
        "Nếu ngành tăng danh nghĩa mạnh nhưng tăng trưởng thực thấp, hãy cảnh giác việc doanh thu tăng chủ yếu do giá, không phải nhu cầu thật.",
    };
  }

  if (metricCode === "RETAIL_SALES_REAL_GROWTH") {
    return {
      meaning:
        "Tăng trưởng thực đã loại bớt một phần ảnh hưởng giá, nên hữu ích hơn để đọc sức mua thật của người tiêu dùng.",
      companyChecks: [
        "Doanh thu cùng cửa hàng có cải thiện theo sức mua thật không",
        "Nhóm hàng nào đang kéo tăng trưởng và nhóm nào yếu",
        "Chi phí vận hành có tăng nhanh hơn tăng trưởng thực không",
      ],
      watchCase:
        "Nếu tăng trưởng thực chậm lại, doanh nghiệp bán lẻ cần được kiểm tra kỹ về lượng khách, hàng tồn và áp lực khuyến mãi.",
    };
  }

  if (metricCode === "GROSS_MARGIN_COMPANY_REFERENCE") {
    return {
      meaning:
        "Đây là biên gộp của một doanh nghiệp đại diện đang có dữ liệu rõ, dùng để đặt câu hỏi so sánh sơ bộ. Đây chưa phải trung vị ngành hay benchmark định giá.",
      companyChecks: [
        "So với biên gộp của chính doanh nghiệp qua 3-5 năm",
        "Kiểm tra cơ cấu sản phẩm và giá vốn có khác doanh nghiệp tham chiếu không",
        "Đọc cùng biên ròng, tồn kho và dòng tiền vận hành",
      ],
      watchCase:
        "Nếu doanh nghiệp lệch mạnh so với con số tham chiếu, cần tìm nguyên nhân vận hành hoặc cơ cấu sản phẩm; không tự kết luận tốt/xấu từ chênh lệch này.",
    };
  }

  if (metricCode === "NET_MARGIN_COMPANY_REFERENCE") {
    return {
      meaning:
        "Đây là biên ròng của một doanh nghiệp đại diện đang có dữ liệu rõ, giúp nhìn sau chi phí vận hành, tài chính và thuế. Đây chưa phải chuẩn ngành.",
      companyChecks: [
        "So với biên ròng lịch sử của chính doanh nghiệp",
        "Kiểm tra chi phí bán hàng, quản lý và lãi vay",
        "Đọc cùng CFO/LNST để xem lợi nhuận có chuyển thành tiền không",
      ],
      watchCase:
        "Biên ròng thấp hơn tham chiếu có thể do mô hình kinh doanh, chu kỳ, chi phí hoặc cấu trúc vốn khác nhau; cần giải thích nguyên nhân trước khi đánh giá.",
    };
  }

  return {
    meaning:
      "Metric này chỉ là đầu vào để đặt câu hỏi khi đọc ngành và doanh nghiệp, không phải kết luận sẵn.",
    companyChecks:
      industryCode === "RETAIL"
        ? ["Doanh thu", "Biên gộp", "Tồn kho", "Chi phí bán hàng", "Dòng tiền vận hành"]
        : ["Sản lượng", "Giá bán", "Biên gộp", "Tồn kho", "Dòng tiền vận hành"],
    watchCase:
      "Nếu metric ngành và số liệu doanh nghiệp đi khác nhau, cần ưu tiên kiểm tra lý do thay vì kết luận từ một con số riêng lẻ.",
  };
};

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
        title="Dữ liệu ngành đang đọc từ hệ thống"
        description="Phần này chỉ hiện mapping ngành đã có trong DB. Nếu chưa có bối cảnh ngành có nguồn, UI giữ trạng thái thiếu dữ liệu."
      />
      <Card className="parent-surface-card">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant={hasMappings ? "success" : "warning"}>
              {hasMappings ? "Đã đọc mapping DB" : "Chưa có mapping DB cho ngành đang chọn"}
            </Chip>
            <Chip variant="warning">Dữ liệu nghiên cứu</Chip>
            <Chip variant="warning">Cần rà soát</Chip>
            <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
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
                        <dt className="font-semibold text-subtle">Nguồn mapping</dt>
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
                      Mapping này chỉ dùng để điều hướng đọc ngành. Chưa có metric ngành, chưa có so sánh định lượng, và không thay thế bước đọc BCTC/rủi ro/định giá.
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-4 lg:col-span-3">
                <p className="text-sm font-bold text-ink">Chưa có mapping DB phù hợp cho ngành này.</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Trang không tự suy luận ticker hay ngành thay thế. Dữ liệu thiếu giữ nguyên trạng thái N/A.
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
          title="Nguồn dữ liệu Layer 4"
          description="Chưa có bối cảnh ngành có nguồn cho ngành đang chọn. UI không tự lấy nội dung tĩnh để giả làm dữ liệu đã rà soát."
        />
        <Card>
          <CardBody>
            <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-sm leading-6 text-muted">
              Ngành này chưa có Layer 4 có nguồn. Dữ liệu thiếu giữ nguyên là N/A, không dùng hướng dẫn tĩnh để giả làm context đã rà soát.
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
        title="Nguồn dữ liệu Layer 4"
        description="Layer 4 đang làm nguồn cho các phần bên dưới. Khối này chỉ giữ nguồn, ngày dữ liệu và trạng thái rà soát."
      />
      <div className="space-y-4">
        {contexts.map((payload) => {
          const context = payload.context;
          if (!context) return null;

          const sourceUrl = context.provenanceSummary.sourceUrls[0] ?? null;
          const displayContext = layer4DisplayContext(context);

          return (
            <Card key={`${payload.ticker}-${context.industryCode ?? context.industryName}`}>
              <CardBody className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip variant="success">Có nguồn</Chip>
                      <Chip variant="warning">{runtimeDataModeLabel(context.dataMode)}</Chip>
                      <Chip variant="warning">Cần rà soát</Chip>
                      <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
                      {displayContext.translationMode === "pdf_vi_display" ? (
                        <Chip variant="accent">Bản hiển thị tiếng Việt</Chip>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-ink">
                      {payload.ticker} - {context.industryCode ?? displayContext.industryName}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Nội dung Layer 4 đang được dùng cho các phần bên dưới. Thẻ này chỉ giữ nguồn và trạng thái dữ liệu.
                    </p>
                  </div>
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-xs leading-5 text-muted">
                    <p className="font-bold text-ink">Nguồn</p>
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

                <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-xs leading-5 text-muted">
                  Đây là bối cảnh ngành có nguồn. Chưa có metric ngành, chưa có so sánh định lượng, chưa xếp hạng/chấm điểm, và không thay thế việc đọc BCTC/rủi ro/định giá.
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function IndustryMetricReadPathPanel({
  runtimeContexts,
  selectedIndustry,
}: {
  runtimeContexts: IndustryContextRuntimePayload[];
  selectedIndustry: (typeof industryCompassData.industries)[number];
}) {
  const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry.industryKey] ?? null;
  const contexts = runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode);
  const metricSummary = contexts.find((payload) => payload.industryMetricSummary?.industryCode === expectedIndustryCode)
    ?.industryMetricSummary;
  const metrics = metricSummary?.metrics ?? [];
  const hasMetrics = metricSummary?.status === "available" && metrics.length > 0;
  const futureMetricGuides = expectedIndustryCode ? futureMetricGuidesByIndustryCode[expectedIndustryCode] ?? [] : [];
  const [showFutureMetricGuide, setShowFutureMetricGuide] = useState(false);
  const [showMetricReadPath, setShowMetricReadPath] = useState(false);

  return (
    <section className="flex flex-col items-start gap-3">
      <button
        type="button"
        className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-2 text-xs font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-surface-hover"
        aria-expanded={showMetricReadPath}
        onClick={() => setShowMetricReadPath((value) => !value)}
      >
        {showMetricReadPath ? "Ẩn ghi chú cách đọc số liệu ngành" : "Xem ghi chú cách đọc số liệu ngành"}
      </button>

      {showMetricReadPath ? (
      <>
      <SectionHeader
        eyebrow="Layer 5"
        title="Ghi chú cách đọc số liệu ngành"
        description="Các metric hiện có chỉ là đầu vào nhỏ để người dùng biết nên tự soi tiếp điều gì khi đọc doanh nghiệp."
      />
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Chip variant={hasMetrics ? "success" : "warning"}>
              {hasMetrics ? "Có metric DB" : "Chưa có metric DB"}
            </Chip>
            <Chip variant="warning">research_only</Chip>
            <Chip variant="warning">needsReview=true</Chip>
            <Chip variant="neutral">productionApproved=false</Chip>
            <Chip variant="neutral">Chỉ là ghi chú đọc số</Chip>
          </div>

          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">Chỉ số nên tự tìm thêm</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Đây là checklist đọc số liệu cho người dùng, chưa phải metric trong DB.
                </p>
              </div>
              <button
                type="button"
                className="rounded-[4px] border border-border-strong bg-surface px-3 py-2 text-xs font-bold text-ink transition hover:bg-warning/10"
                aria-expanded={showFutureMetricGuide}
                onClick={() => setShowFutureMetricGuide((value) => !value)}
              >
                {showFutureMetricGuide ? "Ẩn ghi chú" : "Xem ghi chú"}
              </button>
            </div>

            {showFutureMetricGuide ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {futureMetricGuides.map((guide) => (
                  <article key={guide.label} className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
                    <p className="text-xs font-bold text-ink">{guide.label}</p>
                    <p className="mt-2 text-xs leading-5 text-muted">{guide.readAs}</p>
                    <p className="mt-2 border-l border-warning pl-3 text-xs leading-5 text-muted">
                      Tự soi tiếp: {guide.nextCheck}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          {hasMetrics ? (
            <div className="space-y-3">
              {metrics.map((metric) => (
                (() => {
                  const guide = metricReadingGuide(metric.metricCode, metric.industryCode, metric.value);

                  return (
                    <article
                      key={metric.sourceKey}
                      className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="accent">
                              {metric.periodLabel}
                            </Chip>
                            <Chip size="sm" variant="neutral">
                              provenance={metric.provenanceCount}
                            </Chip>
                          </div>
                          <p className="mt-3 text-sm font-bold text-ink">
                            {metricDisplayLabel(metric.metricCode, metric.metricLabelVi)}
                          </p>
                          <p className="mt-1 text-xl font-bold text-ink">
                            {formatMetricValue(metric.value, metric.unit)}
                          </p>
                          <p className="mt-2 break-words text-[11px] leading-5 text-muted">
                            {metric.sourceLabel}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-subtle">
                              Số này nói gì
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted">{guide.meaning}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-subtle">
                              Cần soi tiếp
                            </p>
                            <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
                              {guide.companyChecks.map((check) => (
                                <li key={check} className="border-l border-warning pl-3">
                                  {check}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-subtle">
                              Cần đọc thận trọng
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted">{guide.watchCase}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })()
              ))}
            </div>
          ) : (
            <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-4">
              <p className="text-sm font-bold text-ink">Chưa có metric ngành đủ điều kiện để ghi chú.</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Giá trị thiếu giữ nguyên là N/A. Hệ thống không lấy taxonomy, peer group hay context chữ để thay thế
                số liệu.
              </p>
            </div>
          )}

          <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-xs leading-5 text-muted">
            Ghi chú này chỉ hướng dẫn cách tự đọc số liệu. Hệ thống không tự động biến metric thành kết luận đầu tư,
            không thay thế việc đọc BCTC, rủi ro và bối cảnh doanh nghiệp.
          </p>
        </CardBody>
      </Card>
      </>
      ) : null}
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
  const selectedLayer4Context = useMemo(() => {
    const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry?.industryKey ?? ""] ?? null;
    return (
      runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode)
        .map(layer4SectionContextFromPayload)
        .find((context): context is IndustryLayer4SectionContext => Boolean(context)) ?? null
    );
  }, [runtimeContexts, selectedIndustry?.industryKey]);

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
      <IndustryQuickPicture
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
      />
      <IndustryMoneyMap
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryMacroPressureSection
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
      />
      <IndustryDataConfirmationSection
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryConditionalConclusion
        layer4Context={selectedLayer4Context}
        selectedIndustry={selectedIndustry}
        onNavigate={onNavigate}
      />
      <IndustryCompanyMapSection
        selectedIndustry={selectedIndustry}
        onNavigate={onNavigate}
      />
      <IndustryMetricReadPathPanel
        runtimeContexts={runtimeContexts}
        selectedIndustry={selectedIndustry}
      />
    </div>
  );
}
