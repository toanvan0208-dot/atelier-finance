"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, EmptyState, LoadingState } from "@/components/ui";
import type { AuthUser } from "@/lib/auth/session";
import {
  fetchOverviewInputsByTicker,
  OverviewApiError,
  type OverviewApiInputs,
} from "@/lib/data-sources/overview-api-client";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import type {
  PortfolioReadinessItem,
  PortfolioReadinessResult,
} from "@/features/watchlist/lib/load-portfolio-readiness";
import type { UserWatchlistItem } from "@/features/watchlist/lib/load-user-watchlist-items";
import { baseOverviewCaseData } from "../data/overviewCase.data";
import { buildOverviewDeskData } from "../lib/build-overview-desk-data";
import {
  buildOverviewCrossModuleReadinessSummary,
  type OverviewCrossModuleReadinessSummary,
  type OverviewModuleReadinessItem,
} from "../lib/overview-cross-module-readiness";
import type { OverviewBottleneck, OverviewCaseDashboardData, OverviewCaseData } from "../types";

type OverviewPageProps = {
  currentUser?: AuthUser | null;
  initialFinancialsRuntimeData?: FinancialsRuntimeData;
  initialWatchlistItems?: UserWatchlistItem[];
  onNavigate: (key: string) => void;
  portfolioReadiness?: PortfolioReadinessResult;
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

const userLabelFrom = (user?: AuthUser | null): string => {
  if (!user) return "khách mới";
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split("@")[0] ?? user.email;
  return "tài khoản của bạn";
};

const friendlyStatus = (item: OverviewModuleReadinessItem): string => {
  if (item.status === "blocked") return "Cần bổ sung dữ liệu";
  if (item.status === "boundary_only") return "Đang xác nhận";
  if (item.status === "partial") return "Có thể đọc sơ bộ";
  return "Đang rà soát";
};

const friendlyDetail = (item: OverviewModuleReadinessItem): string => {
  if (item.moduleKey === "financials") return "Đọc sức khỏe tài chính và các trường còn thiếu.";
  if (item.moduleKey === "valuation") return "Chỉ hiện tỷ số có đủ dữ liệu, không tạo vùng giá.";
  if (item.moduleKey === "technical") return "Quan sát giá và thanh khoản để kiểm tra thời điểm.";
  if (item.moduleKey === "macro") return "Đặt bối cảnh thị trường trước khi đi tiếp.";
  return "Đọc ngành để hiểu lực đẩy và rủi ro bên ngoài doanh nghiệp.";
};

const qualityTone = (item: OverviewModuleReadinessItem): string => {
  if (item.status === "blocked") return "border-amber-300 bg-amber-50 text-amber-950";
  if (item.status === "boundary_only") return "border-sky-200 bg-sky-50 text-sky-950";
  return "border-emerald-200 bg-emerald-50 text-emerald-950";
};

const readinessScore = (item: PortfolioReadinessItem): number => {
  const checks = [
    item.companyMetadata.status === "available",
    item.technical.status === "available" || item.technical.status === "partial",
    item.financials.status === "available" || item.financials.status === "partial",
    item.eps.status === "available",
    item.sharesOutstanding.status === "available",
    item.missingInputs.length === 0,
  ];
  return checks.filter(Boolean).length;
};

const friendlyFieldLabel = (field: string): string => {
  const normalized = field.toLowerCase();
  if (normalized.includes("eps")) return "EPS";
  if (normalized.includes("sharesoutstanding")) return "Số cổ phiếu lưu hành";
  if (normalized.includes("totalliabilities")) return "Tổng nợ phải trả";
  if (normalized.includes("totalassets")) return "Tổng tài sản";
  if (normalized.includes("totalequity")) return "Vốn chủ sở hữu";
  if (normalized.includes("interestexpense")) return "Chi phí lãi vay";
  if (normalized.includes("cashandequivalents")) return "Tiền và tương đương tiền";
  if (normalized.includes("previousrevenue")) return "Doanh thu kỳ trước";
  if (normalized.includes("revenue")) return "Doanh thu";
  if (normalized.includes("netprofit")) return "Lợi nhuận sau thuế";
  if (normalized.includes("marketprice")) return "Giá đóng cửa";
  if (normalized.includes("totaldebt")) return "Nợ vay";
  return field.replaceAll("_", " ");
};

const displayIndustry = (industry: string | null | undefined): string => {
  if (!industry || industry.toLowerCase() === "unknown") return "Ngành chưa xác nhận";
  return industry;
};

const missingSummary = (bottlenecks: OverviewBottleneck[]): string[] => {
  if (bottlenecks.length === 0) {
    return ["Chưa thấy điểm thiếu lớn trong dữ liệu hiện tại."];
  }

  return bottlenecks.slice(0, 4).map((item) => friendlyFieldLabel(item.title));
};

export function MvpCurrentTicker({ activeCase }: { activeCase: OverviewCaseData }) {
  return (
    <OverviewHero
      activeCase={activeCase}
      currentUser={null}
      missingFields={[]}
      onNavigate={() => undefined}
      portfolioReadiness={undefined}
      watchlistItems={[]}
    />
  );
}

export function MvpAvailableData({ summary }: { summary: OverviewCrossModuleReadinessSummary }) {
  return <DataQualityBoard summary={summary} onNavigate={() => undefined} />;
}

export function MvpMissingData({ bottlenecks }: { bottlenecks: OverviewBottleneck[] }) {
  return <MissingDataStrip bottlenecks={bottlenecks} />;
}

export function MvpNextSteps({ onNavigate }: { onNavigate: (key: string) => void }) {
  return <NextActionRail activeTicker="FPT" onNavigate={onNavigate} />;
}

function OverviewTickerSearch({
  isLoading,
  onSubmit,
  setTickerInput,
  tickerInput,
}: {
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setTickerInput: (value: string) => void;
  tickerInput: string;
}) {
  return (
    <form
      className="flex flex-col gap-3 rounded-[8px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:flex-row sm:items-end"
      onSubmit={onSubmit}
    >
      <label className="min-w-0 flex-1">
        <span className="text-[11px] font-black uppercase tracking-[0.04em] text-slate-500">
          Mã đang xem
        </span>
        <input
          className="mt-2 h-11 w-full rounded-[6px] border border-slate-300 bg-slate-50 px-3 text-base font-black uppercase text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
          id="overview-ticker-input"
          value={tickerInput}
          onChange={(event) => setTickerInput(event.target.value)}
        />
      </label>
      <Button isLoading={isLoading} type="submit" variant="secondary" className="h-11 rounded-[6px]">
        Cập nhật
      </Button>
    </form>
  );
}

function OverviewHero({
  activeCase,
  currentUser,
  missingFields,
  onNavigate,
  portfolioReadiness,
  watchlistItems,
}: {
  activeCase: OverviewCaseData;
  currentUser?: AuthUser | null;
  missingFields: string[];
  onNavigate: (key: string) => void;
  portfolioReadiness?: PortfolioReadinessResult;
  watchlistItems: UserWatchlistItem[];
}) {
  const userLabel = userLabelFrom(currentUser);
  const watchlistCount = watchlistItems.length;
  const readyCount =
    portfolioReadiness?.tickers
      .filter((item) => watchlistItems.some((watchlistItem) => watchlistItem.ticker.toUpperCase() === item.ticker.toUpperCase()))
      .filter((item) => readinessScore(item) >= 4).length ?? 0;

  return (
    <section className="overflow-hidden rounded-[8px] border-[1.5px] border-slate-950 bg-white shadow-[5px_5px_0_rgb(15_23_42_/_0.24)]">
      <div className="grid gap-0 2xl:grid-cols-[minmax(0,1.28fr)_380px]">
        <div className="relative min-h-[330px] px-6 py-7 sm:px-8 lg:px-9">
          <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border border-amber-300 bg-amber-200/40 blur-2xl lg:block" />
          <p className="text-xs font-black uppercase tracking-[0.04em] text-slate-500">
            Tổng quan hôm nay
          </p>
          <h1 className="mt-4 max-w-[760px] font-brand text-4xl font-black leading-[1.05] text-slate-950 md:text-5xl">
            {userLabel}, nên nhìn vào {activeCase.ticker} ở đâu trước?
          </h1>
          <p className="mt-5 max-w-[680px] text-base leading-7 text-slate-600">
            Màn này gom các đầu mối quan trọng nhất của tài khoản: mã đang xem, tình trạng dữ liệu,
            watchlist và bước phân tích tiếp theo. Tất cả chỉ để học và tham khảo.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <HeroMetric label="Đang xem" value={activeCase.ticker} />
            <HeroMetric label="Theo dõi" value={`${watchlistCount} mã`} />
            <HeroMetric label="Đọc tiếp được" value={`${readyCount} mã`} />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              className="rounded-[6px] border-[1.5px] border-slate-950 bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_rgb(15_23_42_/_0.20)] transition hover:-translate-y-0.5"
              type="button"
              onClick={() => onNavigate("financials")}
            >
              Xem BCTC của {activeCase.ticker}
            </button>
            <button
              className="rounded-[6px] border-[1.5px] border-slate-950 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
              type="button"
              onClick={() => onNavigate("watchlist")}
            >
              Mở Watchlist
            </button>
            <button
              className="rounded-[6px] border-[1.5px] border-slate-950 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
              type="button"
              onClick={() => onNavigate("simulation")}
            >
              Mở Mô phỏng
            </button>
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-amber-50 p-5 text-slate-950 2xl:border-l 2xl:border-t-0">
          <div className="rounded-[8px] border border-amber-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">
              Hồ sơ đang đọc
            </p>
            <h2 className="mt-3 text-2xl font-black">{activeCase.companyName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{displayIndustry(activeCase.industry)}</p>
          </div>

          <div className="mt-4 rounded-[8px] border border-amber-200 bg-white p-4 text-slate-950">
            <p className="text-sm font-black">Cần để ý</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {missingFields.slice(0, 3).map((field) => (
                <li key={field} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Bối cảnh", "Số liệu", "Rủi ro"].map((label, index) => (
              <div key={label} className="rounded-[6px] border border-amber-200 bg-white px-3 py-3">
                <div className="h-1.5 rounded-full bg-amber-100">
                  <div
                    className="h-1.5 rounded-full bg-amber-300"
                    style={{ width: `${(index + 2) * 24}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-black uppercase tracking-[0.04em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function WatchlistPreview({
  items,
  onNavigate,
  portfolioReadiness,
}: {
  items: UserWatchlistItem[];
  onNavigate: (key: string) => void;
  portfolioReadiness?: PortfolioReadinessResult;
}) {
  const readinessByTicker = new Map(
    (portfolioReadiness?.tickers ?? []).map((item) => [item.ticker.toUpperCase(), item]),
  );

  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">Cổ phiếu đang theo dõi</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Các mã này lấy từ dữ liệu theo dõi hiện có. Danh mục riêng theo từng tài khoản sẽ được lưu ở bước sau.
          </p>
        </div>
        <button className="text-sm font-black text-slate-950 underline" type="button" onClick={() => onNavigate("watchlist")}>
          Mở
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length > 0 ? (
          items.slice(0, 3).map((item) => {
            const ticker = item.ticker.toUpperCase();
            const readiness = readinessByTicker.get(ticker);
            const score = readiness ? readinessScore(readiness) : 0;
            const missingInputs = readiness?.missingInputs ?? [];
            return (
              <button
                key={ticker}
                className="grid gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-950 hover:bg-white sm:grid-cols-[92px_minmax(0,1fr)_120px]"
                type="button"
                onClick={() => onNavigate("watchlist")}
              >
                <div>
                  <p className="text-xl font-black text-slate-950">{ticker}</p>
                  <p className="text-xs font-bold text-slate-500">{item.company?.exchange ?? "Sàn chưa rõ"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-950">{item.company?.companyName ?? "Đang cập nhật tên doanh nghiệp"}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {missingInputs.length > 0
                      ? `Cần bổ sung: ${missingInputs.slice(0, 2).map(friendlyFieldLabel).join(", ")}`
                      : item.notes ?? "Có thể đọc tiếp với dữ liệu hiện có."}
                  </p>
                </div>
                <div className="self-center">
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-amber-300" style={{ width: `${Math.min(score * 16, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-black text-slate-500">{score}/6 mức sẵn sàng</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Chưa có dữ liệu watchlist để hiển thị tại đây.
          </div>
        )}
      </div>
    </section>
  );
}

function NextActionRail({ activeTicker, onNavigate }: { activeTicker: string; onNavigate: (key: string) => void }) {
  const actions = [
    {
      key: "macro",
      title: "Đặt bối cảnh",
      body: "Xem vĩ mô để biết điều gì có thể làm nhiều ngành cùng thay đổi.",
    },
    {
      key: "financials",
      title: `Đọc số liệu ${activeTicker}`,
      body: "Kiểm tra doanh thu, lợi nhuận, dòng tiền và các trường còn thiếu.",
    },
    {
      key: "valuation",
      title: "Xem tỷ số định giá",
      body: "Chỉ đọc tỷ số có đủ đầu vào. Thiếu dữ liệu thì hiển thị N/A.",
    },
    {
      key: "risk",
      title: "Kiểm tra điều có thể sai",
      body: "Đặt câu hỏi về nợ vay, dòng tiền, minh bạch và chất lượng dữ liệu.",
    },
  ];

  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <h2 className="text-xl font-black text-slate-950">Hôm nay nên nhìn gì?</h2>
      <div className="mt-5 grid gap-3 2xl:grid-cols-2">
        {actions.map((action, index) => (
          <button
            key={action.key}
            className="group rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-950 hover:bg-white"
            type="button"
            onClick={() => onNavigate(action.key)}
          >
            <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-amber-300 text-sm font-black text-slate-950">
              {index + 1}
            </span>
            <p className="mt-4 font-black text-slate-950">{action.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{action.body}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function DataQualityBoard({
  onNavigate,
  summary,
}: {
  onNavigate: (key: string) => void;
  summary: OverviewCrossModuleReadinessSummary;
}) {
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Tình trạng dữ liệu</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Hiển thị bằng ngôn ngữ người dùng. Các trạng thái nội bộ được ẩn khỏi màn hình này.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
        {summary.items.map((item) => (
          <button
            key={item.moduleKey}
            className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-950 hover:bg-white"
            type="button"
            onClick={() => onNavigate(item.moduleKey)}
          >
            <span className={`inline-flex rounded-[4px] border px-2 py-1 text-[11px] font-black ${qualityTone(item)}`}>
              {friendlyStatus(item)}
            </span>
            <h3 className="mt-4 font-black text-slate-950">{item.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{friendlyDetail(item)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function SimulationPreview({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <section className="rounded-[8px] border border-amber-300 bg-amber-50 p-5 shadow-[0_16px_40px_rgba(180,83,9,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[660px]">
          <h2 className="text-xl font-black text-slate-950">Mô phỏng kịch bản</h2>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            Dùng để luyện quy trình và ghi lại giả định. Phần này không biến kết quả thành quyết định đầu tư.
          </p>
        </div>
        <button
          className="rounded-[6px] border-[1.5px] border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          type="button"
          onClick={() => onNavigate("simulation")}
        >
          Vào Mô phỏng
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Thesis", "Giả định", "Nhật ký"].map((label, index) => (
          <div key={label} className="rounded-[8px] border border-amber-200 bg-white p-4">
            <div className="h-2 rounded-full bg-amber-100">
              <div className="h-2 rounded-full bg-amber-300" style={{ width: `${44 + index * 18}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-slate-950">{label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Cần ghi rõ trước khi đánh giá kết quả.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MissingDataStrip({ bottlenecks }: { bottlenecks: OverviewBottleneck[] }) {
  const missing = missingSummary(bottlenecks);
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <h2 className="text-xl font-black text-slate-950">Những điểm cần bổ sung</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {missing.map((item) => (
          <span key={item} className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            {item}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Nếu trường quan trọng bị thiếu, hệ thống giữ N/A thay vì tự đoán hoặc điền 0.
      </p>
    </section>
  );
}

function ManualDataImportCta() {
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Bổ sung dữ liệu thủ công</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Dùng khi bạn có bảng dữ liệu riêng và muốn xem trước chất lượng dữ liệu.
          </p>
        </div>
        <a
          className="inline-flex h-10 items-center justify-center rounded-[6px] border-[1.5px] border-slate-950 bg-white px-4 text-sm font-black text-slate-950 shadow-[3px_3px_0_rgb(15_23_42_/_0.20)] transition hover:-translate-y-0.5"
          href="/data-import"
        >
          Nhập dữ liệu
        </a>
      </div>
    </section>
  );
}

export function OverviewPage({
  currentUser,
  initialFinancialsRuntimeData,
  initialWatchlistItems = [],
  onNavigate,
  portfolioReadiness,
}: OverviewPageProps) {
  const initialTicker = initialWatchlistItems[0]?.ticker ?? "HPG";
  const [tickerInput, setTickerInput] = useState(initialTicker);
  const [request, setRequest] = useState({ ticker: initialTicker, id: 0 });
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
            : "Không tải được dữ liệu tổng quan từ hệ thống.";
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

  const readyData =
    bridgeState.status === "ready" || bridgeState.status === "insufficient" ? bridgeState.data : null;
  const missingFields = readyData ? missingSummary(readyData.missingData) : ["Đang tải dữ liệu nền."];

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <OverviewTickerSearch
        isLoading={bridgeState.status === "loading"}
        onSubmit={submitTicker}
        setTickerInput={setTickerInput}
        tickerInput={tickerInput}
      />

      {bridgeState.status === "loading" ? (
        <LoadingState
          description={`Đang tải dữ liệu tổng quan cho ${activeTicker}.`}
          title="Đang chuẩn bị tổng quan"
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

      {readyData ? (
        <>
          {bridgeState.status === "insufficient" ? (
            <div className="rounded-[8px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950">
              Dữ liệu chưa đầy đủ, một số mục sẽ hiển thị N/A hoặc cần bổ sung.
            </div>
          ) : null}

          <OverviewHero
            activeCase={readyData.activeCase}
            currentUser={currentUser}
            missingFields={missingFields}
            onNavigate={onNavigate}
            portfolioReadiness={portfolioReadiness}
            watchlistItems={initialWatchlistItems}
          />

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.1fr)_390px]">
            <div className="space-y-5">
              <NextActionRail activeTicker={readyData.activeCase.ticker} onNavigate={onNavigate} />
              <DataQualityBoard summary={crossModuleReadiness} onNavigate={onNavigate} />
              <SimulationPreview onNavigate={onNavigate} />
            </div>
            <div className="space-y-5">
              <WatchlistPreview
                items={initialWatchlistItems}
                onNavigate={onNavigate}
                portfolioReadiness={portfolioReadiness}
              />
              <MissingDataStrip bottlenecks={readyData.missingData} />
              <ManualDataImportCta />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
