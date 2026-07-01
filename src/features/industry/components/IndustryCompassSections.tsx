import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, SectionHeader } from "@/components/ui";
import type {
  IndustryCompassAction,
  IndustryCompassOption,
  IndustryCompassTone,
  IndustryDataMode,
  IndustryDataStatus,
  IndustrySignalMetric,
} from "../types";
import type { IndustryContextRuntimePayload } from "../lib/load-industry-context";
import { REVIEWED_INDUSTRY_CODES, REVIEWED_MAPPED_TICKERS } from "../lib/reviewed-industry-coverage";

type IndustryNavigate = (moduleKey: string) => void;

const toneVariant: Record<IndustryCompassTone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  mixed: "warning",
  neutral: "neutral",
  pressure: "danger",
  support: "success",
  watch: "warning",
};

const toneBorder: Record<IndustryCompassTone, string> = {
  mixed: "border-warning bg-warning/10",
  neutral: "border-border-soft bg-surface-soft",
  pressure: "border-danger bg-danger/10",
  support: "border-accent-green bg-accent-green/10",
  watch: "border-warning bg-warning/10",
};

const industryCompanyRoleTitles = [
  "Mã liên quan trong hệ thống",
  "Nhóm cần kiểm tra thêm",
  "Nhóm dữ liệu chưa đủ",
];

const dataStatusLabel: Record<IndustryDataStatus, string> = {
  available: "Đã có dữ liệu",
  missing: "Chưa đủ dữ liệu",
  partial: "Dữ liệu ngành đang hoàn thiện",
  sample: "Dữ liệu minh họa",
  unverified: "Đang xác nhận",
};

const dataModeLabel: Record<IndustryDataMode, string> = {
  manual_reviewed: "Dữ liệu đã rà soát thủ công",
  research_only: "Dữ liệu nghiên cứu",
  sample: "Dữ liệu minh họa",
  unavailable: "Chưa có dữ liệu",
};

const peerRoleLabel: Record<string, string> = {
  direct_peer: "peer truc tiep",
  adjacent_peer: "peer lien quan / can ra soat",
  watch_only: "peer theo doi",
  ambiguous: "peer can xac minh",
};

function parseContextList(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [value];
  } catch {
    return [value];
  }
}

function goToModule(targetModule?: string, onNavigate?: IndustryNavigate) {
  if (!targetModule) {
    return;
  }

  if (onNavigate) {
    onNavigate(targetModule);
    return;
  }

  window.location.href = `/workspace?module=${targetModule}`;
}

function saveIndustryScreeningSource({
  group,
  roleTitle,
  selectedIndustry,
}: {
  selectedIndustry: IndustryCompassOption;
  group: IndustryCompassOption["companyGroups"][number];
  roleTitle?: string;
}) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    "atelier.screeningInputSource",
    JSON.stringify({
      sourceModule: "industry",
      industryName: selectedIndustry.shortName || selectedIndustry.name,
      selectedIndustryGroup: roleTitle ?? group.title,
      inputTickers: group.tickers,
      industryContext: selectedIndustry.sensitivityTags,
      industryRole: group.role,
      riskFactorsToCheck: group.checks,
      suggestedScreeningCriteria: [
        "Thanh khoản đủ theo dõi",
        "Mô hình kinh doanh đủ dễ hiểu",
        "Không có cảnh báo tài chính lớn",
        "Định giá không quá lệch so với ngành",
      ],
    })
  );
}

function IndustryActionButton({
  action,
  onNavigate,
}: {
  action: IndustryCompassAction;
  onNavigate?: IndustryNavigate;
}) {
  return (
    <Button
      size="sm"
      variant={action.variant ?? "secondary"}
      onClick={() => goToModule(action.targetModule, onNavigate)}
    >
      {action.label}
    </Button>
  );
}

export function IndustryTermTooltip({
  children,
  term,
  tips,
}: {
  children: string;
  term: string;
  tips: Record<string, string>;
}) {
  const tip = tips[term];

  if (!tip) {
    return <>{children}</>;
  }

  return (
    <span
      className="cursor-help border-b border-dotted border-border text-ink"
      title={tip}
    >
      {children}
    </span>
  );
}

