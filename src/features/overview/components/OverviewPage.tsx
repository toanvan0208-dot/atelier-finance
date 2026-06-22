"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, EmptyState, LoadingState } from "@/components/ui";
import {
  fetchOverviewInputsByTicker,
  OverviewApiError,
  type OverviewApiInputs,
} from "@/lib/data-sources/overview-api-client";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { baseOverviewCaseData } from "../data/overviewCase.data";
import { buildOverviewDeskData } from "../lib/build-overview-desk-data";
import {
  buildOverviewCrossModuleReadinessSummary,
  type OverviewCrossModuleReadinessSummary,
  type OverviewModuleReadinessItem,
} from "../lib/overview-cross-module-readiness";
import type { OverviewCaseDashboardData, OverviewCaseData, OverviewBottleneck } from "../types";

type OverviewPageProps = {
  initialFinancialsRuntimeData?: FinancialsRuntimeData;
  onNavigate: (key: string) => void;
};

type OverviewBridgeState =
  | { status: "loading" }
  | { status: "ready"; result: OverviewApiInputs; data: OverviewCaseDashboardData }
  | { status: "insufficient"; result: OverviewApiInputs; data: OverviewCaseDashboardData }
  | { status: "empty"; ticker: string; missingReasons: string[] }
  | { status: "error"; ticker: string; message: string };

const buildBridgeData = (result: OverviewApiInputs): OverviewCaseDashboardData => {
  const data = buildOverviewDeskData(baseOverviewCaseData, result.snapshot);
  const ticker = result.snapshot.ticker ?? result.ticker;
  return {
    ...data,
    activeCase: {
      ...data.activeCase,
      ticker,
      companyName: result.companyName,
      industry: result.industry,
    },
  };
};

export function MvpCurrentTicker({ activeCase }: { activeCase: OverviewCaseData }) {
  const hasMetadata = activeCase.companyName && activeCase.companyName !== activeCase.ticker;
  return (
    <Card className="border-[1.5px] border-border shadow-soft" data-testid="overview-hero">
      <CardHeader title="Bạn đang xem mã nào" />
      <CardBody>
        <h1 className="font-brand text-3xl font-bold text-ink md:text-4xl">
          Bạn đang xem: {activeCase.ticker}
        </h1>
        {hasMetadata ? (
          <div className="mt-4 space-y-1 text-sm leading-6 text-muted">
            <p>
              <strong className="text-ink">Tên doanh nghiệp:</strong> {activeCase.companyName}
            </p>
            <p>
              <strong className="text-ink">Ngành:</strong> {activeCase.industry}
            </p>
            <p>
              <strong className="text-ink">Sàn giao dịch:</strong> Chưa đủ dữ liệu mô tả
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Chưa đủ dữ liệu mô tả doanh nghiệp</p>
        )}
      </CardBody>
    </Card>
  );
}

