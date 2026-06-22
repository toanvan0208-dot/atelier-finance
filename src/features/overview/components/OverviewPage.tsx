"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, EmptyState, LoadingState } from "@/components/ui";
import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import {
  fetchOverviewInputsByTicker,
  OverviewApiError,
  type OverviewApiInputs,
} from "@/lib/data-sources/overview-api-client";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { baseOverviewCaseData } from "../data/overviewCase.data";
import { buildOverviewDeskData } from "../lib/build-overview-desk-data";
import {
  buildOverviewFinancialsRuntimeBoundary,
  type OverviewFinancialsRuntimeBoundary,
} from "../lib/overview-financials-runtime-boundary";
import {
  buildOverviewCrossModuleReadinessSummary,
  type OverviewCrossModuleReadinessSummary,
  type OverviewModuleReadinessItem,
} from "../lib/overview-cross-module-readiness";
import type {
  OverviewActionStatusData,
  OverviewBottleneck,
  OverviewCaseData,
  OverviewCaseDashboardData,
  OverviewNextBestAction,
  OverviewProgressMapItem,
  OverviewProgressStatus,
  OverviewSummaryCard,
  OverviewSupportData,
} from "../types";

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

const progressTone: Record<OverviewProgressStatus, "success" | "warning" | "neutral" | "accent"> = {
  "Hoàn thành sơ bộ": "success",
  "Đang làm": "accent",
  "Thiếu dữ liệu": "warning",
  "Chưa làm": "neutral",
  "Cần quay lại": "warning",
  "Khóa/chưa đủ điều kiện": "neutral",
};

const metadataLabel = (value: string): string => value.replace(/_/g, " ");

const boundaryValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "Chưa đủ dữ liệu";
  return String(value);
};

const userFacingDataModeLabel = (dataMode: string): string => {
  if (dataMode === "local_research") return "Dữ liệu nội bộ phục vụ nghiên cứu";
  if (dataMode === "manual") return "Dữ liệu nhập có kiểm soát";
  if (dataMode === "research_only") return "Dữ liệu nghiên cứu";
  if (dataMode === "sample") return "Dữ liệu minh họa";
  if (dataMode === "unknown") return "Nguồn đang được kiểm tra";
  return "Đã có trong hệ thống";
};

const userFacingSourceTypeLabel = (sourceType: string): string => {
  const normalized = sourceType.toLowerCase();
  if (normalized.includes("manual") || normalized.includes("local")) {
    return "Nguồn dữ liệu nội bộ đã nhập có kiểm soát";
  }
  if (normalized.includes("sample")) return "Dữ liệu minh họa";
  return "Nguồn đang được kiểm tra";
};

const userFacingReviewStatusLabel = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("usable")) return "Đã có dữ liệu, vẫn cần rà soát";
  if (normalized.includes("missing") || normalized.includes("unavailable")) return "Chưa đủ dữ liệu";
  return "Đang được kiểm tra";
};

const readinessSourceLabel: Record<OverviewModuleReadinessItem["sourceStatus"], string> = {
  available: "Đã có thông tin nguồn",
  missing: "Nguồn đang hoàn thiện",
  not_approved: "Chưa phê duyệt sản xuất",
  partial: "Nguồn đang được kiểm tra",
};

const readinessUnitLabel: Record<OverviewModuleReadinessItem["unitStatus"], string> = {
  explicit: "Đơn vị đã rõ",
  invalid: "Đơn vị chưa hợp lệ",
  not_applicable: "Không áp dụng",
  partial: "Một phần đơn vị đã rõ",
  unknown: "Đơn vị đang được kiểm tra",
};

