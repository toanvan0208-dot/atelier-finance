"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import {
  businessJourneyByTicker,
  defaultBusinessJourneyTicker,
} from "../data/businessJourney.data";
import {
  findBusinessCompanyProfile,
  formatBusinessProfileField,
  normalizeBusinessTicker,
} from "../lib/business-company-selection";
import type { BusinessCompanyProfile, BusinessDeepDiveData, BusinessJourneyData } from "../types";
import { AdvantageRealityCheck } from "./AdvantageRealityCheck";
import { BridgeToFinancialStatements } from "./BridgeToFinancialStatements";
import { BusinessIdentityCard } from "./BusinessIdentityCard";
import { CustomerReasonSection } from "./CustomerReasonSection";
import { DeepDiveDrawer } from "./DeepDiveDrawer";
import { MoneyMachineFlow } from "./MoneyMachineFlow";
import { NonFinancialRiskMap } from "./NonFinancialRiskMap";
import { StrategyLeadershipSection } from "./StrategyLeadershipSection";

type BusinessPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

type RuntimeBusinessProfile = {
  ticker: string;
  companyName: string;
  exchange: string | null;
  industryCode: string | null;
  industryName: string | null;
  businessProfile?: {
    businessDescription: string | null;
    mainProducts: string | null;
    businessRiskNotes: string | null;
    sourceLabel: string;
    dataMode: string;
    productionApproved: boolean;
    needsReview: boolean;
    profileLanguage: string;
  };
};

const navigationChangeEvent = "app:navigation";

const journeySteps = [
  "Hiểu công ty",
  "Hiểu khách hàng",
  "Hiểu cỗ máy kiếm tiền",
  "Kiểm tra lợi thế",
  "Nhìn chiến lược",
  "Nhận diện rủi ro",
  "Sang BCTC kiểm chứng",
];

function readTickerFromLocation() {
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.search).get("ticker");
}

function useTickerFromUrl() {
  const [ticker, setTicker] = useState<string | null>(() => readTickerFromLocation());

  useEffect(() => {
    const updateTicker = () => setTicker(readTickerFromLocation());

    updateTicker();
    window.addEventListener("popstate", updateTicker);
    window.addEventListener(navigationChangeEvent, updateTicker);

    return () => {
      window.removeEventListener("popstate", updateTicker);
      window.removeEventListener(navigationChangeEvent, updateTicker);
    };
  }, []);

  return ticker;
}

