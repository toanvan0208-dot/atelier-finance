"use client";

import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PortfolioReadinessItem, PortfolioReadinessResult, PortfolioReadinessStatus } from "../lib/load-portfolio-readiness";

type PortfolioReadinessPanelProps = {
  data?: PortfolioReadinessResult | null;
};

const statusVariant: Record<PortfolioReadinessStatus, "success" | "warning" | "neutral"> = {
  available: "success",
  insufficient_data: "warning",
  partial: "warning",
  unavailable: "neutral",
};

const statusText: Record<string, string> = {
  activated: "Đã kích hoạt",
  available: "Có dữ liệu",
  boundary_only: "Có đường kiểm tra, chưa có bản ghi",
  checked_no_value: "Đã kiểm tra, chưa có giá trị",
  deferred: "Chờ nguồn đủ kiểm chứng",
  insufficient_data: "Chưa đủ dữ liệu",
  partial: "Một phần",
  ready: "Có thể kiểm tra",
  unavailable: "Chưa có dữ liệu",
};

const readableStatus = (value: string): string => statusText[value] ?? value.replaceAll("_", " ");

const valueOrUnavailable = (value: number | string | null | undefined): string =>
  value === null || value === undefined || value === "" ? "Chưa có dữ liệu" : String(value);

const blockedMetricLabel = (metric: string): string =>
  metric
    .replace("pe:eps_unavailable", "P/E thiếu EPS")
    .replace("marketCap:sharesOutstanding_unavailable", "vốn hóa thiếu số cổ phiếu")
    .replace("marketCap:marketPrice_unavailable", "vốn hóa thiếu giá thị trường")
    .replace("bvps:sharesOutstanding_unavailable", "BVPS thiếu số cổ phiếu")
    .replace("pb:sharesOutstanding_unavailable", "P/B thiếu số cổ phiếu")
    .replace("pb:marketPrice_unavailable", "P/B thiếu giá thị trường")
    .replace("ps:marketCap_unavailable", "P/S cần thêm vốn hóa hoặc doanh thu")
    .replaceAll("_", " ");

const coverageLabel = (field: string): string => (field === "operatingCashFlow" ? "CFO" : field);

const sourceDecisionLabel: Record<keyof PortfolioReadinessItem["sourceDecisions"], string> = {
  eps: "EPS",
  sharesOutstanding: "Số cổ phiếu",
  totalDebt: "Nợ vay",
};

const pilotPathLabel = (path: string): string => path.replaceAll("_", " ");

const reviewedSourceStatus = (item: PortfolioReadinessItem): string => {
  const decisions = Object.values(item.sourceDecisions);
  const allReviewedInputsAvailable = decisions.every((decision) => decision.status === "available");
  return allReviewedInputsAvailable
    ? "Bản ghi đã rà soát · dùng cho nghiên cứu · chưa phê duyệt sản xuất"
    : "Đang chờ nguồn đủ kiểm chứng cho một số đầu vào";
};

const sourceDecisionNote = (
  decision: PortfolioReadinessItem["sourceDecisions"][keyof PortfolioReadinessItem["sourceDecisions"]],
): string => {
  if (decision.status === "available") {
    return `Bản ghi đã rà soát · ${decision.unit ?? "đơn vị chưa rõ"} · kỳ ${decision.period ?? "chưa rõ"}`;
  }
  return decision.reason;
};

