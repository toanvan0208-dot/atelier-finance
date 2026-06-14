import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, SectionHeader } from "@/components/ui";
import type {
  ScreeningCandidate,
  ScreeningCandidateGroupKey,
  ScreeningGateData,
  ScreeningGuideAction,
  ScreeningGuideData,
  ScreeningGuideTone,
  ScreeningMode,
} from "../types";

type ScreeningNavigate = (moduleKey: string) => void;

const toneVariant: Record<ScreeningGuideTone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  neutral: "neutral",
  pass: "success",
  risk: "danger",
  watch: "warning",
};

const groupTone: Record<ScreeningCandidateGroupKey, ScreeningGuideTone> = {
  "not-fit": "neutral",
  priority: "pass",
  watch: "watch",
};

const gateStatusTone: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  "Chưa đủ dữ liệu": "neutral",
  "Cần kiểm tra thêm": "warning",
  "Không đạt bộ lọc": "danger",
  "Đã qua": "success",
};

function goToModule(targetModule?: string, onNavigate?: ScreeningNavigate) {
  if (!targetModule) return;

  if (onNavigate) {
    onNavigate(targetModule);
    return;
  }

  window.location.href = `/workspace?module=${targetModule}`;
}

function ScreeningActionButton({
  action,
  onNavigate,
}: {
  action: ScreeningGuideAction;
  onNavigate?: ScreeningNavigate;
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

export function ScreeningTermTooltip({
  children,
  term,
  tips,
}: {
  children: string;
  term: string;
  tips: Record<string, string>;
}) {
  const tip = tips[term];

  if (!tip) return <>{children}</>;

  return (
    <span className="cursor-help border-b border-dotted border-border text-ink" title={tip}>
      {children}
    </span>
  );
}

export function ScreeningCurrentQuery({
  data,
  mode,
  onModeChange,
}: {
  data: ScreeningGuideData["currentQuery"];
  mode: ScreeningMode;
  onModeChange: (mode: ScreeningMode) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="parent-surface-card">
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[820px]">
            <div className="mb-3 flex flex-wrap gap-2">
              <Chip variant="accent">Tôi đang lọc gì?</Chip>
              <Chip variant="neutral">Không phải kết luận hành động</Chip>
            </div>
            <h1 className="text-2xl font-bold leading-tight text-ink md:text-3xl">
              Phễu chọn ứng viên để phân tích tiếp
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink">{data.sentence}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? "Ẩn chỉnh câu lọc" : "Sửa câu lọc"}
          </Button>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {data.criteria.map((item) => (
            <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-[11px] font-semibold text-subtle">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-ink">{item.value}</p>
            </div>
          ))}
        </div>

        {isOpen ? (
          <div className="rounded-[4px] border border-border bg-surface-soft px-4 py-4">
            <p className="text-sm font-bold text-ink">Chế độ lọc</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {data.modes.map((option) => {
                const active = mode === option.id;
                return (
                  <button
                    key={option.id}
                    aria-pressed={active}
                    className={[
                      "rounded-[4px] border px-4 py-4 text-left transition hover:bg-surface-hover",
                      active ? "border-border bg-ink text-white" : "border-border-soft bg-surface text-ink",
                    ].join(" ")}
                    type="button"
                    onClick={() => onModeChange(option.id)}
                  >
                    <span className={active ? "text-sm font-bold text-white" : "text-sm font-bold text-ink"}>
                      {option.title}
                    </span>
                    <span className={active ? "mt-2 block text-xs leading-5 text-white/75" : "mt-2 block text-xs leading-5 text-muted"}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            {mode === "ticker" ? (
              <p className="mt-3 rounded-[4px] border border-warning bg-warning/10 px-3 py-2 text-xs font-semibold leading-5 text-ink">
                  Đây chỉ là kiểm tra nhanh qua 5 cửa lọc, không phải kết luận hành động.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function ScreeningMethodSection({
  data,
}: {
  data: ScreeningGuideData["method"];
}) {
  return (
    <section>
      <SectionHeader
        eyebrow="Phần 2"
        title="Phương pháp lọc cổ phiếu"
        description="Hệ thống lọc theo nhiều cửa để tránh chọn mã chỉ vì một chỉ số hoặc một câu chuyện hấp dẫn."
      />
      <Card>
        <CardBody className="space-y-4">
          <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3">
            <p className="text-sm font-bold text-ink">{data.warning}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{data.summary}</p>
          </div>
          <div className="grid gap-3">
            {data.gates.map((gate, index) => (
              <details
                key={gate.id}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3"
                open={index === 0}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-ink">
                        Cửa {index + 1}. {gate.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">{gate.question}</p>
                    </div>
                    <Chip size="sm" variant={gateStatusTone[gate.status]}>
                      {gate.status}
                    </Chip>
                  </div>
                </summary>
                <div className="mt-3 grid gap-3 border-t border-border-soft pt-3 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-bold text-ink">Vì sao quan trọng?</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{gate.whyItMatters}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink">Dữ liệu dùng</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {gate.dataUsed.map((item) => (
                        <Chip key={item} size="sm" variant="neutral">
                          {item}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink">Lỗi người mới hay mắc</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{gate.beginnerMistake}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function ScreeningFunnelSteps({ gates }: { gates: ScreeningGateData[] }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Phần 3"
        title="Phễu 5 cửa lọc cổ phiếu"
        description="Cổ phiếu đi qua từng cửa lọc trước khi được xếp nhóm kết quả."
      />
      <Card>
        <CardBody>
          <div className="space-y-4">
            {gates.map((gate, index) => (
              <article key={gate.id} className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4 lg:grid-cols-[170px_minmax(0,1fr)_220px] lg:items-center">
                <div>
                  <p className="font-mono text-[11px] font-bold text-subtle">Cửa {index + 1}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{gate.title}</p>
                  <Chip className="mt-2" size="sm" variant={gateStatusTone[gate.status]}>
                    {gate.status}
                  </Chip>
                </div>
                <div>
                  <p className="text-xs font-bold leading-5 text-ink">{gate.question}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{gate.filteredReason}</p>
                  <p className="mt-2 text-[11px] font-semibold leading-4 text-subtle">Ví dụ: {gate.example}</p>
                </div>
                <div className="rounded-[4px] border border-border bg-surface px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-ink">{gate.beforeCount}</span>
                    <span className="text-xs font-bold text-subtle">→</span>
                    <span className="text-lg font-bold text-ink">{gate.afterCount}</span>
                  </div>
                  <p className="mt-1 text-center text-[11px] font-semibold text-subtle">mã trước / sau lọc</p>
                  <Button className="mt-3 w-full" size="sm" variant="ghost">
                    Xem cách lọc
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

function CandidateCard({
  candidate,
  isSelected,
  onExplain,
  onToggleCompare,
}: {
  candidate: ScreeningCandidate;
  isSelected: boolean;
  onExplain: (candidate: ScreeningCandidate) => void;
  onToggleCompare: (ticker: string) => void;
}) {
  return (
    <article className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-ink">{candidate.ticker}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted">{candidate.companyName}</p>
        </div>
        <Chip size="sm" variant={toneVariant[groupTone[candidate.group]]}>
          {candidate.groupLabel}
        </Chip>
      </div>
      <p className="mt-3 text-xs font-bold text-ink">{candidate.industry}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{candidate.reason}</p>
      <div className="mt-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
        <p className="text-[11px] font-bold text-ink">Cờ cần kiểm tra</p>
        <p className="mt-1 text-[11px] leading-4 text-muted">{candidate.redFlags.join(", ")}</p>
      </div>
      <p className="mt-3 text-[11px] font-semibold leading-4 text-subtle">Bước tiếp theo: {candidate.nextStep}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onExplain(candidate)}>
          Xem vì sao được xếp nhóm
        </Button>
        <Button size="sm" variant={isSelected ? "primary" : "ghost"} onClick={() => onToggleCompare(candidate.ticker)}>
          {isSelected ? "Đã chọn so sánh" : "So sánh mã này"}
        </Button>
      </div>
    </article>
  );
}

export function ScreeningResultSection({
  candidates,
  groups,
  onExplain,
  onToggleCompare,
  selectedCompare,
}: {
  candidates: ScreeningCandidate[];
  groups: ScreeningGuideData["resultGroups"];
  selectedCompare: string[];
  onExplain: (candidate: ScreeningCandidate) => void;
  onToggleCompare: (ticker: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        eyebrow="Phần 4"
        title="Kết quả sau lọc"
        description="Kết quả chỉ là nhóm ứng viên để phân tích tiếp, không phải kết luận hành động."
      />
      <div className="space-y-5">
        {groups.map((group) => {
          const groupCandidates = candidates.filter((candidate) => candidate.group === group.key);
          return (
            <Card key={group.key}>
              <CardHeader
                title={group.title}
                description={group.description}
                chip={<Chip variant={toneVariant[group.tone]}>{groupCandidates.length} mã</Chip>}
              />
              <CardBody>
                <div className="grid gap-3 lg:grid-cols-2">
                  {groupCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.ticker}
                      candidate={candidate}
                      isSelected={selectedCompare.includes(candidate.ticker)}
                      onExplain={onExplain}
                      onToggleCompare={onToggleCompare}
                    />
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function ScreeningReasonDrawer({
  candidate,
  gates,
  onClose,
  onNavigate,
  termTips,
}: {
  candidate: ScreeningCandidate | null;
  gates: ScreeningGateData[];
  termTips: Record<string, string>;
  onClose: () => void;
  onNavigate?: ScreeningNavigate;
}) {
  if (!candidate) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-[860px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4 sm:px-5">
          <div>
            <Chip variant={toneVariant[groupTone[candidate.group]]}>{candidate.groupLabel}</Chip>
            <h3 className="mt-2 text-lg font-bold text-ink">
              Vì sao {candidate.ticker} được xếp nhóm?
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted">{candidate.reason}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
        <div className="max-h-[calc(92dvh-116px)] overflow-y-auto px-4 py-4 sm:px-5">
          <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3">
            <p className="text-sm font-bold text-ink">
              Được xếp vào nhóm đáng phân tích tiếp không phải là kết luận hành động hay giao dịch.
            </p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            {candidate.gateResults.map((result) => {
              const gate = gates.find((item) => item.id === result.gateId);
              return (
                <div key={result.gateId} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                  <p className="text-[11px] font-semibold text-subtle">{gate?.title ?? result.gateId}</p>
                  <Chip className="mt-2" size="sm" variant={gateStatusTone[result.status]}>
                    {result.status}
                  </Chip>
                  <p className="mt-2 text-[11px] leading-4 text-muted">{result.reason}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Object.entries(candidate.metrics).map(([key, value]) => {
              const labelByKey: Record<string, string> = {
                cfo: "CFO",
                de: "D/E",
                inventory: "Tồn kho",
                liquidity: "Thanh khoản",
                margin: "Biên lợi nhuận",
                pb: "P/B",
                pe: "P/E",
                revenueGrowth: "Tăng trưởng doanh thu",
                roe: "ROE",
              };
              const label = labelByKey[key] ?? key;
              return (
                <div key={key} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                  <p className="text-[11px] font-semibold text-subtle">
                    <ScreeningTermTooltip term={label} tips={termTips}>{label}</ScreeningTermTooltip>
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink">{value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => goToModule("financials", onNavigate)}>
              Mở Báo cáo tài chính
            </Button>
            <Button size="sm" variant="secondary" onClick={() => goToModule("valuation", onNavigate)}>
              Xem Định giá
            </Button>
            <Button size="sm" variant="secondary" onClick={() => goToModule("watchlist", onNavigate)}>
              Thêm vào danh sách theo dõi
            </Button>
            <Button size="sm" variant="ghost" onClick={() => goToModule("screening", onNavigate)}>
              So sánh cùng ngành
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreeningComparisonPanel({
  candidates,
  selectedCompare,
  termTips,
}: {
  candidates: ScreeningCandidate[];
  selectedCompare: string[];
  termTips: Record<string, string>;
}) {
  const selectedCandidates = candidates.filter((candidate) => selectedCompare.includes(candidate.ticker));

  return (
    <section>
      <SectionHeader
        eyebrow="Phần 6"
        title="So sánh nhanh các ứng viên"
        description="Chỉ hiện bảng khi bạn chọn 2 đến 3 mã. Mục tiêu là chọn mã để phân tích sâu hơn, không phải kết luận hành động."
      />
      <Card>
        <CardBody>
          {selectedCandidates.length < 2 ? (
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <p className="text-sm font-bold text-ink">Chọn thêm mã để so sánh</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Bấm “So sánh mã này” trên 2 đến 3 card ứng viên để mở bảng so sánh.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border-soft text-subtle">
                    {["Mã", "Ngành", "Dễ hiểu?", "Tài chính sơ bộ", "Dòng tiền", "Nợ vay", "Định giá", "Thanh khoản", "Cờ đỏ", "Bước tiếp theo"].map((header) => (
                      <th key={header} className="px-3 py-2 font-bold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedCandidates.map((candidate) => (
                    <tr key={candidate.ticker} className="border-b border-border-soft">
                      <td className="px-3 py-3 font-bold text-ink">{candidate.ticker}</td>
                      <td className="px-3 py-3 text-muted">{candidate.industry}</td>
                      <td className="px-3 py-3 text-muted">{candidate.beginnerFit}</td>
                      <td className="px-3 py-3 text-muted">{candidate.metrics.margin}</td>
                      <td className="px-3 py-3 text-muted">
                        <ScreeningTermTooltip term="CFO" tips={termTips}>{candidate.metrics.cfo}</ScreeningTermTooltip>
                      </td>
                      <td className="px-3 py-3 text-muted">{candidate.metrics.de}</td>
                      <td className="px-3 py-3 text-muted">{candidate.metrics.pe}</td>
                      <td className="px-3 py-3 text-muted">{candidate.metrics.liquidity}</td>
                      <td className="px-3 py-3 text-muted">{candidate.redFlags[0]}</td>
                      <td className="px-3 py-3 text-muted">{candidate.nextStep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </section>
  );
}

export function ScreeningConclusionPanel({
  data,
  onNavigate,
}: {
  data: ScreeningGuideData["conclusion"];
  onNavigate?: ScreeningNavigate;
}) {
  return (
    <section>
      <SectionHeader
        eyebrow="Phần 7"
        title="Kết luận sau vòng lọc"
        description="Kết luận chỉ giúp biết nên mở hồ sơ phân tích mã nào trước."
      />
      <Card className="parent-surface-card">
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-5">
            {data.blocks.map((block) => (
              <div key={block.title} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                <p className="text-xs font-bold text-ink">{block.title}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{block.content}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3">
            <p className="text-sm font-bold text-ink">Cảnh báo cuối vòng lọc</p>
            <p className="mt-1 text-xs leading-5 text-muted">{data.warning}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.actions.map((action) => (
              <ScreeningActionButton key={action.label} action={action} onNavigate={onNavigate} />
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function useComparisonSelection() {
  const [selectedCompare, setSelectedCompare] = useState<string[]>(["MWG", "PNJ"]);

  const onToggleCompare = (ticker: string) => {
    setSelectedCompare((current) => {
      if (current.includes(ticker)) {
        return current.filter((item) => item !== ticker);
      }

      return [...current, ticker].slice(-3);
    });
  };

  const selectedCompareText = useMemo(() => selectedCompare.join(", "), [selectedCompare]);

  return { onToggleCompare, selectedCompare, selectedCompareText };
}
