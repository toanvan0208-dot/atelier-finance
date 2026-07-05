"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  screeningRedesignData,
  type RedesignedScreeningCandidate,
  type ScreeningMetricKey,
} from "../data/screeningRedesign.data";
import type { ScreeningRuntimeData } from "../lib/load-screening-runtime-data";
import type { ScreeningCandidatePayload } from "../lib/screening-candidate-read-path";
import type { ScreeningCandidateGroupKey, ScreeningGuideTone } from "../types";

type ScreeningPageProps = {
  onNavigate?: (moduleKey: string) => void;
  initialData?: ScreeningRuntimeData;
};

type ScreeningInputSource = typeof screeningRedesignData.defaultInputSource;
type ScreeningCriteriaFilters = {
  search: string;
  industry: "all" | "steel";
  coverageLevel: "all" | "screeningCandidate" | "fullAnalysis";
  dataStatus: "all" | "needsReview" | "researchOnly" | "productionNotApproved";
  analysis: "all" | "canContinue" | "notOpen";
  metricCodes: string[];
};

const defaultCriteriaFilters: ScreeningCriteriaFilters = {
  search: "",
  industry: "all",
  coverageLevel: "all",
  dataStatus: "all",
  analysis: "all",
  metricCodes: [],
};

const metricFilterOptions = [
  { code: "PE", label: "Có P/E" },
  { code: "PB", label: "Có P/B" },
  { code: "CFO", label: "Có CFO" },
  { code: "LIQUIDITY", label: "Có thanh khoản" },
];

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
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="font-brand text-3xl font-bold leading-tight text-ink md:text-4xl">
          Bước 3 — Lọc theo mức độ đủ dữ liệu
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Kiểm tra mã nào đang có đủ dữ liệu để đọc tiếp. Đây không phải bảng xếp hạng cổ phiếu và không phải khuyến
          nghị đầu tư.
        </p>
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
  screeningCandidatesByTicker,
  onInspectScreeningCandidate,
}: {
  onAnalyze: (candidate: RedesignedScreeningCandidate) => void;
  candidatesByTicker: Record<string, RedesignedScreeningCandidate>;
  screeningCandidatesByTicker: Record<string, ScreeningCandidatePayload>;
  onInspectScreeningCandidate: (ticker: string) => void;
}) {
  const [tickerInput, setTickerInput] = useState("");
  const [error, setError] = useState("");
  const [checkedTicker, setCheckedTicker] = useState<string | null>(null);
  const candidate = checkedTicker ? candidatesByTicker[checkedTicker] : null;
  const screeningCandidate = checkedTicker ? screeningCandidatesByTicker[checkedTicker] : null;
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

    if (!candidatesByTicker[normalizedTicker] && !screeningCandidatesByTicker[normalizedTicker]) {
      setCheckedTicker(null);
      setError("Screener chưa có mã này trong phạm vi lọc hiện tại.");
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

        {!candidate && screeningCandidate ? (
          <section className="rounded-[4px] border-[1.5px] border-border bg-surface-soft">
            <div className="flex flex-col gap-3 border-b border-border-soft px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-subtle">Kiểm tra nhanh trong danh sách screening</p>
                <h2 className="mt-1 text-xl font-bold text-ink">
                  {screeningCandidate.ticker} · {screeningCandidate.companyName ?? "N/A"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Mã này nằm trong danh sách lọc hiện tại. Kết quả chỉ nói về mức đủ dữ liệu, không phải khuyến nghị đầu tư.
                </p>
              </div>
              <Chip variant={screeningCandidate.analysisEligible ? "success" : "warning"}>
                {screeningCandidate.analysisEligible ? "Có thể phân tích tiếp" : "Chưa mở phân tích sâu"}
              </Chip>
            </div>
            <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoBlock label="Chế độ dữ liệu" value={dataModeLabel(screeningCandidate.dataMode)} />
              <InfoBlock label="Phân tích sâu" value={screeningCandidate.fullAnalysisEnabled ? "Đã mở" : "Chưa mở"} />
              <InfoBlock label="Rà soát" value={screeningCandidate.needsReview ? "Cần rà soát" : "Đã đủ"} />
              <InfoBlock label="Benchmark" value={screeningCandidate.isValuationRiskBenchmarkEligible ? "Có thể dùng" : "Không dùng để so sánh"} />
            </div>
            <div className="border-t border-border-soft px-4 py-3">
              <Button size="sm" variant="secondary" onClick={() => onInspectScreeningCandidate(screeningCandidate.ticker)}>
                Lọc danh sách theo mã này
              </Button>
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

function ScreeningCriteriaCard({
  filters,
  inputSource,
  matchCount,
  onFiltersChange,
  onNavigate,
  onResetFilters,
}: {
  filters: ScreeningCriteriaFilters;
  inputSource: ScreeningInputSource;
  matchCount: number;
  onFiltersChange: (filters: ScreeningCriteriaFilters) => void;
  onNavigate?: (moduleKey: string) => void;
  onResetFilters: () => void;
}) {
  function toggleMetric(metricCode: string) {
    const metricCodes = filters.metricCodes.includes(metricCode)
      ? filters.metricCodes.filter((code) => code !== metricCode)
      : [...filters.metricCodes, metricCode];
    onFiltersChange({ ...filters, metricCodes });
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Chip variant="accent">Lọc theo tiêu chí</Chip>
            <h2 className="mt-2 text-lg font-bold text-ink">Đang kiểm tra các mã trong phạm vi hiện tại</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
              Screening kiểm tra ngành và mức đủ dữ liệu tối thiểu. Đây không phải khuyến nghị đầu tư, không phải bảng
              xếp hạng và không dùng làm benchmark định giá/rủi ro.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => goToModule("industry", onNavigate)}>
            Mở module Ngành
          </Button>
        </div>

        <p className="text-xs font-bold text-ink">Kết quả phù hợp bộ lọc hiện tại: {matchCount} mã</p>

        <div className="grid gap-2 lg:grid-cols-[minmax(160px,1.1fr)_minmax(150px,0.85fr)_minmax(150px,0.85fr)_minmax(150px,0.85fr)_minmax(150px,0.85fr)_auto]">
          <input
            aria-label="Tìm mã"
            className="h-10 min-w-0 rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm font-semibold uppercase text-ink outline-none transition placeholder:normal-case placeholder:text-muted focus:bg-accent-soft"
            placeholder="Tìm mã: HPG, HSG, NKG..."
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          />
          <select
            aria-label="Lọc theo ngành"
            className="h-10 rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm font-semibold text-ink"
            value={filters.industry}
            onChange={(event) => onFiltersChange({ ...filters, industry: event.target.value as ScreeningCriteriaFilters["industry"] })}
          >
            <option value="all">Tất cả ngành</option>
            <option value="steel">Thép / vật liệu xây dựng</option>
          </select>
          <select
            aria-label="Lọc theo mức dữ liệu"
            className="h-10 rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm font-semibold text-ink"
            value={filters.coverageLevel}
            onChange={(event) =>
              onFiltersChange({ ...filters, coverageLevel: event.target.value as ScreeningCriteriaFilters["coverageLevel"] })
            }
          >
            <option value="all">Tất cả mức dữ liệu</option>
            <option value="screeningCandidate">Ứng viên sàng lọc</option>
            <option value="fullAnalysis">Phân tích đầy đủ</option>
          </select>
          <select
            aria-label="Lọc theo trạng thái dữ liệu"
            className="h-10 rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm font-semibold text-ink"
            value={filters.dataStatus}
            onChange={(event) => onFiltersChange({ ...filters, dataStatus: event.target.value as ScreeningCriteriaFilters["dataStatus"] })}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="needsReview">Cần rà soát</option>
            <option value="researchOnly">Dữ liệu nghiên cứu</option>
            <option value="productionNotApproved">Chưa phê duyệt sản xuất</option>
          </select>
          <select
            aria-label="Lọc theo khả năng đi tiếp"
            className="h-10 rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm font-semibold text-ink"
            value={filters.analysis}
            onChange={(event) => onFiltersChange({ ...filters, analysis: event.target.value as ScreeningCriteriaFilters["analysis"] })}
          >
            <option value="all">Tất cả</option>
            <option value="canContinue">Có thể phân tích tiếp</option>
            <option value="notOpen">Chưa mở phân tích sâu</option>
          </select>
          <Button className="h-10" size="sm" variant="secondary" onClick={onResetFilters}>
            Xóa lọc
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {metricFilterOptions.map((option) => (
            <label
              key={option.code}
              className="flex h-8 cursor-pointer items-center gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 text-xs font-bold text-ink"
            >
              <input
                checked={filters.metricCodes.includes(option.code)}
                className="h-3.5 w-3.5 accent-ink"
                type="checkbox"
                onChange={() => toggleMetric(option.code)}
              />
              {option.label}
            </label>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,0.75fr)]">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
            <p className="text-[11px] font-bold uppercase text-subtle">Phạm vi ngành</p>
            <p className="mt-2 text-sm font-bold text-ink">{inputSource.industryName}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{inputSource.selectedIndustryGroup}</p>
            <p className="mt-3 text-[11px] font-bold uppercase text-subtle">Mã trong phạm vi</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {inputSource.inputTickers.map((ticker) => (
                <Chip key={ticker} size="sm" variant="neutral">
                  {ticker}
                </Chip>
              ))}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{inputSource.industryRole}</p>
          </div>

          <div className="grid gap-3">
            <GateList
              label="Tiêu chí ngành"
              items={inputSource.riskFactorsToCheck}
              tone="warning"
              fallback="Chưa có tiêu chí ngành"
            />
            <GateList
              label="Tiêu chí dữ liệu"
              items={inputSource.suggestedScreeningCriteria}
              tone="success"
              fallback="Chưa có tiêu chí dữ liệu"
            />
          </div>

          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
            <p className="text-[11px] font-bold uppercase text-subtle">Điểm dừng</p>
            <p className="mt-2 text-sm font-bold text-ink">Chỉ kiểm tra mức đủ dữ liệu</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Mã ở trạng thái ứng viên sàng lọc chưa mở phân tích sâu. Thiếu dữ liệu vẫn hiển thị N/A hoặc cần rà soát.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip size="sm" variant="neutral">Dữ liệu nghiên cứu</Chip>
              <Chip size="sm" variant="neutral">Cần rà soát</Chip>
              <Chip size="sm" variant="warning">không phải benchmark</Chip>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
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
  const tickerList = formatTickerList(candidates.map((candidate) => candidate.ticker));
  const resultTitle = tickerList
    ? `Bảng mức đủ dữ liệu của ${tickerList}`
    : "Bảng mức đủ dữ liệu của các mã trong phạm vi hiện tại";

  return (
    <section className="space-y-4">
      <div>
        <Chip variant="accent">Kết quả sau lọc</Chip>
        <h2 className="mt-2 text-2xl font-bold text-ink">{resultTitle}</h2>
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

function formatTickerList(tickers: string[]): string {
  const uniqueTickers = Array.from(new Set(tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))).sort();

  if (uniqueTickers.length <= 3) {
    return uniqueTickers.join(", ").replace(/, ([^,]*)$/, " và $1");
  }

  return `${uniqueTickers.length} mã trong phạm vi hiện tại (${uniqueTickers.join(", ")})`;
}

function hasCandidateMetric(candidate: ScreeningCandidatePayload, metricCodes: string[]): boolean {
  return candidate.metrics.some((metric) => metricCodes.includes(metric.metricCode) && metric.value !== null);
}

function buildScreeningMethodRows(candidate: ScreeningCandidatePayload) {
  const hasIndustry = Boolean(candidate.industryCode);
  const hasValuationInput = hasCandidateMetric(candidate, ["PE", "PB", "CLOSE_PRICE"]);
  const hasCashFlow = hasCandidateMetric(candidate, ["CFO"]);
  const hasTradingData = hasCandidateMetric(candidate, ["LIQUIDITY", "VOLUME", "CLOSE_PRICE"]);
  const hasReviewStatus = candidate.dataMode === "research_only" || candidate.needsReview || !candidate.productionApproved;

  return [
    {
      label: "Ngành & phạm vi",
      value: hasIndustry ? `${candidate.industryCode} · ${coverageLevelLabel(candidate.coverageLevel)}` : "Chưa có ngành",
      help: "Dùng để biết mã này thuộc nhóm ngành nào trước khi đọc sâu.",
      available: hasIndustry,
    },
    {
      label: "Định giá sơ bộ",
      value: hasValuationInput ? "Có dữ liệu P/E, P/B hoặc giá đóng cửa" : "Chưa có dữ liệu định giá sơ bộ",
      help: "Chỉ kiểm tra có dữ liệu đầu vào để đọc tiếp, không kết luận rẻ hay đắt.",
      available: hasValuationInput,
    },
    {
      label: "Dòng tiền",
      value: hasCashFlow ? "Có CFO để kiểm tra dòng tiền" : "Chưa có CFO",
      help: "CFO giúp xem lợi nhuận có đi kèm tiền thật hay không.",
      available: hasCashFlow,
    },
    {
      label: "Thanh khoản",
      value: hasTradingData ? "Có dữ liệu giá/khối lượng/thanh khoản" : "Chưa có dữ liệu giao dịch",
      help: "Dùng để biết mã có dữ liệu thị trường đủ đọc tiếp hay chưa.",
      available: hasTradingData,
    },
    {
      label: "Trạng thái dữ liệu",
      value: hasReviewStatus ? "Dữ liệu nghiên cứu, cần rà soát" : "Dữ liệu đã sẵn sàng hơn",
      help: "Nhắc người dùng không biến kết quả lọc thành kết luận đầu tư.",
      available: true,
    },
  ];
}

function dataModeLabel(dataMode: string): string {
  return dataMode === "research_only" ? "Dữ liệu nghiên cứu" : dataMode;
}

function coverageLevelLabel(coverageLevel: string): string {
  if (coverageLevel === "screening_candidate") return "Ứng viên sàng lọc";
  if (coverageLevel === "full_analysis") return "Phân tích đầy đủ";
  return coverageLevel;
}

function candidateCaveatLabel(caveat: string): string {
  const normalized = caveat.toLowerCase();
  if (normalized === "research_only") return "Dữ liệu nghiên cứu";
  if (normalized === "needsreview" || normalized === "needs_review") return "Cần rà soát";
  if (normalized.includes("not investment advice")) return "Không phải khuyến nghị";
  if (normalized.includes("not full analysis")) return "Chưa phải phân tích đầy đủ";
  if (normalized.includes("not valuation/risk benchmark")) return "Không dùng làm chuẩn so sánh";
  if (normalized.includes("provider p/e")) return "P/E là ảnh chụp tỷ số thị trường";
  if (normalized.includes("cfo")) return "CFO từ nguồn BCTC hợp nhất đã nhập";
  return coverageLevelLabel(caveat);
}

function candidateMatchesCriteria(candidate: ScreeningCandidatePayload, filters: ScreeningCriteriaFilters): boolean {
  const search = filters.search.trim().toUpperCase();
  if (search && !candidate.ticker.includes(search) && !(candidate.companyName ?? "").toUpperCase().includes(search)) return false;
  if (filters.industry === "steel" && candidate.industryCode !== "STEEL_MATERIALS") return false;
  if (filters.coverageLevel === "screeningCandidate" && candidate.coverageLevel !== "screening_candidate") return false;
  if (filters.coverageLevel === "fullAnalysis" && candidate.coverageLevel !== "full_analysis") return false;
  if (filters.dataStatus === "needsReview" && !candidate.needsReview) return false;
  if (filters.dataStatus === "researchOnly" && candidate.dataMode !== "research_only") return false;
  if (filters.dataStatus === "productionNotApproved" && candidate.productionApproved) return false;
  if (filters.analysis === "canContinue" && !candidate.analysisEligible) return false;
  if (filters.analysis === "notOpen" && candidate.analysisEligible) return false;

  return filters.metricCodes.every((metricCode) =>
    candidate.metrics.some((metric) => metric.metricCode === metricCode && metric.value !== null)
  );
}

function ScreeningCandidateUniverse({
  candidates,
  onNavigate,
}: {
  candidates: ScreeningCandidatePayload[];
  onNavigate?: (moduleKey: string) => void;
}) {
  const analysisReadyCount = candidates.filter((candidate) => candidate.analysisEligible).length;
  const reviewCount = candidates.filter((candidate) => candidate.needsReview).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Chip variant="warning">Danh sách sau lọc</Chip>
          <h2 className="mt-2 text-2xl font-bold text-ink">Các mã phù hợp với bộ lọc hiện tại</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Mỗi card chỉ kiểm tra mức đủ dữ liệu và trạng thái đi tiếp. Kết quả này không phải xếp hạng hay khuyến nghị đầu tư.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <InfoBlock label="Đang hiển thị" value={`${candidates.length} mã`} />
          <InfoBlock label="Có thể đi tiếp" value={`${analysisReadyCount} mã`} />
          <InfoBlock label="Cần rà soát" value={`${reviewCount} mã`} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {candidates.length > 0 ? (
          candidates.map((candidate) => (
          <article key={candidate.ticker} className="min-w-0 rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none text-ink">{candidate.ticker}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-muted">
                  {candidate.companyName ?? "N/A"} · {candidate.industryCode ?? "N/A"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip size="sm" variant="warning">{coverageLevelLabel(candidate.coverageLevel)}</Chip>
                <Chip size="sm" variant="neutral">
                  {candidate.analysisEligible ? "Có thể phân tích tiếp" : "Chưa mở phân tích sâu"}
                </Chip>
              </div>
            </div>

            <div className="mt-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-ink">Bộ lọc đang áp dụng</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Card này chỉ kiểm tra cổ phiếu có đủ dữ liệu để đọc tiếp hay chưa, không kết luận cổ phiếu tốt/xấu.
                  </p>
                </div>
                <Chip size="sm" variant={candidate.analysisEligible ? "success" : "warning"}>
                  {candidate.analysisEligible ? "Đủ điều kiện đi tiếp" : "Chưa mở phân tích sâu"}
                </Chip>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {buildScreeningMethodRows(candidate).map((row) => (
                  <div
                    key={row.label}
                    className="min-w-0 rounded-[4px] border border-border-soft bg-surface px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase text-subtle">{row.label}</p>
                      <Chip size="sm" variant={row.available ? "success" : "warning"}>
                        {row.available ? "Có dữ liệu" : "Cần bổ sung"}
                      </Chip>
                    </div>
                    <p className="mt-1 text-sm font-bold leading-5 text-ink">{row.value}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{row.help}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-[4px] border border-warning bg-warning/10 px-3 py-2 text-xs leading-5 text-muted">
                Lưu ý: đây là bộ lọc mức đủ dữ liệu, không phải khuyến nghị đầu tư, không phải xếp hạng và không phải benchmark định giá/rủi ro.
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {candidate.caveats.map((caveat) => (
                  <Chip key={caveat} size="sm" variant="neutral">
                    {candidateCaveatLabel(caveat)}
                  </Chip>
                ))}
              </div>
              <Button
                size="sm"
                disabled={!candidate.analysisEligible}
                onClick={() => goToModule("business", onNavigate, candidate.ticker)}
              >
                Phân tích tiếp
              </Button>
            </div>
          </article>
          ))
        ) : (
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4 text-sm font-semibold text-muted">
            Không có mã phù hợp với bộ lọc hiện tại.
          </p>
        )}
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

function ScreeningRuntimeSourceNotice({
  status,
}: {
  status: ScreeningRuntimeData["screeningCandidatesStatus"];
}) {
  if (!status) return null;

  const variant = status.status === "ready" ? "success" : status.status === "error" ? "danger" : "warning";

  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">Nguồn dữ liệu lọc cổ phiếu</p>
          <p className="mt-1 text-sm leading-6 text-muted">{status.message}</p>
          {status.error ? (
            <p className="mt-1 text-xs leading-5 text-danger">Lỗi đọc dữ liệu: {status.error}</p>
          ) : null}
        </div>
        <Chip variant={variant}>{status.count} mã</Chip>
      </div>
    </div>
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
  const [criteriaFilters, setCriteriaFilters] = useState<ScreeningCriteriaFilters>(defaultCriteriaFilters);
  const [inputSource] = useState(readScreeningInputSource);

  const candidates = initialData?.candidates ?? screeningRedesignData.candidates;
  const dedicatedScreeningCandidates = useMemo(
    () => initialData?.screeningCandidates ?? [],
    [initialData?.screeningCandidates]
  );
  const screeningCandidatesStatus = initialData?.screeningCandidatesStatus;
  const filteredScreeningCandidates = dedicatedScreeningCandidates.filter((candidate) =>
    candidateMatchesCriteria(candidate, criteriaFilters)
  );
  const hasRuntimeScreeningCandidates = dedicatedScreeningCandidates.length > 0;
  const screeningCandidatesByTicker = useMemo(
    () => Object.fromEntries(dedicatedScreeningCandidates.map((c) => [c.ticker, c])),
    [dedicatedScreeningCandidates]
  );
  const activeCandidatesByTicker = useMemo(
    () => Object.fromEntries(candidates.map((c) => [c.ticker, c])),
    [candidates]
  );

  const priorityCount = useMemo(
    () =>
      hasRuntimeScreeningCandidates
        ? filteredScreeningCandidates.filter((candidate) => candidate.analysisEligible).length
        : candidates.filter((candidate) => candidate.group === "priority").length,
    [candidates, filteredScreeningCandidates, hasRuntimeScreeningCandidates]
  );

  return (
    <div className="mx-auto w-[calc(100vw-40px)] max-w-[1180px] min-w-0 space-y-8 overflow-x-hidden md:w-full">
      <ScreeningHeader onGuideOpen={() => setGuideOpen(true)} />
      <TickerQuickCheck
        onAnalyze={setActiveCandidate}
        candidatesByTicker={activeCandidatesByTicker}
        screeningCandidatesByTicker={screeningCandidatesByTicker}
        onInspectScreeningCandidate={(ticker) => setCriteriaFilters({ ...defaultCriteriaFilters, search: ticker })}
      />
      <ScreeningCriteriaCard
        filters={criteriaFilters}
        inputSource={inputSource}
        matchCount={filteredScreeningCandidates.length}
        onFiltersChange={setCriteriaFilters}
        onNavigate={onNavigate}
        onResetFilters={() => setCriteriaFilters(defaultCriteriaFilters)}
      />
      <ScreeningRuntimeSourceNotice status={screeningCandidatesStatus} />
      <ScreeningCandidateUniverse candidates={filteredScreeningCandidates} onNavigate={onNavigate} />
      <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3">
        <p className="text-sm font-bold text-ink">
          Sau kiểm tra dữ liệu có {priorityCount} mã đủ điều kiện mở bước phân tích tiếp. Đây không phải xếp hạng đầu tư.
        </p>
      </div>
      {!hasRuntimeScreeningCandidates ? <ScreeningResults onAnalyze={setActiveCandidate} candidates={candidates} /> : null}
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