function useRuntimeBusinessProfile(selectedTicker: string | null) {
  const [profile, setProfile] = useState<RuntimeBusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!selectedTicker) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setProfile(null);
          setIsLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(() => {
      if (!cancelled) setIsLoading(true);
    });
    fetch(`/api/companies/${encodeURIComponent(selectedTicker)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { data?: RuntimeBusinessProfile };
        return payload.data?.businessProfile ? payload.data : null;
      })
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTicker]);

  return { profile, isLoading };
}

export function resolveBusinessJourneyData(selectedTicker: string | null) {
  if (!selectedTicker) {
    return {
      data: businessJourneyByTicker[defaultBusinessJourneyTicker],
      profile: findBusinessCompanyProfile(defaultBusinessJourneyTicker),
      isUsingSampleData: true,
      hasUnsupportedTicker: false,
    };
  }

  const profile = findBusinessCompanyProfile(selectedTicker);

  return {
    data: profile ? businessJourneyByTicker[selectedTicker] ?? null : null,
    profile,
    isUsingSampleData: false,
    hasUnsupportedTicker: !profile,
  };
}

function hasValidBusinessJourneyData(data: BusinessJourneyData | null) {
  return Boolean(
    data &&
      data.businessIdentity?.ticker &&
      data.businessIdentity.companyName &&
      data.businessIdentity.simpleDescription &&
      data.customers.mainCustomers.length > 0 &&
      data.moneyMachine.inputs.length > 0 &&
      data.competitiveAdvantage.advantages.length > 0 &&
      data.strategyAndLeadership.strategicDirection.length > 0 &&
      data.nonFinancialRisks.risks.length > 0 &&
      data.bridgeToFinancialStatements.financialMetricsToCheck.length > 0
  );
}

function splitReviewedText(value: string | null | undefined, fallback: string[]) {
  if (!value) return fallback;

  const parts = value
    .split(/\s*(?:\||;|\n)\s*/u)
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.slice(0, 5) : fallback;
}

function buildBottleneckLabels(industryLabel: string) {
  const normalizedIndustry = industryLabel.toLowerCase();

  if (normalizedIndustry.includes("steel") || normalizedIndustry.includes("thép")) {
    return ["Giá nguyên liệu", "Tồn kho", "Chu kỳ thép", "Nợ vay", "Công suất"];
  }

  if (normalizedIndustry.includes("dairy") || normalizedIndustry.includes("sữa")) {
    return ["Giá sữa đầu vào", "Kênh phân phối", "Sức mua", "Biên lợi nhuận", "Thương hiệu"];
  }

  if (normalizedIndustry.includes("retail") || normalizedIndustry.includes("bán lẻ")) {
    return ["Tồn kho", "Mặt bằng", "Sức mua", "Cạnh tranh giá", "Hiệu quả chuỗi"];
  }

  return ["Vốn lưu động", "Biên lợi nhuận", "Dòng tiền", "Nợ vay", "Năng lực vận hành"];
}

function buildRuntimeBusinessJourneyData(profile: RuntimeBusinessProfile): BusinessJourneyData | null {
  const businessProfile = profile.businessProfile;
  if (!businessProfile) return null;

  const template = businessJourneyByTicker[defaultBusinessJourneyTicker];
  const industryLabel = profile.industryName ?? profile.industryCode ?? "Ngành đang rà soát";
  const businessDescription = businessProfile.businessDescription || "Chưa đủ dữ liệu mô tả mô hình kinh doanh.";
  const products = splitReviewedText(businessProfile.mainProducts, [
    "Sản phẩm hoặc dịch vụ chính cần rà soát thêm từ nguồn doanh nghiệp",
  ]);
  const riskNotes = splitReviewedText(businessProfile.businessRiskNotes, [
    "Cần đối chiếu thêm với báo cáo tài chính và nguồn doanh nghiệp",
  ]);
  const bottleneckLabels = buildBottleneckLabels(industryLabel);
  const researchTags = [
    industryLabel,
    businessProfile.dataMode === "research_only" ? "Dữ liệu nghiên cứu" : businessProfile.dataMode,
    businessProfile.needsReview ? "Cần rà soát" : "Đã rà soát trạng thái",
  ].filter(Boolean);

  return {
    ...template,
    isLoading: false,
    businessIdentity: {
      ...template.businessIdentity,
      ticker: profile.ticker,
      companyName: profile.companyName,
      businessType: industryLabel,
      simpleDescription: businessDescription,
      modelTags: researchTags,
      cycleType: "Đây là hồ sơ nghiên cứu cần rà soát; chưa phải phân tích đầy đủ.",
      coreMessage: businessDescription,
      example: `${profile.ticker} được đọc từ CompanyBusinessProfile đã lưu trong hệ thống, không dùng dữ liệu mẫu MWG để thay thế.`,
      practicalConclusion:
        "Trước khi đọc sâu, hãy dùng phần này để hiểu doanh nghiệp làm gì, kiếm tiền bằng cách nào và cần kiểm chứng gì ở BCTC.",
      beginnerRemember:
        "Hãy nói lại bằng một câu: doanh nghiệp làm gì, bán cho ai và điểm nào cần kiểm chứng bằng số liệu.",
      deepDive: {
        ...template.businessIdentity.deepDive,
        title: `Bản chất mô hình kinh doanh của ${profile.ticker}`,
        plainLanguage: businessDescription,
        checklist: [
          "Doanh nghiệp kiếm tiền từ hoạt động chính nào?",
          "Mô hình này phụ thuộc vào khách hàng, chu kỳ ngành, chi phí hay năng lực vận hành?",
          "Điểm nào cần kiểm chứng bằng báo cáo tài chính trước khi đọc tiếp?",
        ],
        realWorldSignals: riskNotes,
      },
    },
    customers: {
      ...template.customers,
      mainCustomers: [
        "Nhóm khách hàng/đầu ra chính cần đối chiếu từ nguồn doanh nghiệp",
        "Khách hàng hoặc kênh tiêu thụ được mô tả trong hồ sơ kinh doanh",
        "Cần kiểm chứng thêm bằng báo cáo thường niên và thuyết minh",
      ],
      whatTheyBuy: products,
      whyTheyBuy: [
        "Nhu cầu thực tế đối với sản phẩm/dịch vụ",
        "Độ tin cậy của doanh nghiệp và kênh phân phối",
        "Giá, chất lượng, sự sẵn có và điều kiện ngành",
      ],
      repeatBehavior:
        "Cần đọc thêm dữ liệu doanh thu, khách hàng và chu kỳ mua để kết luận mức độ lặp lại.",
      priceSensitivity:
        "Cần đối chiếu biên lợi nhuận, chi phí và cạnh tranh ngành để hiểu độ nhạy với giá.",
      example: businessDescription,
      practicalConclusion:
        "Doanh thu chỉ có ý nghĩa hơn khi hiểu ai trả tiền, vì sao họ trả và điều đó có bền hay không.",
      beginnerRemember: "Đừng chỉ hỏi công ty bán gì. Hãy hỏi ai trả tiền và vì sao họ chọn công ty này.",
      deepDive: {
        ...template.customers.deepDive,
        title: `Khách hàng và lý do mua của ${profile.ticker}`,
        checklist: [
          "Khách hàng chính là ai?",
          "Sản phẩm/dịch vụ nào tạo doanh thu chính?",
          "Lý do mua đến từ nhu cầu, giá, thương hiệu, kênh phân phối hay yếu tố ngành?",
        ],
        realWorldSignals: products,
      },
    },
    moneyMachine: {
      ...template.moneyMachine,
      inputs: ["Nguồn lực đầu vào chính", "Vốn lưu động", "Tài sản/vận hành cần thiết", "Nhân sự và hệ thống"],
      operations: ["Sản xuất/vận hành", "Quản lý chi phí", "Kiểm soát chất lượng", "Điều phối bán hàng"],
      salesChannels: ["Kênh bán hàng chính", "Đối tác/đại lý nếu có", "Kênh xuất khẩu hoặc nội địa nếu được công bố"],
      cashCollection: ["Thu tiền từ khách hàng/đối tác", "Cần kiểm chứng thêm qua CFO và khoản phải thu"],
      expansionMethod: ["Mở rộng công suất/kênh bán", "Tối ưu vận hành", "Mở rộng thị trường nếu nguồn có nêu"],
      bottlenecks: bottleneckLabels,
      example: businessDescription,
      practicalConclusion:
        "Mô hình tốt lên khi doanh thu chuyển được thành tiền và chi phí vận hành được kiểm soát.",
      beginnerRemember: "Hãy nhìn doanh nghiệp như một dòng chảy: đầu vào, vận hành, bán hàng, thu tiền, mở rộng.",
      deepDive: {
        ...template.moneyMachine.deepDive,
        title: `Cỗ máy kiếm tiền của ${profile.ticker}`,
        checklist: [
          "Khâu nào tạo doanh thu chính?",
          "Khâu nào dễ làm kẹt dòng tiền hoặc tăng chi phí?",
          "Cần kiểm chứng gì bằng CFO, biên lợi nhuận và vốn lưu động?",
        ],
        realWorldSignals: riskNotes,
      },
    },
    competitiveAdvantage: {
      ...template.competitiveAdvantage,
      advantages: [
        {
          advantageName: "Vị thế ngành cần kiểm chứng",
          howItCreatesMoney: "Có thể hỗ trợ quy mô, kênh bán hoặc khả năng tiếp cận khách hàng nếu nguồn dữ liệu xác nhận.",
          whatToQuestion: "Lợi thế này có tạo tiền thật không, hay chỉ là mô tả định tính?",
          durabilityLevel: template.competitiveAdvantage.advantages[0].durabilityLevel,
        },
        {
          advantageName: "Mô hình vận hành",
          howItCreatesMoney: "Nếu vận hành hiệu quả, doanh nghiệp có thể giữ biên lợi nhuận và dòng tiền tốt hơn.",
          whatToQuestion: "Cần kiểm chứng bằng biên lợi nhuận, CFO, hàng tồn kho và nợ vay.",
          durabilityLevel: template.competitiveAdvantage.advantages[1].durabilityLevel,
        },
        {
          advantageName: "Nguồn dữ liệu hiện có",
          howItCreatesMoney: "Giúp người dùng đặt câu hỏi kiểm chứng trước khi chuyển sang BCTC.",
          whatToQuestion: "Dữ liệu vẫn ở trạng thái nghiên cứu và cần rà soát, không phải kết luận đầu tư.",
          durabilityLevel: template.competitiveAdvantage.advantages[2].durabilityLevel,
        },
      ],
      example: businessDescription,
      practicalConclusion:
        "Lợi thế chỉ đáng tin khi nó được kiểm chứng bằng vận hành, dòng tiền và dữ liệu ngành.",
      beginnerRemember: "Mỗi khi thấy một lợi thế, hãy hỏi: nó tạo tiền bằng cách nào và có bằng chứng gì?",
      deepDive: {
        ...template.competitiveAdvantage.deepDive,
        title: `Kiểm tra lợi thế của ${profile.ticker}`,
        checklist: [
          "Lợi thế nằm ở quy mô, thương hiệu, kênh bán, chi phí hay năng lực vận hành?",
          "Lợi thế có thể bị cạnh tranh làm yếu đi không?",
          "BCTC có xác nhận câu chuyện này không?",
        ],
        realWorldSignals: riskNotes,
      },
    },
    strategyAndLeadership: {
      ...template.strategyAndLeadership,
      strategicDirection: ["Đọc chiến lược từ nguồn doanh nghiệp", "Đối chiếu với ngành", "Kiểm chứng bằng vốn đầu tư và dòng tiền"],
      executionCapability: [
        "Cần kiểm tra năng lực thực thi qua kết quả nhiều kỳ.",
        "Cần xem công ty có biến kế hoạch thành doanh thu và dòng tiền không.",
        "Không kết luận chỉ từ mô tả định tính.",
      ],
      capitalAllocationNotes: riskNotes,
      leadershipConcerns: [
        "Chiến lược có thể không phù hợp năng lực lõi.",
        "Mở rộng có thể làm tăng nợ, chi phí hoặc vốn lưu động.",
        "Cần theo dõi cam kết và hành động thực tế của ban lãnh đạo.",
      ],
      shareholderAlignment: "Cần kiểm chứng thêm qua công bố chính thức và chính sách phân bổ vốn.",
      example: businessDescription,
      practicalConclusion:
        "Chiến lược tốt phải phù hợp năng lực lõi và được kiểm chứng bằng số liệu, không chỉ bằng câu chuyện.",
      beginnerRemember: "Đừng chỉ nghe công ty muốn tăng trưởng. Hãy hỏi tăng trưởng bằng cách nào và tiền đi đâu.",
      deepDive: {
        ...template.strategyAndLeadership.deepDive,
        title: `Chiến lược cần kiểm chứng của ${profile.ticker}`,
        checklist: [
          "Chiến lược có gần với năng lực lõi không?",
          "Công ty có đủ tiền và năng lực để thực hiện không?",
          "Rủi ro nếu chiến lược sai là gì?",
        ],
        realWorldSignals: riskNotes,
      },
    },
    nonFinancialRisks: {
      ...template.nonFinancialRisks,
      risks: [
        {
          riskName: "Rủi ro mô hình kinh doanh",
          riskType: "Mô hình",
          whyItMatters: riskNotes[0],
          realWorldSignals: riskNotes,
          severity: template.nonFinancialRisks.risks[0].severity,
          practicalConclusion: "Cần quan sát thêm trước khi kết luận mô hình đủ bền.",
        },
        {
          riskName: "Rủi ro dòng tiền",
          riskType: "Tài chính",
          whyItMatters: "Mô hình kinh doanh cần được kiểm chứng bằng CFO, vốn lưu động và nợ vay.",
          realWorldSignals: ["CFO yếu hơn lợi nhuận", "Tồn kho hoặc phải thu tăng nhanh", "Nợ vay và chi phí tài chính tăng"],
          severity: template.nonFinancialRisks.risks[1].severity,
          practicalConclusion: "Không dùng mô tả kinh doanh để thay thế kiểm chứng BCTC.",
        },
        {
          riskName: "Rủi ro dữ liệu",
          riskType: "Nguồn",
          whyItMatters: "Hồ sơ đang ở trạng thái nghiên cứu, cần rà soát và không production approved.",
          realWorldSignals: [businessProfile.sourceLabel, businessProfile.dataMode, `needsReview=${String(businessProfile.needsReview)}`],
          severity: template.nonFinancialRisks.risks[2].severity,
          practicalConclusion: "Chỉ dùng phần này để đặt câu hỏi đọc tiếp, không dùng làm khuyến nghị.",
        },
      ],
      example: riskNotes.join(" "),
      practicalConclusion:
        "Đừng chờ báo cáo tài chính nói hết; hãy dùng rủi ro định tính để biết cần kiểm chứng chỉ số nào.",
      beginnerRemember: "Rủi ro ngoài số liệu thường là lý do để đọc BCTC kỹ hơn, không phải lý do để kết luận vội.",
      deepDive: {
        ...template.nonFinancialRisks.deepDive,
        title: `Rủi ro cần theo dõi của ${profile.ticker}`,
        checklist: [
          "Rủi ro đến từ khách hàng, ngành, vận hành, tài chính hay dữ liệu?",
          "Rủi ro này sẽ hiện trong chỉ số nào?",
          "Nguồn nào cần đọc thêm?",
        ],
        realWorldSignals: riskNotes,
      },
    },
    bridgeToFinancialStatements: {
      ...template.bridgeToFinancialStatements,
      businessUnderstandingSummary:
        `Tạm hiểu: ${profile.ticker} có hồ sơ kinh doanh đã lưu trong hệ thống, nhưng vẫn là dữ liệu nghiên cứu cần rà soát. Cần sang BCTC để kiểm chứng doanh thu, biên lợi nhuận, dòng tiền, nợ vay và vốn lưu động.`,
      strengthsToVerify: ["Mô hình tạo doanh thu thật", "Vận hành chuyển được thành dòng tiền", "Lợi thế nếu có được phản ánh trong biên lợi nhuận"],
      weaknessesToVerify: riskNotes,
      financialMetricsToCheck: ["Doanh thu", "Biên lợi nhuận gộp", "Dòng tiền kinh doanh", "Nợ vay", "Vốn lưu động"],
      nextModuleSuggestion:
        "Sang Báo cáo tài chính để kiểm chứng các giả thuyết trên bằng số liệu; không dùng phần này để kết luận mua hoặc bán.",
    },
    beginnerSummary: [
      `${profile.ticker} có hồ sơ CompanyBusinessProfile đã lưu trong hệ thống.`,
      "Nội dung này dùng để hiểu mô hình kinh doanh và đặt câu hỏi kiểm chứng.",
      "Dữ liệu vẫn là research_only, needsReview và productionApproved=false.",
      "Cần kiểm chứng tiếp bằng BCTC trước khi đọc sâu.",
      "Không dùng phần này làm khuyến nghị đầu tư, benchmark định giá/rủi ro hoặc kết luận mua bán.",
    ],
  };
}

function SampleDataNotice() {
  return (
    <Card className="border-border-soft bg-accent-soft">
      <CardBody className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold leading-6 text-ink">
          Đang dùng dữ liệu minh họa MWG khi URL chưa có ticker. Nội dung này không được hiểu là hồ sơ doanh nghiệp đã xác minh.
        </p>
        <Chip size="sm" variant="accent">
          Dữ liệu minh họa
        </Chip>
      </CardBody>
    </Card>
  );
}

function CompanyDataStatus({ profile }: { profile: BusinessCompanyProfile }) {
  const statusLabel = profile.dataStatus === "missing" ? "Chưa đủ dữ liệu" : "Dữ liệu đang được rà soát";

  return (
    <Card className="border-border-soft bg-surface">
      <CardBody className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">{profile.ticker}</Chip>
          <Chip variant="neutral">{formatBusinessProfileField(profile.exchange)}</Chip>
          <Chip variant="warning">{statusLabel}</Chip>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Doanh nghiệp</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-ink">{profile.companyName}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Ngành</p>
            <p className="mt-1 text-sm leading-5 text-muted">{formatBusinessProfileField(profile.industry)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Nguồn / trạng thái</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {profile.sourceLabel ?? "Nguồn dữ liệu đang hoàn thiện"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Kỳ / asOf</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {profile.period && profile.asOf ? `${profile.period} · ${profile.asOf}` : "Chưa đủ dữ liệu"}
            </p>
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
          <p className="text-[11px] font-bold uppercase text-subtle">Mô tả hoạt động</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            {formatBusinessProfileField(profile.businessDescription)}
          </p>
        </div>

        <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
          {profile.warnings[0]}
        </p>
        <p className="text-xs leading-5 text-muted">
          Phần này giúp người dùng hiểu doanh nghiệp đang làm gì và dữ liệu nào đã có. Đây không phải khuyến nghị đầu tư.
        </p>
      </CardBody>
    </Card>
  );
}

function JourneyProgress() {
  return (
    <div className="overflow-x-auto rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <div className="flex min-w-max items-center gap-2">
        {journeySteps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <Chip size="sm" variant={index === 0 ? "accent" : "neutral"}>
              {index + 1}. {step}
            </Chip>
            {index < journeySteps.length - 1 ? <span className="text-xs font-bold text-subtle">→</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PageIntro() {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
      <p className="max-w-[82ch] text-sm leading-6 text-muted">
        Module này không phân tích sâu số liệu tài chính. Mục tiêu là hiểu công ty như một cỗ máy kinh doanh ngoài đời: ai trả tiền, vì sao họ mua, mô hình vận hành ra sao, lợi thế có thật không và rủi ro nào cần quan sát trước khi sang Báo cáo tài chính.
      </p>
    </div>
  );
}

export function BusinessPage({ onNavigate }: BusinessPageProps) {
  const tickerFromUrl = useTickerFromUrl();
  const selectedTicker = normalizeBusinessTicker(tickerFromUrl);
  const { profile: runtimeProfile, isLoading: isRuntimeProfileLoading } = useRuntimeBusinessProfile(selectedTicker);
  const { data, profile, hasUnsupportedTicker, isUsingSampleData } = useMemo(
    () => resolveBusinessJourneyData(selectedTicker),
    [selectedTicker]
  );
  const runtimeJourneyData = useMemo(
    () => (runtimeProfile ? buildRuntimeBusinessJourneyData(runtimeProfile) : null),
    [runtimeProfile]
  );
  const activeData = runtimeJourneyData ?? data;
  const activeIsUsingSampleData = runtimeJourneyData ? false : isUsingSampleData;
  const [deepDive, setDeepDive] = useState<BusinessDeepDiveData | null>(null);

  if (isRuntimeProfileLoading && selectedTicker) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-5 lg:px-0">
        <LoadingState
          title="Đang kiểm tra hồ sơ doanh nghiệp"
          description="Hệ thống đang đọc CompanyBusinessProfile cho mã đã chọn."
        />
      </div>
    );
  }

  if (activeData?.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-5 lg:px-0">
        <LoadingState title={activeData.loading.title} description={activeData.loading.description} />
      </div>
    );
  }

  if (!hasValidBusinessJourneyData(activeData) || !activeData) {
    const emptyState = businessJourneyByTicker[defaultBusinessJourneyTicker].emptyState;
    const title = hasUnsupportedTicker
      ? `Chưa có dữ liệu mô hình kinh doanh cho mã ${selectedTicker}.`
      : profile
        ? `Chưa đủ dữ liệu mô tả doanh nghiệp cho ${profile.ticker}.`
        : emptyState.title;
    const description = profile
      ? "Cần bổ sung dữ liệu doanh nghiệp đã rà soát trước khi kết luận. Hệ thống không dùng nội dung mẫu của mã khác để thay thế."
      : "Chưa có hồ sơ doanh nghiệp đã rà soát cho mã này trong hệ thống. Hệ thống không dùng dữ liệu mẫu của mã khác để thay thế.";

    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-3 px-4 py-5 lg:px-0">
        <JourneyProgress />
        {profile ? <CompanyDataStatus profile={profile} /> : null}
        <EmptyState
          title={title}
          description={description}
          icon={emptyState.icon}
          action={
            <Button variant="secondary" onClick={() => onNavigate?.("screening")}>
              Quay lại Lọc cổ phiếu
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-4 px-4 py-5 lg:px-0">
      {activeIsUsingSampleData ? <SampleDataNotice /> : null}
      <JourneyProgress />
      {profile ? <CompanyDataStatus profile={profile} /> : null}
      <PageIntro />

      <main className="min-w-0 space-y-4">
        <BusinessIdentityCard
          data={activeData.businessIdentity}
          isSample={activeIsUsingSampleData}
          onDeepDive={() => setDeepDive(activeData.businessIdentity.deepDive)}
        />
        <CustomerReasonSection
          data={activeData.customers}
          onDeepDive={() => setDeepDive(activeData.customers.deepDive)}
        />
        <MoneyMachineFlow
          data={activeData.moneyMachine}
          onDeepDive={() => setDeepDive(activeData.moneyMachine.deepDive)}
        />
        <AdvantageRealityCheck
          data={activeData.competitiveAdvantage}
          onDeepDive={() => setDeepDive(activeData.competitiveAdvantage.deepDive)}
        />
        <StrategyLeadershipSection
          data={activeData.strategyAndLeadership}
          onDeepDive={() => setDeepDive(activeData.strategyAndLeadership.deepDive)}
        />
        <NonFinancialRiskMap
          data={activeData.nonFinancialRisks}
          onDeepDive={() => setDeepDive(activeData.nonFinancialRisks.deepDive)}
        />
        <BridgeToFinancialStatements
          data={activeData.bridgeToFinancialStatements}
          onNavigate={onNavigate}
        />
      </main>

      <DeepDiveDrawer data={deepDive} onClose={() => setDeepDive(null)} />
    </div>
  );
}