const readinessBlockedReasonLabel = (reason: string): string => {
  const normalized = reason.toLowerCase();
  if (normalized.includes("unit")) return "Đơn vị dữ liệu cần kiểm tra";
  if (normalized.includes("missing")) return "Thiếu dữ liệu cần thiết";
  if (normalized.includes("fallback") || normalized.includes("sample")) return "Đang dùng dữ liệu minh họa";
  if (normalized.includes("source") || normalized.includes("approved") || normalized.includes("canclaim")) {
    return "Chưa đủ điều kiện xác nhận sản xuất";
  }
  return "Cần kiểm tra thêm";
};

const readinessStatusLabel: Record<OverviewModuleReadinessItem["status"], string> = {
  blocked: "Chua san sang",
  boundary_only: "Boundary only",
  partial: "Can kiem tra them",
};

const readinessStatusTone: Record<OverviewModuleReadinessItem["status"], "warning" | "neutral" | "accent"> = {
  blocked: "warning",
  boundary_only: "neutral",
  partial: "accent",
};

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
      temporaryThesis:
        "Overview dang tong hop trang thai du lieu hien co tu database local, gom ho so cong ty, BCTC moi nhat va gia thi truong moi nhat.",
      mainWarning:
        result.missingReasons.length > 0
          ? `Con thieu du lieu: ${result.missingReasons.join(", ")}.`
          : "Du lieu hien co van can kiem tra nguon, moc thoi gian va trang thai readiness.",
    },
    progressMap: data.progressMap.map((item) => ({
      ...item,
      summary:
        item.id === "financials"
          ? "Doc tu API financials latest."
          : item.id === "valuation"
            ? "Doc tu financials latest va market-prices latest."
            : item.id === "risk" || item.id === "technical" || item.id === "checklist"
              ? "Chua noi API trong phase nay."
              : "Chua doi nguon du lieu trong phase nay.",
    })),
    support: {
      watchlist: [
        {
          ticker,
          status: metadataLabel(result.metadata.readiness),
          note: "Du lieu local can duoc xem cung metadata nguon.",
        },
      ],
      learning: [
        {
          title: "Kiem tra nguon va moc du lieu",
          reason: "Overview dang uu tien doc metadata truoc khi mo module chi tiet.",
          moduleKey: "learning",
        },
      ],
      profile: {
        status: "needs_review",
        message: "Ho so phan tich khong duoc dung de thay the source/readiness cua du lieu.",
        moduleKey: "route-config",
      },
    },
  };
};