export function IndustryCurrentHeader({
  industries,
  industryContexts,
  onSelectIndustry,
  selectedIndustry,
}: {
  industries: IndustryCompassOption[];
  industryContexts?: IndustryContextRuntimePayload[];
  selectedIndustry: IndustryCompassOption;
  onSelectIndustry: (industryId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const availableIndustryContexts = (industryContexts ?? []).filter(
    (context) => context.status === "available" && context.context,
  );
  const sourceBackedIndustryContexts = availableIndustryContexts.filter(
    (context) => context.context?.reviewedQualitativeContextAvailable,
  );
  const qualitativeSourceDetails = sourceBackedIndustryContexts.flatMap((context) =>
    context.context?.provenanceSummary.sourceLabels.map((sourceLabel) => ({
      ticker: context.ticker,
      sourceLabel,
      sourceUrls: context.context?.provenanceSummary.sourceUrls ?? [],
    })) ?? [],
  );
  const fullQualitativeSections = sourceBackedIndustryContexts
    .filter((context) => context.context?.fullQualitativeContextAvailable)
    .map((context) => ({
      ticker: context.ticker,
      overview: context.context?.industryOverview ?? null,
      howIndustryMakesMoney: context.context?.howIndustryMakesMoney ?? null,
      keyDrivers: parseContextList(context.context?.keyDrivers),
      keyRisks: parseContextList(context.context?.industryRisks),
      macroSensitivity: parseContextList(context.context?.macroSensitivity),
      nextChecks: parseContextList(context.context?.nextChecks),
      commonMisread: context.context?.commonMisread ?? null,
    }));
  const missingIndustryContexts = (industryContexts ?? []).filter(
    (context) => context.status === "missing",
  );
  const availableTaxonomyMappings = (industryContexts ?? []).flatMap(
    (context) => context.taxonomy.mappings,
  );
  const taxonomyMappingDetails = availableTaxonomyMappings.map(
    (mapping) =>
      `${mapping.ticker} -> ${mapping.displayNameVi || mapping.industryName} (${mapping.dataMode}, needsReview=${String(mapping.needsReview)})`,
  );
  const availablePeerGroupSummaries = (industryContexts ?? [])
    .map((context) => context.peerGroupSummary)
    .filter((summary) => summary.status === "available" && summary.peers.length > 0);

  return (
    <Card className="parent-surface-card">
      <CardBody>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Chip variant="accent">Ngành đang phân tích</Chip>
              <Chip variant={toneVariant[selectedIndustry.statusTone]}>
                {selectedIndustry.statusLabel}
              </Chip>
              <Chip variant="warning">
                {dataStatusLabel[selectedIndustry.dataStatus]}
              </Chip>
            </div>
            <h1 className="text-2xl font-bold leading-tight text-ink md:text-3xl">
              {selectedIndustry.name}
            </h1>
            <p className="mt-3 max-w-[860px] text-sm leading-6 text-muted">
              {selectedIndustry.description}
            </p>
            <p className="mt-3 max-w-[820px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-xs font-semibold leading-5 text-ink">
              Trước khi chọn cổ phiếu, hãy hiểu ngành này kiếm tiền từ đâu và đang chịu lực nào từ vĩ mô.
            </p>
            <div className="mt-3 rounded-[4px] border border-warning bg-warning/10 px-3 py-3 text-xs leading-5 text-muted">
              <p className="font-bold text-ink">{dataModeLabel[selectedIndustry.dataMode]}</p>
              <p className="mt-1">
                {selectedIndustry.warnings[0] ?? "Dữ liệu ngành đang được hoàn thiện."}
              </p>
              <p className="mt-1">
                Nguồn: {selectedIndustry.sourceName ?? "Chưa có nguồn rà soát"} · Kỳ:{" "}
                {selectedIndustry.period ?? "Chưa đủ dữ liệu"} · As of:{" "}
                {selectedIndustry.asOf ?? "Chưa đủ dữ liệu"} · Trạng thái: Nguồn đang hoàn thiện
              </p>
              <p className="mt-1">
                DB IndustryContext:{" "}
                {availableIndustryContexts.length > 0
                  ? `${availableIndustryContexts.length} research_only context row(s), productionApproved=false, needsReview=true. Numeric industry metrics and valuation/risk benchmarks are not available.`
                  : "No eligible DB IndustryContext row for the selected ticker group."}
              </p>
              <p className="mt-1">
                Source-backed qualitative context:{" "}
                {sourceBackedIndustryContexts.length > 0
                  ? `${sourceBackedIndustryContexts.length} reviewed-source package row(s) available. Ngu canh nganh dang o trang thai research_only/can ra soat; khong phai benchmark dinh gia/rui ro; khong phai khuyen nghi dau tu.`
                  : "No source-backed qualitative context row is available; visible compass text remains static educational guidance only, not reviewed DB context."}
              </p>
              {qualitativeSourceDetails.length > 0 ? (
                <p className="mt-1">
                  Qualitative source detail:{" "}
                  {qualitativeSourceDetails
                    .map((detail) => `${detail.ticker}: ${detail.sourceLabel} (${detail.sourceUrls.join(", ")})`)
                    .join("; ")}
                </p>
              ) : null}
              {fullQualitativeSections.length > 0 ? (
                <div className="mt-3 space-y-3 rounded-[4px] border border-border-soft bg-surface px-3 py-3">
                  <p className="text-xs font-bold text-ink">
                    Reviewed qualitative context: research_only, needsReview=true, not investment advice, not valuation/risk benchmark, not peer benchmark.
                  </p>
                  {fullQualitativeSections.map((section) => (
                    <div key={section.ticker} className="grid gap-2 md:grid-cols-2">
                      <p className="md:col-span-2 text-xs font-bold text-ink">{section.ticker}</p>
                      <div>
                        <p className="text-[11px] font-bold text-subtle">Nganh kiem tien nhu the nao</p>
                        <p className="text-xs leading-5 text-muted">{section.howIndustryMakesMoney ?? "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-subtle">Yeu to thuc day chinh</p>
                        <p className="text-xs leading-5 text-muted">{section.keyDrivers.join("; ") || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-subtle">Rui ro chinh</p>
                        <p className="text-xs leading-5 text-muted">{section.keyRisks.join("; ") || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-subtle">Nhay cam vi mo</p>
                        <p className="text-xs leading-5 text-muted">{section.macroSensitivity.join("; ") || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-subtle">Nen kiem tra tiep</p>
                        <p className="text-xs leading-5 text-muted">{section.nextChecks.join("; ") || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-subtle">De hieu sai dieu gi</p>
                        <p className="text-xs leading-5 text-muted">{section.commonMisread ?? "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-1">
                DB taxonomy:{" "}
                {availableTaxonomyMappings.length > 0
                  ? `${availableTaxonomyMappings.length} research_only mapping(s), productionApproved=false, needsReview=true. Peer groups, numeric metrics, and valuation/risk benchmarks are not inferred.`
                  : "No eligible DB taxonomy mapping for the selected ticker group."}
              </p>
              {taxonomyMappingDetails.length > 0 ? (
                <p className="mt-1">
                  DB taxonomy detail: {taxonomyMappingDetails.join(", ")}. Taxonomy is not investment advice or a valuation/risk benchmark.
                </p>
              ) : null}
              <p className="mt-1">
                Reviewed coverage boundary: {REVIEWED_INDUSTRY_CODES.join(", ")} for mapped tickers{" "}
                {REVIEWED_MAPPED_TICKERS.join(", ")}. Unsupported tickers stay missing-safe; no automatic taxonomy or peer inference.
              </p>
              <p className="mt-1">
                DB peer group:{" "}
                {availablePeerGroupSummaries.length > 0
                  ? `${availablePeerGroupSummaries
                      .flatMap((summary) =>
                        summary.peers.map(
                          (peer) => `${peer.ticker} (${peerRoleLabel[peer.peerRole] ?? peer.peerRole})`,
                        ),
                      )
                      .join(", ")}. research_only, needsReview=true. Peer group is not a valuation or risk benchmark.`
                  : "No eligible DB peer group for the selected ticker group; no static fallback is used."}
              </p>
              {missingIndustryContexts.length > 0 ? (
                <p className="mt-1">
                  Missing context tickers: {missingIndustryContexts.map((context) => context.ticker).join(", ")}.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
            <p className="text-[11px] font-semibold text-subtle">Kiểu ngành</p>
            <p className="mt-1 text-sm font-bold leading-5 text-ink">
              {selectedIndustry.industryType}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedIndustry.relatedTickers.map((ticker) => (
                <Chip key={ticker} size="sm" variant="accent">
                  {ticker}
                </Chip>
              ))}
              {selectedIndustry.sensitivityTags.map((tag) => (
                <Chip key={tag} size="sm" variant="neutral">
                  {tag}
                </Chip>
              ))}
            </div>
            <Button className="mt-4 w-full" size="sm" variant="secondary" onClick={() => setIsOpen((value) => !value)}>
              {isOpen ? "Ẩn danh sách ngành" : "Đổi ngành"}
            </Button>
          </div>
        </div>

        {isOpen ? (
          <div className="mt-5 rounded-[4px] border border-border bg-surface-soft px-3 py-3">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {industries.map((industry) => {
                const isSelected = industry.id === selectedIndustry.id;

                return (
                  <button
                    key={industry.id}
                    aria-pressed={isSelected}
                    className={[
                      "rounded-[4px] border px-3 py-3 text-left transition hover:bg-surface-hover",
                      isSelected ? "border-border bg-ink text-white" : "border-border-soft bg-surface text-ink",
                    ].join(" ")}
                    type="button"
                    onClick={() => {
                      onSelectIndustry(industry.id);
                      setIsOpen(false);
                    }}
                  >
                    <span className={isSelected ? "text-sm font-bold text-white" : "text-sm font-bold text-ink"}>
                      {industry.name}
                    </span>
                    <span className={isSelected ? "mt-1 block text-xs leading-5 text-white/75" : "mt-1 block text-xs leading-5 text-muted"}>
                      {industry.industryType}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function IndustryQuickPicture({ selectedIndustry }: { selectedIndustry: IndustryCompassOption }) {
  const { quickPicture } = selectedIndustry;

  return (
    <section>
      <SectionHeader
        eyebrow="Phần 2"
        title="Bức tranh nhanh về ngành"
        description="Trong 10 giây, phần này cho biết ngành đang ở trạng thái nào và dữ liệu đầu tiên cần xem."
      />
      <Card className="parent-surface-card">
        <CardBody className="space-y-5">
          <div className={`rounded-[4px] border-[1.5px] px-4 py-4 ${toneBorder[selectedIndustry.statusTone]}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-[820px]">
                <p className="text-sm font-bold text-ink">Trạng thái sơ bộ: {selectedIndustry.statusLabel}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{quickPicture.summary}</p>
              </div>
              <Chip variant={toneVariant[selectedIndustry.statusTone]}>
                Nhận định có điều kiện
              </Chip>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <p className="text-sm font-bold text-ink">Yếu tố ảnh hưởng cần kiểm tra</p>
              <div className="mt-3 space-y-3">
                {quickPicture.supports.map((item) => (
                  <div key={item.title} className="border-l-2 border-accent-green pl-3">
                    <p className="text-xs font-bold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <p className="text-sm font-bold text-ink">Rủi ro ngành cần kiểm tra</p>
              <div className="mt-3 space-y-3">
                {quickPicture.pressures.map((item) => (
                  <div key={item.title} className="border-l-2 border-danger pl-3">
                    <p className="text-xs font-bold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
              <p className="text-sm font-bold text-ink">Dữ liệu đầu tiên cần xem</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickPicture.firstData.map((item) => (
                  <Chip key={item} variant="accent">
                    {item}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
              <p className="text-sm font-bold text-ink">Bước tiếp theo nên làm</p>
              <p className="mt-2 text-xs leading-5 text-muted">{quickPicture.nextStep}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function IndustryMoneyMap({
  selectedIndustry,
  termTips,
}: {
  selectedIndustry: IndustryCompassOption;
  termTips: Record<string, string>;
}) {
  const money = selectedIndustry.moneyMap;
  const shortAnswers = [
    ["Bán gì?", money.sells],
    ["Khách hàng chính", money.customers],
    ["Doanh thu đến từ đâu?", money.revenueSource],
    ["Ai có quyền định giá?", money.pricingPower],
    ["Chi phí ảnh hưởng mạnh nhất", money.biggestCosts],
    ["Tiền nằm ở khâu nào?", money.cashPoint],
  ];

  return (
    <section>
      <SectionHeader
        eyebrow="Phần 3"
        title="Ngành kiếm tiền như thế nào?"
        description="Hiểu ngành bằng mô hình kiếm tiền trước khi đọc tin vĩ mô hoặc chuyển sang cổ phiếu."
      />
      <Card>
        <CardBody className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shortAnswers.map(([label, value]) => (
              <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
                <p className="text-[11px] font-semibold text-subtle">{label}</p>
                <p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[4px] border border-border bg-surface-soft px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-ink">Chuỗi giá trị đơn giản</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Mỗi khâu cho biết ai kiếm tiền, rủi ro chính và chỉ số cần kiểm tra.
                </p>
              </div>
              <Chip variant="neutral">
                <IndustryTermTooltip term="Dòng tiền" tips={termTips}>Dòng tiền</IndustryTermTooltip>
              </Chip>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-4">
              {money.valueChain.map((stage, index) => (
                <div key={stage.title} className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
                  <p className="font-mono text-[11px] font-bold text-subtle">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{stage.title}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{stage.role}</p>
                  <p className="mt-2 text-[11px] font-semibold leading-4 text-ink">Ai kiếm tiền: {stage.whoEarns}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted">Rủi ro: {stage.risk}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted">Kiểm tra: {stage.metric}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[4px] border border-border-soft bg-accent-green/10 px-4 py-3">
              <p className="text-sm font-bold text-ink">Khi ngành tốt, ai hưởng lợi trước?</p>
              <p className="mt-1 text-xs leading-5 text-muted">{money.winnersWhenGood}</p>
            </div>
            <div className="rounded-[4px] border border-border-soft bg-danger/10 px-4 py-3">
              <p className="text-sm font-bold text-ink">Khi ngành xấu, ai chịu áp lực trước?</p>
              <p className="mt-1 text-xs leading-5 text-muted">{money.pressureWhenBad}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function IndustryMacroPressureSection({ selectedIndustry }: { selectedIndustry: IndustryCompassOption }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Phần 4"
        title="Vĩ mô đang kéo hay đè ngành?"
        description="Chỉ lấy những yếu tố vĩ mô liên quan trực tiếp đến ngành đang chọn."
      />
      <Card>
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-3">
            {selectedIndustry.macroDrivers.map((driver) => (
              <article key={driver.factor} className={`rounded-[4px] border px-4 py-4 ${toneBorder[driver.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{driver.factor}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{driver.mechanism}</p>
                  </div>
                  <Chip size="sm" variant={toneVariant[driver.tone]}>
                    {driver.direction}
                  </Chip>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-subtle">Mức ảnh hưởng: {driver.strength}</p>
                <div className="mt-3 space-y-2">
                  {driver.chain.map((step, index) => (
                    <div key={`${driver.factor}-${step}`} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-border-soft bg-surface text-[10px] font-bold text-subtle">
                        {index + 1}
                      </span>
                      <p className="text-xs leading-5 text-muted">{step}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 rounded-[4px] bg-surface px-3 py-2 text-[11px] font-semibold leading-4 text-ink">
                  Cần kiểm tra tiếp: {driver.checkNext}
                </p>
              </article>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

function SignalMetricList({ metrics }: { metrics: IndustrySignalMetric[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {metrics.map((metric) => (
        <article key={metric.name} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-ink">{metric.name}</p>
            <Chip size="sm" variant="neutral">{metric.sampleStatus}</Chip>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">{metric.simpleRead}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="rounded-[4px] bg-surface px-3 py-2 text-[11px] leading-4 text-muted">
              <span className="font-bold text-ink">Khi cải thiện:</span> {metric.goodSignal}
            </p>
            <p className="rounded-[4px] bg-surface px-3 py-2 text-[11px] leading-4 text-muted">
              <span className="font-bold text-ink">Khi yếu đi:</span> {metric.badSignal}
            </p>
          </div>
          <p className="mt-3 text-[11px] font-semibold text-subtle">
            Theo dõi: {metric.frequency} · Liên quan: {metric.relatedStep}
          </p>
        </article>
      ))}
    </div>
  );
}

export function IndustryDataConfirmationSection({
  selectedIndustry,
  termTips,
}: {
  selectedIndustry: IndustryCompassOption;
  termTips: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<"leading" | "confirming" | "warning">("leading");
  const tabConfig = [
    { id: "leading" as const, label: "Dẫn dắt", description: "Dữ liệu thường xuất hiện sớm." },
    { id: "confirming" as const, label: "Xác nhận", description: "Dữ liệu cho thấy ngành thật sự tốt/xấu hơn." },
    { id: "warning" as const, label: "Cảnh báo", description: "Dữ liệu cho thấy rủi ro cần hạ mức tin cậy." },
  ];
  const activeMetrics = selectedIndustry.dataSignals[activeTab];

  return (
    <section>
      <SectionHeader
        eyebrow="Phần 5"
        title="Dữ liệu nào xác nhận trạng thái ngành?"
        description="Không kết luận ngành chỉ bằng cảm tính hoặc một tin tức đơn lẻ."
      />
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabConfig.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeTab === tab.id ? "primary" : "secondary"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
            <p className="text-sm font-bold text-ink">
              {tabConfig.find((tab) => tab.id === activeTab)?.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {tabConfig.find((tab) => tab.id === activeTab)?.description}
            </p>
            <p className="mt-2 text-[11px] leading-4 text-subtle">
              Một số thuật ngữ có giải thích nhanh:{" "}
              <IndustryTermTooltip term="PMI" tips={termTips}>PMI</IndustryTermTooltip>,{" "}
              <IndustryTermTooltip term="Biên lợi nhuận gộp" tips={termTips}>biên lợi nhuận gộp</IndustryTermTooltip>,{" "}
              <IndustryTermTooltip term="Tồn kho" tips={termTips}>tồn kho</IndustryTermTooltip>.
            </p>
          </div>
          <SignalMetricList metrics={activeMetrics} />
        </CardBody>
      </Card>
    </section>
  );
}

export function IndustryCompanyMapSection({
  onNavigate,
  selectedIndustry,
}: {
  selectedIndustry: IndustryCompassOption;
  onNavigate?: IndustryNavigate;
}) {
  return (
    <section>
      <SectionHeader
        title="Rổ cổ phiếu đầu vào từ ngành"
        description="Module Ngành chỉ lập bản đồ mã liên quan theo vai trò trong ngành. Việc kiểm tra dữ liệu tiếp theo diễn ra ở module Screening."
      />
      <Card>
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-3">
            {selectedIndustry.companyGroups.map((group, index) => (
              <article key={`${group.role}-${group.tickers.join("-")}`} className={`rounded-[4px] border px-4 py-4 ${toneBorder[group.tone]}`}>
                <p className="text-sm font-bold text-ink">
                  {industryCompanyRoleTitles[index] ?? group.role}
                </p>
                <p className="mt-2 text-xl font-bold leading-none text-ink">
                  {group.tickers.join(", ")}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted">{group.description}</p>
                <p className="mt-3 text-[11px] font-semibold leading-4 text-ink">
                  Vai trò trong chuỗi giá trị: {group.role}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Vì sao cần kiểm tra tiếp: {group.why}
                </p>
                <p className="mt-3 text-[11px] font-bold uppercase text-subtle">
                  Dữ liệu nên kiểm tra tiếp
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.checks.map((check) => (
                    <Chip key={check} size="sm" variant="neutral">
                      {check}
                    </Chip>
                  ))}
                </div>
                <div className="mt-4 grid gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      saveIndustryScreeningSource({
                        group,
                        roleTitle: industryCompanyRoleTitles[index] ?? group.role,
                        selectedIndustry,
                      });
                      goToModule("screening", onNavigate);
                    }}
                  >
                    Kiểm tra ở Screening
                  </Button>
                  <button
                    className="text-left text-xs font-bold text-muted underline-offset-2 hover:text-ink hover:underline"
                    type="button"
                    onClick={() => goToModule("watchlist", onNavigate)}
                  >
                    Lưu nhóm này để kiểm tra sau
                  </button>
                </div>
              </article>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function IndustryConditionalConclusion({
  onNavigate,
  selectedIndustry,
}: {
  selectedIndustry: IndustryCompassOption;
  onNavigate?: IndustryNavigate;
}) {
  return (
    <section>
      <SectionHeader
        eyebrow="Phần 7"
        title="Kết luận ngành có điều kiện"
        description="Kết luận cuối module luôn đi kèm dữ liệu xác nhận, dữ liệu còn thiếu và điều kiện làm nhận định thay đổi."
      />
      <Card className="parent-surface-card">
        <CardHeader
          title={selectedIndustry.name}
          description="Đây là kết luận bối cảnh có điều kiện, dùng để biết dữ liệu nào còn thiếu trước khi đọc module sau."
          chip={<Chip variant={toneVariant[selectedIndustry.statusTone]}>{selectedIndustry.statusLabel}</Chip>}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-5">
            {selectedIndustry.conclusion.blocks.map((block) => (
              <div key={block.title} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                <p className="text-xs font-bold text-ink">{block.title}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{block.content}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3">
            <p className="text-sm font-bold text-ink">Cảnh báo trước khi đi tiếp</p>
            <p className="mt-1 text-xs leading-5 text-muted">{selectedIndustry.conclusion.warning}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIndustry.conclusion.actions.map((action) => (
              <IndustryActionButton key={action.label} action={action} onNavigate={onNavigate} />
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