function ReadinessRow({ item }: { item: PortfolioReadinessItem }) {
  const missingInputs = item.missingInputs.length ? item.missingInputs.join(", ") : "Không còn thiếu đầu vào chính";
  const blockedMetrics = item.blockedMetrics.length
    ? item.blockedMetrics.map(blockedMetricLabel).join("; ")
    : "Không có chỉ số chính đang bị chặn bởi dữ liệu Phase 114";

  return (
    <article className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">{item.ticker}</p>
          <p className="text-xs leading-5 text-muted">
            {item.companyName ?? "Chưa có tên doanh nghiệp"} · {item.exchange ?? "chưa có sàn"} ·{" "}
            {item.industry ?? "chưa có ngành"}
          </p>
        </div>
        <Chip size="sm" variant={statusVariant[item.financials.status]}>
          Tài chính {readableStatus(item.financials.status)}
        </Chip>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Thông tin doanh nghiệp</p>
          <p className="mt-1 text-xs font-semibold text-ink">{readableStatus(item.companyMetadata.status)}</p>
          <p className="text-[11px] leading-5 text-muted">Metadata local phục vụ nghiên cứu, chưa phê duyệt sản xuất.</p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Giá/khối lượng</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {item.technical.provider.toUpperCase()} · {readableStatus(item.technical.status)}
          </p>
          <p className="text-[11px] leading-5 text-muted">Dữ liệu nghiên cứu từ VNStock candidate; chưa phê duyệt sản xuất.</p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Báo cáo tài chính</p>
          <p className="mt-1 text-xs font-semibold text-ink">{readableStatus(item.financials.status)}</p>
          <p className="text-[11px] leading-5 text-muted">Dữ liệu local/research đã có trong hệ thống; chưa phê duyệt sản xuất.</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Số cổ phiếu</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {readableStatus(item.sharesOutstanding.status)} · {valueOrUnavailable(item.sharesOutstanding.value)}
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">EPS</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {readableStatus(item.eps.status)} · {valueOrUnavailable(item.eps.value)}
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Định giá</p>
          <p className="mt-1 text-xs font-semibold text-ink">{readableStatus(item.valuation.status)}</p>
          <p className="text-[11px] leading-5 text-muted">
            P/E: {readableStatus(item.valuation.pe)} · vốn hóa: {readableStatus(item.valuation.marketCap)} · P/B:{" "}
            {readableStatus(item.valuation.pb)}
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Rủi ro</p>
          <p className="mt-1 text-xs font-semibold text-ink">{readableStatus(item.risk.status)}</p>
          <p className="text-[11px] leading-5 text-muted">
            Dòng tiền: {readableStatus(item.risk.cashFlowQuality)} · thanh khoản:{" "}
            {readableStatus(item.risk.liquidityRisk)} · đòn bẩy: {readableStatus(item.risk.leverageRisk)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[3px] border border-border-soft bg-surface px-2 py-2">
        <p className="text-[11px] font-bold text-subtle">Độ phủ báo cáo tài chính</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-5 text-muted">
          {Object.entries(item.financials.coverage).map(([field, coverage]) => (
            <span key={field}>
              {coverageLabel(field)}: {readableStatus(coverage.status)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-[3px] border border-border-soft bg-surface px-2 py-2">
        <p className="text-[11px] font-bold text-subtle">Nguồn đầu vào đã rà soát</p>
        <p className="mt-1 text-[11px] leading-5 text-muted">{reviewedSourceStatus(item)}</p>
        <div className="mt-1 grid gap-1 text-[11px] leading-5 text-muted md:grid-cols-3">
          {Object.entries(item.sourceDecisions).map(([field, decision]) => (
            <p key={field}>
              <span className="font-semibold text-ink">
                {sourceDecisionLabel[field as keyof PortfolioReadinessItem["sourceDecisions"]]}:{" "}
                {readableStatus(decision.status)}
              </span>{" "}
              · {sourceDecisionNote(decision)}
              {decision.pilotChecks?.length ? (
                <span className="mt-1 block text-subtle">
                  Đã kiểm tra {decision.pilotChecks.length} đường:{" "}
                  {decision.pilotChecks
                    .map((check) => `${pilotPathLabel(check.path)}: ${readableStatus(check.status)}`)
                    .join("; ")}
                </span>
              ) : null}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <p className="rounded-[3px] border border-border-soft bg-surface px-2 py-2 text-[11px] leading-5 text-muted">
          <span className="font-bold text-ink">Đầu vào còn thiếu:</span> {missingInputs}
        </p>
        <p className="rounded-[3px] border border-border-soft bg-surface px-2 py-2 text-[11px] leading-5 text-muted">
          <span className="font-bold text-ink">Chỉ số đang chờ:</span> {blockedMetrics}
        </p>
      </div>
    </article>
  );
}

export function PortfolioReadinessPanel({ data }: PortfolioReadinessPanelProps) {
  if (!data) return null;

  return (
    <Card className="border-border">
      <CardHeader
        chip={<Chip variant="warning">Dữ liệu nghiên cứu</Chip>}
        description="Tóm tắt trạng thái dữ liệu cho FPT/MWG/VNM. Lớp này giúp biết dữ liệu nào đã có, dữ liệu nào vẫn cần kiểm tra thêm."
        icon="PR"
        title="Trạng thái dữ liệu danh mục"
      />
      <CardBody className="space-y-3">
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          Hệ thống đã có dữ liệu giá/khối lượng, báo cáo tài chính, nợ vay, EPS và số cổ phiếu cho nhóm mã này.
          Các bản ghi dùng cho nghiên cứu và chưa phê duyệt sản xuất; đây không phải kết luận đầu tư.
        </div>
        <div className="grid gap-3">
          {data.tickers.map((item) => (
            <ReadinessRow key={item.ticker} item={item} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