function CurrentCaseHero({ data }: { data: OverviewCaseData }) {
  return (
    <section className="overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-soft">
      <div className="px-6 py-6 md:px-7 md:py-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="neutral">Case đang phân tích</Chip>
              <Chip size="sm" variant="warning">{data.caseStatus}</Chip>
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              {data.ticker} · {data.companyName} · {data.industry}
            </p>
          </div>
          <p className="text-xs font-semibold leading-5 text-muted md:max-w-[260px] md:text-right">
            Giai đoạn hiện tại: {data.currentStage}
          </p>
        </div>

        <div className="mt-5 max-w-3xl">
          <h1 className="font-brand text-3xl font-bold leading-tight text-ink md:text-[40px]">
            {data.ticker} đang kiểm chứng dữ liệu trước khi định giá
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Case đã có luận điểm ban đầu, nhưng độ tin cậy còn phụ thuộc vào dòng tiền, tồn kho, biên lợi nhuận và vùng định giá.
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <div className="border-l-[3px] border-accent pl-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Thesis tạm thời</p>
            <p className="mt-2 text-base font-semibold leading-7 text-ink">{data.temporaryThesis}</p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Cảnh báo chính</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink">{data.mainWarning}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Chưa nên làm</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.notReadyFor.map((item) => (
                  <span
                    key={item}
                    className="rounded-[999px] border border-border-soft bg-surface-soft px-3 py-1 text-xs font-semibold leading-5 text-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
          <Link
            className="inline-flex h-9 items-center justify-center rounded-[3px] border-[1.5px] border-border bg-surface px-3.5 text-sm font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-surface-hover"
            href="/data-import"
          >
            Mở workspace
          </Link>
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

function OverviewFinancialsRuntimeNote({ boundary }: { boundary: OverviewFinancialsRuntimeBoundary }) {
  const fields = [
    ["Trạng thái tổng quan", boundary.consumesFinancialsRuntime ? "Đang dùng dữ liệu tài chính có kiểm soát" : "Nguồn đang hoàn thiện"],
    ["Nguồn tài chính", boundary.consumesFinancialsRuntime && !boundary.fallbackUsed ? "Nguồn dữ liệu nội bộ đã nhập có kiểm soát" : "Nguồn đang được kiểm tra"],
    ["Phạm vi sử dụng", "Dữ liệu nghiên cứu, chưa phê duyệt sản xuất"],
    ["Mức độ xác nhận", "Chưa đủ điều kiện xác nhận toàn bộ"],
  ] as const;
  const snapshotFields = [
    ["Mã", boundary.snapshotFields.ticker],
    ["Kỳ dữ liệu", boundary.snapshotFields.period],
    ["Doanh thu", boundary.snapshotFields.revenue],
    ["Lợi nhuận sau thuế", boundary.snapshotFields.netIncome],
    ["Dòng tiền hoạt động", boundary.snapshotFields.operatingCashFlow],
    ["Tổng tài sản", boundary.snapshotFields.totalAssets],
    ["Vốn chủ sở hữu", boundary.snapshotFields.equity],
  ] as const;

  return (
    <section className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">Minh bạch nguồn dữ liệu</Chip>
            <Chip variant="neutral">Nguồn đang được kiểm tra</Chip>
            <Chip variant="neutral">Dữ liệu nghiên cứu, chưa phê duyệt sản xuất</Chip>
            <Chip variant="neutral">Kết nối tài chính một phần</Chip>
          </div>
          <p className="mt-3 font-semibold">Dữ liệu tài chính hỗ trợ phần tổng quan nhưng chưa đủ để xác nhận toàn bộ module.</p>
          <p className="mt-1">
            Overview dang dung nguon hon hop: API bridge rieng, cac phan ho tro hien co, va Financials runtime metadata neu co.
          </p>
          <p className="mt-1">
            Financials local research data chua duoc duyet lam nguon san xuat. Gia tri thieu giu la null/unavailable, khong thay bang 0.
          </p>
          {boundary.missingFields.length > 0 ? (
            <p className="mt-2">Một số trường tài chính còn thiếu và được giữ ở trạng thái Chưa đủ dữ liệu.</p>
          ) : null}
          {boundary.warnings.length > 0 ? (
            <p className="mt-2">Nguồn dữ liệu đang được kiểm tra; không nên kết luận vội từ phần dữ liệu hiện có.</p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-3 text-xs lg:min-w-[360px]">
          <dl className="grid gap-2">
            {fields.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{boundaryValue(value)}</dd>
              </div>
            ))}
          </dl>
          <dl className="grid gap-2 border-t border-[#E8CC82] pt-3">
            {snapshotFields.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{boundaryValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function OverviewCrossModuleReadiness({ summary }: { summary: OverviewCrossModuleReadinessSummary }) {
  return (
    <Card data-testid="overview-cross-module-readiness">
      <CardHeader
        title={summary.title}
        description={summary.description}
        chip={<Chip variant="warning">Dữ liệu nghiên cứu, chưa phê duyệt sản xuất</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-5">
          {summary.items.map((item) => (
            <div key={item.moduleKey} className="rounded-[5px] border border-border-soft bg-surface-soft p-3">
              <div className="flex min-h-[54px] flex-col justify-between gap-2">
                <p className="text-sm font-extrabold text-ink">{item.label}</p>
                <Chip size="sm" variant={readinessStatusTone[item.status]}>
                  {readinessStatusLabel[item.status]}
                </Chip>
              </div>
              <dl className="mt-3 grid gap-1.5 text-[11px] leading-5 text-muted">
                <div className="flex justify-between gap-2">
                  <dt className="font-bold text-subtle">Phạm vi</dt>
                  <dd className="break-words text-right">{userFacingDataModeLabel(item.dataMode)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-bold text-subtle">Nguồn</dt>
                  <dd className="break-words text-right">{readinessSourceLabel[item.sourceStatus]}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-bold text-subtle">Đơn vị</dt>
                  <dd className="break-words text-right">{readinessUnitLabel[item.unitStatus]}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-5 text-muted">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.blockedReasons.slice(0, 3).map((reason) => (
                  <Chip key={reason} size="sm" variant="neutral">
                    {readinessBlockedReasonLabel(reason)}
                  </Chip>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-semibold leading-5 text-muted">
                Next: {item.nextChecks.slice(0, 2).join(" | ")}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {summary.safeNotes.map((note) => (
            <p key={note} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
              {note}
            </p>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function NextBestActionCard({
  data,
  onNavigate,
}: {
  data: OverviewNextBestAction;
  onNavigate: (key: string) => void;
}) {
  return (
    <Card className="border-[2px] border-border">
      <CardHeader
        title="Việc cần làm tiếp theo"
        description={data.module}
        chip={<Chip variant="warning">Ưu tiên {data.priority}</Chip>}
      />
      <CardBody className="space-y-4">
        <div>
          <h2 className="font-brand text-xl font-bold leading-7 text-ink">{data.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{data.reason}</p>
        </div>
        <Button className="w-full" onClick={() => onNavigate(data.cta.moduleKey)}>
          {data.cta.label}
        </Button>
        <div className="space-y-2 border-t border-border-soft pt-3">
          {data.secondaryActions.map((action) => (
            <Button
              key={action.title}
              className="w-full"
              size="sm"
              variant="ghost"
              onClick={() => onNavigate(action.moduleKey)}
            >
              {action.title}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function OverviewSummaryCards({
  data,
  onNavigate,
}: {
  data: OverviewSummaryCard[];
  onNavigate: (key: string) => void;
}) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Tóm tắt từ financial logic"
        description="Chỉ hiển thị các kết luận ngắn để điều hướng; chi tiết vẫn nằm ở từng module nguồn."
      />
      <CardBody>
        <div className="grid gap-3 lg:grid-cols-4">
          {data.map((item) => (
            <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <Chip size="sm" variant={item.status === "Chưa đủ dữ liệu" ? "warning" : "neutral"}>
                  {item.status}
                </Chip>
              </div>
              <p className="mt-2 text-lg font-bold text-ink">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{item.summary}</p>
              {item.missingFields.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.missingFields.slice(0, 4).map((field) => (
                    <Chip key={field} size="sm" variant="neutral">{field}</Chip>
                  ))}
                </div>
              ) : null}
              {item.warnings[0] ? (
                <p className="mt-3 rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                  {item.warnings[0]}
                </p>
              ) : null}
              <Button className="mt-4 w-full" size="sm" variant="secondary" onClick={() => onNavigate(item.moduleKey)}>
                Mở module nguồn
              </Button>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function MissingDataBottlenecks({
  data,
  onNavigate,
}: {
  data: OverviewBottleneck[];
  onNavigate: (key: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Đang thiếu dữ liệu gì?"
        description="Các điểm nghẽn làm case chưa đủ tin cậy, kèm hậu quả nếu bỏ qua."
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((item) => (
            <div key={item.title} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <Chip size="sm" variant={item.priority === "Cao" ? "warning" : "neutral"}>
                  {item.priority}
                </Chip>
              </div>
              <p className="mt-3 text-xs font-bold uppercase text-subtle">Vì sao quan trọng</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.whyItMatters}</p>
              <p className="mt-3 text-xs font-bold uppercase text-subtle">Nếu thiếu thì sao</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.consequence}</p>
              <Button className="mt-4" size="sm" variant="secondary" onClick={() => onNavigate(item.moduleKey)}>
                Mở {item.targetModule}
              </Button>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function AnalysisProgressMap({
  data,
  onNavigate,
}: {
  data: OverviewProgressMapItem[];
  onNavigate: (key: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Đã đi đến đâu trong lộ trình?"
        description="Timeline chỉ để điều hướng, không thay thế nội dung chi tiết của từng module."
      />
      <CardBody>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {data.map((item, index) => (
            <button
              key={item.id}
              className="min-w-[210px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-accent-soft"
              type="button"
              onClick={() => onNavigate(item.moduleKey)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-[3px] border border-border bg-surface text-[11px] font-bold text-ink">
                  {index + 1}
                </span>
                <Chip size="sm" variant={progressTone[item.status]}>{item.status}</Chip>
              </div>
              <p className="mt-3 text-sm font-bold leading-5 text-ink">{item.title}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{item.summary}</p>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function CurrentActionStatus({ data }: { data: OverviewActionStatusData }) {
  const groups = [
    { title: "Có thể làm ngay", items: data.canDo, tone: "success" as const },
    { title: "Chưa nên làm vội", items: data.shouldNotDoYet, tone: "warning" as const },
    { title: "Điều kiện mở bước tiếp theo", items: data.unlockConditions, tone: "neutral" as const },
  ];

  return (
    <Card>
      <CardHeader
        title="Hiện tại có thể làm gì?"
        description="Trạng thái trong hệ thống, chỉ là dữ liệu tham khảo."
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <Chip size="sm" variant={group.tone}>{group.title}</Chip>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <p key={item} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="rounded-[4px] border border-border-soft bg-accent-soft px-4 py-3 text-sm font-semibold leading-6 text-ink">
          {data.conclusion}
        </p>
      </CardBody>
    </Card>
  );
}

function OverviewSupportPanel({
  data,
  onNavigate,
}: {
  data: OverviewSupportData;
  onNavigate: (key: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Hỗ trợ thêm"
        description="Watchlist, học tập và hồ sơ chỉ là phần phụ trợ cho case chính."
      />
      <CardBody>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Watchlist cần chú ý</p>
            <div className="mt-3 space-y-2">
              {data.watchlist.map((item) => (
                <p key={item.ticker} className="text-xs leading-5 text-muted">
                  <strong className="text-ink">{item.ticker}</strong>: {item.status}, {item.note}
                </p>
              ))}
            </div>
            <Button className="mt-4" size="sm" variant="secondary" onClick={() => onNavigate("watchlist")}>
              Mở Watchlist
            </Button>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Bài học gợi ý</p>
            <div className="mt-3 space-y-3">
              {data.learning.map((item) => (
                <button
                  key={item.title}
                  className="block w-full rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-left transition hover:border-border"
                  type="button"
                  onClick={() => onNavigate(item.moduleKey)}
                >
                  <span className="block text-xs font-bold text-ink">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{item.reason}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">Hồ sơ/lộ trình cá nhân</p>
              <Chip size="sm" variant="warning">{data.profile.status}</Chip>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">{data.profile.message}</p>
            <Button className="mt-4" size="sm" variant="secondary" onClick={() => onNavigate(data.profile.moduleKey)}>
              Hoàn thiện hồ sơ
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function OverviewPage({ initialFinancialsRuntimeData, onNavigate }: OverviewPageProps) {
  const [tickerInput, setTickerInput] = useState("FPTLAB");
  const [request, setRequest] = useState({ ticker: "FPTLAB", id: 0 });
  const [bridgeState, setBridgeState] = useState<OverviewBridgeState>({ status: "loading" });
  const activeTicker = request.ticker;
  const financialsRuntimeBoundary = useMemo(
    () => buildOverviewFinancialsRuntimeBoundary(initialFinancialsRuntimeData),
    [initialFinancialsRuntimeData],
  );
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

  const metadataChips = useMemo(() => {
    if (bridgeState.status !== "ready" && bridgeState.status !== "insufficient") return [];
    const { metadata } = bridgeState.result;
    return [
      `Phạm vi: ${userFacingDataModeLabel(metadata.dataMode)}`,
      `Nguồn: ${userFacingSourceTypeLabel(metadata.sourceType)}`,
      `Chất lượng: ${userFacingReviewStatusLabel(metadata.qualityStatus)}`,
      `Trạng thái: ${userFacingReviewStatusLabel(metadata.readiness)}`,
      metadata.fallback ? "Đang dùng dữ liệu minh họa dự phòng" : "Không dùng dữ liệu minh họa thay thế",
    ];
  }, [bridgeState]);

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
              <p className="text-xs font-bold uppercase text-muted">Overview API bridge</p>
              <label className="mt-2 block text-sm font-extrabold text-ink" htmlFor="overview-ticker-input">
                Ticker local
              </label>
              <input
                className="mt-2 h-9 w-full rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-accent sm:w-[180px]"
                id="overview-ticker-input"
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value)}
              />
            </div>
            <Button isLoading={bridgeState.status === "loading"} type="submit" variant="secondary">
              Tải từ API
            </Button>
          </form>
        </CardBody>
      </Card>

      {bridgeState.status === "loading" ? (
        <LoadingState
          description={`Dang doc du lieu tong quan da persist cho ${activeTicker}.`}
          title="Dang tai Overview tu API"
        />
      ) : null}

      {bridgeState.status === "empty" ? (
        <EmptyState
          description={`Thieu ${bridgeState.missingReasons.join(", ")} cho ${bridgeState.ticker}. Khong dung du lieu mock de thay the.`}
          icon="O"
          title="Chua co du lieu nen cho Overview"
        />
      ) : null}

      {bridgeState.status === "error" ? (
        <EmptyState
          description={`${bridgeState.message} Khong dung du lieu mock de thay the.`}
          icon="!"
          title={`Khong tai duoc Overview cho ${bridgeState.ticker}`}
        />
      ) : null}

      {bridgeState.status === "ready" || bridgeState.status === "insufficient" ? (
        <>
          <DataQualityBanner {...bridgeState.result.dataQuality} />
          <OverviewFinancialsRuntimeNote boundary={financialsRuntimeBoundary} />
          <OverviewCrossModuleReadiness summary={crossModuleReadiness} />
          <div className="flex flex-wrap gap-2">
            {metadataChips.map((chip) => (
              <Chip key={chip} variant="neutral">
                {chip}
              </Chip>
            ))}
          </div>
          {bridgeState.status === "insufficient" ? (
            <section className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3 text-sm font-bold leading-6 text-ink">
              Du lieu chua du de tong hop day du Overview: {bridgeState.result.missingReasons.join(", ")}.
              Cac phan phu thuoc du lieu thieu se o trang thai can kiem tra them.
            </section>
          ) : null}
          <ManualDataImportCta />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
            <CurrentCaseHero data={bridgeState.data.activeCase} />
            <NextBestActionCard data={bridgeState.data.nextBestAction} onNavigate={onNavigate} />
          </div>
          <OverviewSummaryCards data={bridgeState.data.summaryCards} onNavigate={onNavigate} />
          <MissingDataBottlenecks data={bridgeState.data.missingData} onNavigate={onNavigate} />
          <AnalysisProgressMap data={bridgeState.data.progressMap} onNavigate={onNavigate} />
          <CurrentActionStatus data={bridgeState.data.actionStatus} />
          <OverviewSupportPanel data={bridgeState.data.support} onNavigate={onNavigate} />
          <p className="rounded-[4px] border border-border-soft bg-surface px-4 py-3 text-sm leading-6 text-muted">
            {bridgeState.data.disclaimer}
          </p>
        </>
      ) : null}
    </div>
  );
}
