"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  candidatesByTicker,
  screeningRedesignData,
  type RedesignedGateStatus,
  type RedesignedScreeningCandidate,
  type RedesignedScreeningGate,
  type ScreeningMetricKey,
} from "../data/screeningRedesign.data";
import type { ScreeningRuntimeData } from "../lib/load-screening-runtime-data";
import type { ScreeningCandidateGroupKey, ScreeningGuideTone } from "../types";

type ScreeningPageProps = {
  onNavigate?: (moduleKey: string) => void;
  initialData?: ScreeningRuntimeData;
};

type ScreeningInputSource = typeof screeningRedesignData.defaultInputSource;

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

const gateTone: Record<RedesignedGateStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  "Có thể tính": "success",
  "Cần bổ sung dữ liệu": "warning",
  "Chưa thể tính": "neutral",
};

function updateModuleUrl(moduleKey: string, ticker?: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("module", moduleKey);

  if (ticker && moduleKey === "business") {
    url.searchParams.set("ticker", ticker);
  } else {
    url.searchParams.delete("ticker");
  }

  window.history.replaceState(null, "", url);
}

function goToModule(moduleKey: string, onNavigate?: (moduleKey: string) => void, ticker?: string) {
  if (onNavigate) {
    onNavigate(moduleKey);
    updateModuleUrl(moduleKey, ticker);
    return;
  }

  const query = new URLSearchParams({ module: moduleKey });
  if (ticker && moduleKey === "business") query.set("ticker", ticker);

  window.location.href = `/workspace?${query.toString()}`;
}

function readScreeningInputSource(): ScreeningInputSource {
  if (typeof window === "undefined") {
    return screeningRedesignData.defaultInputSource;
  }

  try {
    const stored = window.sessionStorage.getItem("atelier.screeningInputSource");

    if (!stored) {
      return screeningRedesignData.defaultInputSource;
    }

    const parsed = JSON.parse(stored) as Partial<ScreeningInputSource>;

    return {
      ...screeningRedesignData.defaultInputSource,
      ...parsed,
      inputTickers: parsed.inputTickers?.length
        ? parsed.inputTickers
        : screeningRedesignData.defaultInputSource.inputTickers,
      industryContext: parsed.industryContext?.length
        ? parsed.industryContext
        : screeningRedesignData.defaultInputSource.industryContext,
      riskFactorsToCheck: parsed.riskFactorsToCheck?.length
        ? parsed.riskFactorsToCheck
        : screeningRedesignData.defaultInputSource.riskFactorsToCheck,
      suggestedScreeningCriteria: parsed.suggestedScreeningCriteria?.length
        ? parsed.suggestedScreeningCriteria
        : screeningRedesignData.defaultInputSource.suggestedScreeningCriteria,
    };
  } catch {
    return screeningRedesignData.defaultInputSource;
  }
}

function ScreeningHeader({ onGuideOpen }: { onGuideOpen: () => void }) {
  const { header } = screeningRedesignData;

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="font-brand text-3xl font-bold leading-tight text-ink md:text-4xl">
          {header.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{header.description}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={onGuideOpen}>
        Hướng dẫn đọc kết quả
      </Button>
    </header>
  );
}

function ScreeningGuideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { guide } = screeningRedesignData;

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-5 py-4">
          <div>
            <Chip variant="accent">Hướng dẫn ngắn</Chip>
            <h2 className="mt-2 text-lg font-bold text-ink">{guide.title}</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
        <div className="space-y-3 px-5 py-5">
          {guide.points.map((point) => (
            <p
              key={point}
              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-sm leading-6 text-muted"
            >
              {point}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function TickerQuickCheck({
  onAnalyze,
  candidatesByTicker,
}: {
  onAnalyze: (candidate: RedesignedScreeningCandidate) => void;
  candidatesByTicker: Record<string, RedesignedScreeningCandidate>;
}) {
  const [tickerInput, setTickerInput] = useState("");
  const [error, setError] = useState("");
  const [checkedTicker, setCheckedTicker] = useState<string | null>(null);
  const candidate = checkedTicker ? candidatesByTicker[checkedTicker] : null;
  const { quickCheck } = screeningRedesignData;

  function submitTicker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTicker = tickerInput.trim().toUpperCase();
    setTickerInput(normalizedTicker);

    if (!normalizedTicker) {
      setCheckedTicker(null);
      setError(quickCheck.emptyError);
      return;
    }

    if (!candidatesByTicker[normalizedTicker]) {
      setCheckedTicker(null);
      setError(quickCheck.missingError);
      return;
    }

    setError("");
    setCheckedTicker(normalizedTicker);
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardBody className="space-y-4">
        <form className="grid min-w-0 gap-3 lg:grid-cols-[260px_minmax(0,1fr)_auto]" onSubmit={submitTicker}>
          <p className="self-center text-sm font-bold text-ink">{quickCheck.title}</p>
          <input
            className="h-10 min-w-0 rounded-[4px] border-[1.5px] border-border bg-surface px-3 font-mono text-sm font-bold uppercase text-ink outline-none transition placeholder:font-sans placeholder:font-medium focus:bg-accent-soft"
            maxLength={10}
            placeholder={quickCheck.placeholder}
            value={tickerInput}
            onChange={(event) => {
              setTickerInput(event.target.value.toUpperCase());
              setError("");
            }}
          />
          <Button className="h-10" size="md" type="submit">
            {quickCheck.buttonLabel}
          </Button>
        </form>

        {error ? (
          <p className="rounded-[4px] border border-danger bg-danger/10 px-3 py-2 text-xs font-semibold leading-5 text-danger">
            {error}
          </p>
        ) : null}

        {candidate ? (
          <section className="rounded-[4px] border-[1.5px] border-border bg-surface-soft">
            <div className="flex flex-col gap-3 border-b border-border-soft px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-subtle">Kiểm tra nhanh mức đủ dữ liệu</p>
                <h2 className="mt-1 text-xl font-bold text-ink">
                  {candidate.ticker} · {candidate.companyName}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Card này chỉ kiểm tra dữ liệu tối thiểu hiện có, không xếp hạng đầu tư.
                </p>
              </div>
              <Chip variant={toneVariant[groupTone[candidate.group]]}>{candidate.fitLabel}</Chip>
            </div>
            <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBlock label="Mã cổ phiếu" value={candidate.ticker} />
                  <InfoBlock label="Ngành" value={candidate.industry ?? "Chưa đủ dữ liệu"} />
                </div>
                <InfoBlock label="Trạng thái dữ liệu" value={candidate.readinessLabel} />
                <InfoBlock label="Lý do ngắn" value={candidate.reason} />
                <InfoBlock label="Bước tiếp theo" value={candidate.nextStep} />
                <Button size="sm" onClick={() => onAnalyze(candidate)}>
                  Phân tích tiếp
                </Button>
              </div>
              <div className="grid gap-2">
                <GateList label="Dữ liệu đã có" items={candidate.availableFields} tone="success" />
                <GateList label="Dữ liệu còn thiếu" items={candidate.missingFields} tone="warning" />
                <GateList label="Cần kiểm tra tiếp" items={candidate.whatToCheckNext} tone="neutral" fallback="Chưa có dữ liệu" />
              </div>
            </div>
          </section>
        ) : null}
      </CardBody>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p>
    </div>
  );
}

function GateList({
  fallback,
  items,
  label,
  tone,
}: {
  label: string;
  items: string[];
  tone: "neutral" | "success" | "warning";
  fallback?: string;
}) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Chip key={item} size="sm" variant={tone}>
              {item}
            </Chip>
          ))
        ) : (
          <span className="text-xs text-muted">{fallback ?? "Chưa có dữ liệu"}</span>
        )}
      </div>
    </div>
  );
}