export function MvpAvailableData({ summary }: { summary: OverviewCrossModuleReadinessSummary }) {
  const mapStatus = (item: OverviewModuleReadinessItem) => {
    if (item.status === "blocked") return "Không khả dụng";
    if (item.status === "boundary_only") return "Cần kiểm tra thêm";
    if (item.status === "partial") {
      if (item.dataMode !== "sample" && item.dataMode !== "unknown") return "Có dữ liệu";
      return "Một phần";
    }
    return "Chưa đủ dữ liệu";
  };

  const readinessItems = summary.items.reduce((acc, item) => {
    acc[item.moduleKey] = mapStatus(item);
    return acc;
  }, {} as Record<string, string>);

  const items = [
    { label: "Business", status: "Chưa đủ dữ liệu" },
    { label: "Financials", status: readinessItems["financials"] ?? "Chưa đủ dữ liệu" },
    { label: "Valuation", status: readinessItems["valuation"] ?? "Chưa đủ dữ liệu" },
    { label: "Technical/PVT", status: readinessItems["technical"] ?? "Chưa đủ dữ liệu" },
    { label: "Risk", status: "Cần kiểm tra thêm" },
    { label: "Macro", status: readinessItems["macro"] ?? "Chưa đủ dữ liệu" },
    { label: "Industry", status: readinessItems["industry"] ?? "Chưa đủ dữ liệu" },
    { label: "AI Assistant", status: "Không khả dụng" },
  ];

  return (
    <Card className="border-border">
      <CardHeader title="Dữ liệu hiện có" />
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <p className="font-bold text-ink">{item.label}</p>
              <p className="mt-1 text-sm text-muted">{item.status}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function MvpMissingData({ bottlenecks }: { bottlenecks: OverviewBottleneck[] }) {
  return (
    <Card className="border-border">
      <CardHeader title="Dữ liệu còn thiếu" />
      <CardBody>
        <ul className="list-inside list-disc space-y-2 text-sm leading-6 text-muted">
          <li>Dữ liệu nhiều kỳ/nhiều năm vẫn còn hạn chế.</li>
          <li>Một số trường dữ liệu có thể chưa đủ để tính chỉ số.</li>
          <li>Dữ liệu đang ở trạng thái nghiên cứu, chưa phê duyệt sản xuất.</li>
          <li>Chưa nên kết luận chỉ từ một chỉ số hoặc một module.</li>
          {bottlenecks.map((b) => (
            <li key={b.title}>
              Thiếu {b.title}: {b.whyItMatters}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function MvpNextSteps({ onNavigate }: { onNavigate: (key: string) => void }) {
  const steps = [
    { label: "Business — hiểu doanh nghiệp làm gì", key: "business" },
    { label: "Financials — xem số liệu tài chính chính", key: "financials" },
    { label: "Valuation — xem chỉ số nào tính được/chưa tính được", key: "valuation" },
    { label: "Technical/PVT — quan sát giá và khối lượng", key: "technical" },
    { label: "Risk — kiểm tra dữ liệu thiếu trước khi kết luận", key: "risk" },
    { label: "AI Assistant — hỏi lại phần chưa hiểu", key: "assistant" },
  ];

  return (
    <Card className="border-border">
      <CardHeader title="Nên xem gì tiếp theo trong hệ thống" />
      <CardBody>
        <div className="grid gap-2">
          {steps.map((step, i) => (
            <button
              key={step.key}
              onClick={() => onNavigate(step.key)}
              className="flex items-center gap-3 rounded-[4px] border border-border-soft bg-surface px-4 py-3 text-left transition hover:border-border hover:bg-surface-hover"
              type="button"
            >
              <span className="grid h-6 w-6 place-items-center rounded-[3px] border border-border bg-surface-soft text-xs font-bold text-ink">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-ink">{step.label}</span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ManualDataImportCta() {
  return (
    <Card className="border-warning bg-warning/10">
      <CardHeader
        title="Nhập dữ liệu"
        description="Dán dữ liệu CSV do bạn cung cấp để hệ thống kiểm tra chất lượng dữ liệu và tạo preview Financials/Valuation."
        chip={<Chip variant="warning">Dữ liệu thủ công</Chip>}
        action={
          <a
            className="inline-flex h-9 items-center justify-center rounded-[3px] border-[1.5px] border-border bg-surface px-3.5 text-sm font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-surface-hover"
            href="/data-import"
          >
            Mở workspace
          </a>
        }
      />
      <CardBody>
        <p className="text-sm leading-6 text-muted">
          Dữ liệu này do người dùng cung cấp, không phải nguồn dữ liệu hệ thống đã xác minh. Workspace chỉ kiểm tra dữ liệu và preview phân tích, không thay thế dữ liệu module chính.
        </p>
      </CardBody>
    </Card>
  );
}

export function OverviewPage({ initialFinancialsRuntimeData, onNavigate }: OverviewPageProps) {
  const [tickerInput, setTickerInput] = useState("FPTLAB");
  const [request, setRequest] = useState({ ticker: "FPTLAB", id: 0 });
  const [bridgeState, setBridgeState] = useState<OverviewBridgeState>({ status: "loading" });
  const activeTicker = request.ticker;
  const crossModuleReadiness = useMemo(
    () => buildOverviewCrossModuleReadinessSummary(initialFinancialsRuntimeData),
    [initialFinancialsRuntimeData],
  );

  useEffect(() => {
    let isActive = true;

    fetchOverviewInputsByTicker({ ticker: activeTicker })
      .then((result) => {
        if (!isActive) return;
        if (result.missingReasons.includes("company")) {
          setBridgeState({ status: "empty", ticker: activeTicker, missingReasons: result.missingReasons });
          return;
        }

        const data = buildBridgeData(result);
        setBridgeState({
          status: result.status === "ready" ? "ready" : "insufficient",
          result,
          data,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message =
          error instanceof OverviewApiError
            ? error.message
            : "Unable to load overview inputs from persisted data.";
        setBridgeState({ status: "error", ticker: activeTicker, message });
      });

    return () => {
      isActive = false;
    };
  }, [activeTicker, request.id]);

  const submitTicker = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTicker = tickerInput.trim().toUpperCase();
    if (!nextTicker) return;
    setBridgeState({ status: "loading" });
    setRequest((current) => ({ ticker: nextTicker, id: current.id + 1 }));
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <Card>
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" onSubmit={submitTicker}>
            <div>
              <p className="text-xs font-bold uppercase text-muted">Mã chứng khoán</p>
              <label className="mt-2 block text-sm font-extrabold text-ink" htmlFor="overview-ticker-input">
                Nhập mã để phân tích
              </label>
              <input
                className="mt-2 h-9 w-full rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-accent sm:w-[180px]"
                id="overview-ticker-input"
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value)}
              />
            </div>
            <Button isLoading={bridgeState.status === "loading"} type="submit" variant="secondary">
              Tải dữ liệu
            </Button>
          </form>
        </CardBody>
      </Card>

      {bridgeState.status === "loading" ? (
        <LoadingState
          description={`Đang tải dữ liệu tổng quan cho ${activeTicker}.`}
          title="Đang xử lý"
        />
      ) : null}

      {bridgeState.status === "empty" ? (
        <EmptyState
          description={`Thiếu ${bridgeState.missingReasons.join(", ")} cho ${bridgeState.ticker}.`}
          icon="O"
          title="Chưa đủ dữ liệu nền"
        />
      ) : null}

      {bridgeState.status === "error" ? (
        <EmptyState
          description={bridgeState.message}
          icon="!"
          title={`Không tải được dữ liệu cho ${bridgeState.ticker}`}
        />
      ) : null}

      {bridgeState.status === "ready" || bridgeState.status === "insufficient" ? (
        <>
          {bridgeState.status === "insufficient" ? (
            <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3 text-sm font-bold leading-6 text-ink">
              Dữ liệu chưa đủ để tổng hợp đầy đủ cho Overview: {bridgeState.result.missingReasons.join(", ")}.
            </div>
          ) : null}

          <div className="grid gap-5">
            <MvpCurrentTicker activeCase={bridgeState.data.activeCase} />
            <MvpAvailableData summary={crossModuleReadiness} />
            <MvpMissingData bottlenecks={bridgeState.data.missingData} />
            <MvpNextSteps onNavigate={onNavigate} />
            <ManualDataImportCta />
          </div>
        </>
      ) : null}
    </div>
  );
}