function ScreeningInputSourceBanner({
  inputSource,
  onNavigate,
}: {
  inputSource: ScreeningInputSource;
  onNavigate?: (moduleKey: string) => void;
}) {
  const fromIndustry = inputSource.sourceModule === "industry";

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Chip variant={fromIndustry ? "accent" : "neutral"}>
              {fromIndustry ? "Nguồn từ module Ngành" : "Nguồn đầu vào"}
            </Chip>
            <h2 className="mt-2 text-lg font-bold text-ink">
              {fromIndustry
                ? `Đang lọc tiếp: ${inputSource.industryName}`
                : `Nguồn đầu vào: ${inputSource.label}`}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
              {fromIndustry
                ? "Module Ngành chỉ chuyển rổ mã theo vai trò. Module Screening kiểm tra mức đủ dữ liệu để đi tiếp."
                : "Bạn có thể kiểm tra mức đủ dữ liệu của ba mã FPT, MWG và VNM trong phạm vi MVP."}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => goToModule("industry", onNavigate)}>
            Mở module Ngành
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
            <p className="text-[11px] font-bold uppercase text-subtle">Rổ mã đầu vào</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {inputSource.inputTickers.map((ticker) => (
                <Chip key={ticker} size="sm" variant="neutral">
                  {ticker}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-muted">
              Nhóm: {inputSource.selectedIndustryGroup}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">{inputSource.industryRole}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <GateList
              label="Yếu tố ngành cần kiểm tra"
              items={inputSource.riskFactorsToCheck}
              tone="warning"
              fallback="Chưa có yếu tố ngành"
            />
            <GateList
              label="Tiêu chí lọc gợi ý"
              items={inputSource.suggestedScreeningCriteria}
              tone="success"
              fallback="Chưa có tiêu chí"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ActiveScreeningQuery() {
  const { activeQuery } = screeningRedesignData;

  return (
    <Card className="parent-surface-card min-w-0 overflow-hidden">
      <CardBody className="space-y-4">
        <div>
          <Chip variant="accent">Bộ lọc đang áp dụng</Chip>
          <p className="mt-3 max-w-[30ch] break-words text-base font-bold leading-7 text-ink sm:max-w-full sm:text-lg">{activeQuery.sentence}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {activeQuery.criteria.map((item) => (
            <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-[11px] font-bold uppercase text-subtle">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-ink">{item.value}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ScreeningFunnel() {
  const gates = screeningRedesignData.gates;
  const [activeGateId, setActiveGateId] = useState(gates[0]?.id ?? "");
  const activeGate = gates.find((gate) => gate.id === activeGateId) ?? gates[0];
  const activeIndex = Math.max(
    0,
    gates.findIndex((gate) => gate.id === activeGate.id)
  );
  const countFlow = [gates[0]?.beforeCount, ...gates.map((gate) => gate.afterCount)].filter(
    (count): count is number => typeof count === "number"
  );

  return (
    <section className="space-y-4">
      <div>
        <Chip variant="neutral">Phễu kiểm tra dữ liệu</Chip>
        <h2 className="mt-2 text-xl font-bold text-ink">Quy trình lọc theo mức đủ dữ liệu</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
          Chọn từng cửa để xem chi tiết. Thứ tự này chỉ phản ánh mức độ đủ dữ liệu, không phải xếp hạng đầu tư.
        </p>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardBody className="space-y-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            {countFlow.map((count, index) => (
              <div key={`${count}-${index}`} className="flex items-center gap-2">
                <span className="rounded-[4px] border border-border bg-surface px-2 py-1 font-mono text-sm font-bold text-ink">
                  {count}
                </span>
                {index < countFlow.length - 1 ? (
                  <span className="text-xs font-bold text-subtle">-&gt;</span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {gates.map((gate, index) => {
              const isActive = gate.id === activeGate.id;

              return (
                <button
                  key={gate.id}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-[4px] border px-3 py-3 text-left transition",
                    isActive
                      ? "border-border bg-ink text-white shadow-soft"
                      : "border-border-soft bg-surface-soft text-ink hover:border-border hover:bg-surface-hover"
                  )}
                  type="button"
                  onClick={() => setActiveGateId(gate.id)}
                >
                  <span className={cn("font-mono text-[11px] font-bold", isActive ? "text-white/70" : "text-subtle")}>
                    Cửa {index + 1}
                  </span>
                  <span className={cn("mt-1 block text-sm font-bold", isActive ? "text-white" : "text-ink")}>
                    {gate.shortLabel}
                  </span>
                  <span className={cn("mt-1 block text-xs", isActive ? "text-white/70" : "text-muted")}>
                    {gate.beforeCount} -&gt; {gate.afterCount} mã
                  </span>
                </button>
              );
            })}
          </div>

          <FunnelStep gate={activeGate} index={activeIndex} />
        </CardBody>
      </Card>
    </section>
  );
}

function FunnelStep({ gate, index }: { gate: RedesignedScreeningGate; index: number }) {
  return (
    <article className="rounded-[4px] border border-border-soft bg-surface-soft">
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[150px_minmax(0,1fr)_190px] lg:items-center">
        <div>
          <p className="font-mono text-[11px] font-bold text-subtle">Cửa {index + 1}</p>
          <h3 className="mt-1 text-sm font-bold text-ink">{gate.title}</h3>
          <Chip className="mt-2" size="sm" variant={gateTone[gate.status]}>
            {gate.status}
          </Chip>
        </div>
        <div>
          <p className="text-sm font-bold leading-6 text-ink">{gate.question}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{gate.shortReason}</p>
        </div>
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xl font-bold text-ink">{gate.beforeCount}</span>
            <span className="text-xs font-bold text-subtle">-&gt;</span>
            <span className="text-xl font-bold text-ink">{gate.afterCount}</span>
          </div>
          <p className="mt-1 text-center text-[11px] font-semibold text-subtle">mã trước / sau lọc</p>
        </div>
      </div>
      <div className="grid gap-3 border-t border-border-soft px-4 py-4 md:grid-cols-3">
        <GateList label="Có dữ liệu" items={gate.passedTickers} tone="success" />
        <GateList label="Cần kiểm tra thêm" items={gate.watchTickers} tone="warning" />
        <GateList label="Chưa đủ dữ liệu nếu có" items={gate.rejectedTickers} tone="neutral" fallback="Không có mã thiếu dữ liệu ở bước này" />
      </div>
      <details className="border-t border-border-soft px-4 py-3">
        <summary className="cursor-pointer text-xs font-bold text-accent">
          Vì sao cửa lọc này quan trọng?
        </summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <DetailBlock label="Vì sao quan trọng" value={gate.whyItMatters} />
          <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Dữ liệu cần dùng</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {gate.dataUsed.map((item) => (
                <Chip key={item} size="sm" variant="neutral">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
          <DetailBlock label="Lỗi người mới hay mắc" value={gate.beginnerMistake} />
          <DetailBlock label="Ví dụ minh họa" value={gate.example} />
        </div>
      </details>
    </article>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{value}</p>
    </div>
  );
}

function ScreeningResults({
  onAnalyze,
  candidates,
}: {
  onAnalyze: (candidate: RedesignedScreeningCandidate) => void;
  candidates: RedesignedScreeningCandidate[];
}) {
  const { resultGroups } = screeningRedesignData;

  return (
    <section className="space-y-4">
      <div>
        <Chip variant="accent">Kết quả sau lọc</Chip>
        <h2 className="mt-2 text-2xl font-bold text-ink">Bảng mức đủ dữ liệu của FPT, MWG và VNM</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
          Thứ tự này chỉ phản ánh mức độ đủ dữ liệu, không phải xếp hạng đầu tư.
        </p>
      </div>

      <div className="space-y-5">
        {resultGroups.map((group) => {
          const groupCandidates = candidates.filter((candidate) => candidate.group === group.key);
          return (
            <details
              key={group.key}
              className={cn(
                "rounded-[4px] border-[1.5px] bg-surface shadow-soft",
                group.key === "priority" ? "border-border" : "border-border-soft"
              )}
              open={group.defaultOpen}
            >
              <summary className="cursor-pointer list-none border-b border-border-soft px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-ink">{group.title}</h3>
                      <Chip variant={toneVariant[group.tone]}>{groupCandidates.length} mã</Chip>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted">{group.description}</p>
                  </div>
                  <span className="text-xs font-bold text-subtle">Mở / thu gọn</span>
                </div>
              </summary>
              <div className={cn("grid gap-3 px-5 py-5", group.key === "priority" ? "lg:grid-cols-2" : "xl:grid-cols-3")}>
                {groupCandidates.length > 0 ? (
                  groupCandidates.map((candidate) => (
                    <ScreeningStockCard
                      key={candidate.ticker}
                      candidate={candidate}
                      prominent={group.key === "priority"}
                      onAnalyze={() => onAnalyze(candidate)}
                    />
                  ))
                ) : (
                  <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm text-muted">
                    Chưa có mã trong nhóm này.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function MetricWithTip({ label, value }: { label: ScreeningMetricKey; value: string }) {
  return (
    <div
      className="rounded-[4px] border border-border-soft bg-surface-soft px-2.5 py-2"
      title={screeningRedesignData.termTips[label]}
    >
      <p className="cursor-help text-[10px] font-bold text-subtle">{label}</p>
      <p className="mt-1 text-xs font-bold text-ink">{value}</p>
    </div>
  );
}

function ScreeningStockCard({
  candidate,
  onAnalyze,
  prominent,
}: {
  candidate: RedesignedScreeningCandidate;
  prominent?: boolean;
  onAnalyze: () => void;
}) {
  return (
    <article
      className={cn(
        "rounded-[4px] border bg-surface px-4 py-4",
        prominent ? "border-border shadow-hard-sm" : "border-border-soft"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold leading-none text-ink">{candidate.ticker}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-muted">{candidate.companyName}</p>
        </div>
        <Chip size="sm" variant={toneVariant[groupTone[candidate.group]]}>
          {candidate.groupLabel}
        </Chip>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip size="sm" variant="neutral">{candidate.industry}</Chip>
        <Chip size="sm" variant={toneVariant[groupTone[candidate.group]]}>{candidate.fitLabel}</Chip>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-ink">{candidate.reason}</p>
      <p className="mt-2 rounded-[4px] border border-warning bg-warning/10 px-3 py-2 text-xs leading-5 text-muted">
        {candidate.warnings[1] ?? "Chưa đủ dữ liệu để kết luận."}
      </p>
      <p className="mt-2 text-[11px] leading-4 text-subtle">
        Nguồn/trạng thái: {candidate.sourceStatus} · As of:{" "}
        {candidate.sourceAsOf ?? "Chưa đủ dữ liệu"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(Object.entries(candidate.metrics) as Array<[ScreeningMetricKey, string]>).map(([label, value]) => (
          <MetricWithTip key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
        <p className="text-[11px] font-bold uppercase text-subtle">Dữ liệu còn thiếu / cần kiểm tra</p>
        <p className="mt-1 text-xs leading-5 text-muted">{candidate.checkFlags.join(", ")}</p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <GateList label="Dữ liệu đã có" items={candidate.availableFields} tone="success" />
        <GateList label="Dữ liệu còn thiếu" items={candidate.missingFields} tone="warning" />
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-muted">
        Bước tiếp theo: {candidate.nextStep}
      </p>

      <Button className="mt-4 w-full" size="sm" onClick={onAnalyze}>
        Phân tích tiếp
      </Button>
    </article>
  );
}

function AnalysisPathDrawer({
  candidate,
  onClose,
  onNavigate,
}: {
  candidate: RedesignedScreeningCandidate | null;
  onClose: () => void;
  onNavigate?: (moduleKey: string) => void;
}) {
  if (!candidate) return null;

  const moduleTargets = ["business", "financials", "valuation", "technical", "risk", "watchlist"];

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-5 py-4">
          <div>
            <Chip variant={toneVariant[groupTone[candidate.group]]}>{candidate.groupLabel}</Chip>
            <h2 className="mt-2 text-lg font-bold text-ink">Phân tích {candidate.ticker} theo lộ trình</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Chọn bước tiếp theo để đọc sâu hơn. Kết quả lọc chỉ nói về mức đủ dữ liệu.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
        <div className="grid gap-3 px-5 py-5">
          {screeningRedesignData.analysisPath.map((step, index) => (
            <button
              key={step}
              className="grid gap-1 rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-left transition hover:border-border hover:bg-surface-hover"
              type="button"
              onClick={() => goToModule(moduleTargets[index], onNavigate, candidate.ticker)}
            >
              <span className="font-mono text-[11px] font-bold text-subtle">Bước {index + 1}</span>
              <span className="text-sm font-bold text-ink">{step}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NextStepPanel() {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Chip variant="neutral">Kết luận và bước tiếp theo</Chip>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-ink">
            {screeningRedesignData.nextPanel}
          </p>
        </div>
        <Chip variant="accent">Chỉ lọc theo mức đủ dữ liệu</Chip>
      </CardBody>
    </Card>
  );
}

export function ScreeningPage({ onNavigate, initialData }: ScreeningPageProps) {
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<RedesignedScreeningCandidate | null>(null);
  const [inputSource] = useState(readScreeningInputSource);

  const candidates = initialData?.candidates ?? screeningRedesignData.candidates;
  const activeCandidatesByTicker = useMemo(
    () => Object.fromEntries(candidates.map((c) => [c.ticker, c])),
    [candidates]
  );

  const priorityCount = useMemo(
    () => candidates.filter((candidate) => candidate.group === "priority").length,
    [candidates]
  );

  return (
    <div className="mx-auto w-[calc(100vw-40px)] max-w-[1180px] min-w-0 space-y-8 overflow-x-hidden md:w-full">
      <ScreeningHeader onGuideOpen={() => setGuideOpen(true)} />
      <TickerQuickCheck onAnalyze={setActiveCandidate} candidatesByTicker={activeCandidatesByTicker} />
      <ScreeningInputSourceBanner inputSource={inputSource} onNavigate={onNavigate} />
      <ActiveScreeningQuery />
      <ScreeningFunnel />
      <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3">
        <p className="text-sm font-bold text-ink">
          Sau kiểm tra dữ liệu có {priorityCount} mã đủ dữ liệu để phân tích tiếp. Đây không phải xếp hạng đầu tư.
        </p>
      </div>
      <ScreeningResults onAnalyze={setActiveCandidate} candidates={candidates} />
      <NextStepPanel />
      <ScreeningGuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} />
      <AnalysisPathDrawer
        candidate={activeCandidate}
        onClose={() => setActiveCandidate(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
