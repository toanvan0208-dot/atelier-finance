"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, SectionHeader } from "@/components/ui";
import type {
  ScreeningFunnelLayer,
  ScreeningStock,
  ScreeningStockCardLabels,
  ScreeningStockGroup,
} from "../types";
import { ScreeningStockCard } from "./ScreeningStockCard";
import { StockScreeningExplanationDrawer } from "./StockScreeningExplanationDrawer";

type ScreeningFunnelProps = {
  title: string;
  description: string;
  layers: ScreeningFunnelLayer[];
  resultGroups: ScreeningStockGroup[];
  stockCardLabels: ScreeningStockCardLabels;
};

type FunnelTab = {
  id: string;
  label: string;
  shortLabel?: string;
  badge?: string;
  layer?: ScreeningFunnelLayer;
  title?: string;
  dataPoints?: string[];
  simpleReading?: string;
  currentResult?: string;
  impact?: string;
  nextActionLabel?: string;
};

const funnelCounts = [
  { label: "Ban đầu", count: 128, text: "128 mã ban đầu" },
  { label: "Sau bối cảnh ngành", count: 42, text: "42 mã cùng ngành" },
  { label: "Sau độ dễ hiểu doanh nghiệp", count: 18, text: "18 mã dễ hiểu" },
  { label: "Sau cảnh báo tài chính sơ bộ", count: 9, text: "9 mã không có cờ đỏ lớn" },
  { label: "Sau định giá sơ bộ", count: 6, text: "6 mã định giá không quá bất thường" },
  { label: "Sau thanh khoản sơ bộ", count: 4, text: "4 mã phù hợp người mới" },
];

const layerCopy: Record<
  string,
  Omit<FunnelTab, "id" | "label" | "shortLabel" | "badge" | "layer">
> = {
  industry: {
    title: "Cửa 1: Bối cảnh ngành",
    dataPoints: ["Sức mua", "Lãi suất", "CPI", "Bán lẻ", "Tín dụng", "Đầu tư công", "Xuất nhập khẩu", "Dữ liệu ngành"],
    simpleReading:
      "Một doanh nghiệp tốt vẫn có thể gặp khó nếu ngành đang đi ngược chu kỳ. Vì vậy hệ thống kiểm tra ngành trước khi soi từng mã.",
    currentResult:
      "Ngành có bối cảnh đủ đáng quan tâm, nhưng chưa có nghĩa mọi cổ phiếu trong ngành đều tốt.",
    impact:
      "Mã thuộc ngành có gió thuận được đi tiếp sang cửa Độ dễ hiểu doanh nghiệp. Mã lệch ngành hoặc không hưởng lợi từ thesis sẽ bị chuyển sang Theo dõi thêm.",
    nextActionLabel: "Mở module Phân tích ngành",
  },
  "business-model": {
    title: "Cửa 2: Độ dễ hiểu của doanh nghiệp",
    dataPoints: ["Nguồn doanh thu", "Mảng kinh doanh chính", "Cơ cấu lợi nhuận", "Sản phẩm chính", "Khách hàng chính", "Lợi nhuận bất thường"],
    simpleReading:
      "Nếu người dùng không hiểu công ty kiếm tiền từ đâu, thì chưa nên phân tích sâu. Doanh nghiệp càng phức tạp thì càng dễ bị đọc sai.",
    currentResult:
      "Doanh nghiệp có mô hình kinh doanh tương đối dễ hiểu, phù hợp để mở hồ sơ phân tích.",
    impact:
      "Doanh nghiệp dễ hiểu được đi tiếp. Doanh nghiệp quá phức tạp hoặc lợi nhuận chủ yếu từ yếu tố bất thường sẽ chuyển sang nhóm Chưa phù hợp với người mới.",
    nextActionLabel: "Mở hồ sơ doanh nghiệp",
  },
  "financial-health": {
    title: "Cửa 3: Cảnh báo tài chính sơ bộ",
    dataPoints: ["Lãi/lỗ", "CFO", "Nợ vay", "Hàng tồn kho", "Phải thu", "Biên lợi nhuận", "Ý kiến kiểm toán"],
    simpleReading:
      "Ở bước này hệ thống chưa đọc sâu toàn bộ báo cáo tài chính. Nó chỉ tìm các cờ đỏ lớn như lỗ kéo dài, nợ cao, dòng tiền âm hoặc tồn kho tăng bất thường.",
    currentResult:
      "Chưa thể kết luận tài chính tốt. Cần kiểm tra sâu dòng tiền hoạt động, tồn kho, nợ vay và biên lợi nhuận.",
    impact:
      "Nếu chưa thấy cờ đỏ lớn, mã được đi tiếp. Nếu có dấu hiệu cần soi kỹ, mã vẫn có thể giữ lại nhưng gắn nhãn Cần kiểm tra.",
    nextActionLabel: "Mở module Báo cáo tài chính",
  },
  valuation: {
    title: "Cửa 4: Định giá sơ bộ",
    dataPoints: ["P/E", "P/B", "EV/EBITDA", "EV/Sales", "Tăng trưởng lợi nhuận", "Định giá so với ngành", "Catalyst gần nhất"],
    simpleReading:
      "Một doanh nghiệp dễ hiểu vẫn cần kiểm tra định giá. Mức rẻ bề mặt cũng có thể phản ánh rủi ro chưa nhìn thấy.",
    currentResult:
      "Cổ phiếu có câu chuyện đáng chú ý, nhưng giá có thể đã phản ánh một phần kỳ vọng. Cần sang module Định giá để kiểm tra kỹ hơn.",
    impact:
      "Nếu định giá không quá bất thường, mã được đi tiếp. Nếu định giá có vẻ cao so với tăng trưởng, mã chuyển sang Theo dõi thêm.",
    nextActionLabel: "Mở module Định giá",
  },
  "liquidity-fit": {
    title: "Cửa 5: Thanh khoản sơ bộ cho người mới",
    dataPoints: ["Giá trị giao dịch trung bình", "Khối lượng giao dịch", "Free-float sơ bộ", "Biến động giá", "Phiên mất thanh khoản"],
    simpleReading:
      "Cổ phiếu thanh khoản thấp có thể khiến người mới bị kẹt khi thị trường xấu. Thanh khoản là tiêu chí phòng vệ, không phải tiêu chí dự đoán giá tăng.",
    currentResult:
      "Mã có thanh khoản đủ tốt để theo dõi, nhưng vẫn cần kiểm tra sâu dòng tiền và vi cấu trúc nếu muốn ra quyết định thật.",
    impact:
      "Mã thanh khoản tốt được đưa vào nhóm ứng viên. Mã thanh khoản mỏng chuyển sang Chưa phù hợp với người mới.",
    nextActionLabel: "Mở module Thanh khoản / dòng tiền",
  },
};

function statusTone(status?: string) {
  if (!status) return "neutral";
  if (status.includes("Đạt")) return "success";
  if (status.includes("Cần")) return "warning";
  if (status.includes("Cảnh")) return "danger";
  return "neutral";
}

function shortLabel(layer: ScreeningFunnelLayer) {
  if (layer.id === "industry") return "Bối cảnh";
  if (layer.id === "business-model") return "Dễ hiểu DN";
  if (layer.id === "financial-health") return "Tài chính sơ bộ";
  if (layer.id === "valuation") return "Định giá sơ bộ";
  if (layer.id === "liquidity-fit") return "Thanh khoản";
  return layer.title;
}

function displayTitle(layer: ScreeningFunnelLayer) {
  if (layer.id === "financial-health") return "Cảnh báo tài chính sơ bộ";
  if (layer.id === "valuation") return "Định giá sơ bộ";
  if (layer.id === "liquidity-fit") return "Thanh khoản sơ bộ";
  if (layer.id === "business-model") return "Độ dễ hiểu doanh nghiệp";
  return layer.title;
}

function ScreeningTabButton({
  active,
  badge,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-11 shrink-0 rounded-[4px] border-[1.5px] px-3 py-2 text-left text-xs font-bold transition",
        active
          ? "border-border bg-ink text-white shadow-hard-sm"
          : "border-border-soft bg-surface-soft text-ink hover:border-border hover:bg-surface-hover",
      ].join(" ")}
      aria-pressed={active}
    >
      <span>{label}</span>
      {badge ? (
        <span
          className={[
            "ml-2 inline-flex rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold",
            active ? "border-white/30 bg-white/10 text-white" : "border-border-soft bg-surface text-muted",
          ].join(" ")}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function OverviewTab({ tabs }: { tabs: FunnelTab[] }) {
  const detailTabs = tabs.filter((tab) => tab.layer);

  return (
    <div className="space-y-3">
      {detailTabs.map((tab) => (
        <div
          key={tab.id}
          className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 lg:grid-cols-[160px_minmax(0,1.2fr)_minmax(0,1fr)_120px_minmax(0,1fr)]"
        >
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Cửa lọc</p>
            <p className="mt-1 text-sm font-bold text-ink">{displayTitle(tab.layer!)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Câu hỏi chính</p>
            <p className="mt-1 text-xs leading-5 text-muted">{tab.layer!.question}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Dữ liệu nhìn</p>
            <p className="mt-1 text-xs leading-5 text-muted">{tab.dataPoints?.slice(0, 5).join(", ")}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Kết quả</p>
            <Chip className="mt-1" size="sm" variant={statusTone(tab.layer!.status)}>
              {tab.layer!.status}
            </Chip>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Ý nghĩa</p>
            <p className="mt-1 text-xs leading-5 text-muted">{tab.currentResult}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailTab({ tab }: { tab: FunnelTab }) {
  if (!tab.layer) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
      <div className="space-y-4">
        <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Câu hỏi lọc</p>
          <p className="mt-1 text-base font-bold leading-6 text-ink">{tab.layer.question}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-ink">Dữ liệu hệ thống dùng để trả lời</p>
          <div className="flex flex-wrap gap-2">
            {tab.dataPoints?.map((point) => (
              <Chip key={point} size="sm" variant="neutral">
                {point}
              </Chip>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Cách đọc đơn giản</p>
          <p className="mt-1 text-sm leading-6 text-muted">{tab.simpleReading}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-ink">Kết quả sơ bộ hiện tại</p>
              <p className="mt-2 text-sm leading-6 text-muted">{tab.currentResult}</p>
            </div>
            <Chip variant={statusTone(tab.layer.status)}>{tab.layer.status}</Chip>
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Ảnh hưởng đến kết quả lọc</p>
          <p className="mt-1 text-sm leading-6 text-muted">{tab.impact}</p>
        </div>

        <Button size="sm" variant="secondary">
          {tab.nextActionLabel}
        </Button>

        <details className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
          <summary className="cursor-pointer text-xs font-bold text-accent">
            Xem cách tính nâng cao
          </summary>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-muted">
            <p>Ngưỡng lọc: dùng ngưỡng sơ bộ theo ngành và khẩu vị rủi ro đã chọn.</p>
            <p>Chỉ số chi tiết: {tab.dataPoints?.join(", ")}.</p>
            <p>Dữ liệu gốc: mock data, sẽ thay bằng nguồn dữ liệu thật khi nối backend.</p>
            <p>Lý do pass/fail: dựa trên trạng thái {tab.layer.status} và các điểm cần kiểm tra.</p>
            <p>Hạn chế: đây là vòng sơ lọc, không thay thế phân tích sâu ở module sau.</p>
          </div>
        </details>
      </div>
    </div>
  );
}

function ResultsTab({
  groups,
  onExplain,
  stockCardLabels,
}: {
  groups: ScreeningStockGroup[];
  stockCardLabels: ScreeningStockCardLabels;
  onExplain: (stock: ScreeningStock) => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key} className="rounded-[4px] border-[1.5px] border-border bg-surface-soft">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-soft px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-[3px] border border-border bg-accent-soft text-[10px] font-bold text-accent">
                  {group.icon}
                </span>
                <h3 className="text-sm font-bold text-ink">{group.title}</h3>
                <Chip size="sm" variant={group.tone}>
                  {group.stocks.length} mã
                </Chip>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">{group.description}</p>
            </div>
          </div>
          <div className="grid gap-3 px-4 py-4 xl:grid-cols-2">
            {group.stocks.map((stock) => (
              <ScreeningStockCard
                key={stock.ticker}
                labels={stockCardLabels}
                stock={stock}
                tone={group.tone}
                onExplain={onExplain}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ScreeningFunnel({
  description,
  layers,
  resultGroups,
  stockCardLabels,
  title,
}: ScreeningFunnelProps) {
  const tabs = useMemo<FunnelTab[]>(
    () => [
      { id: "overview", label: "Tổng quan" },
      ...layers.map((layer) => ({
        id: layer.id,
        label: displayTitle(layer),
        shortLabel: shortLabel(layer),
        badge: layer.status,
        layer,
        ...layerCopy[layer.id],
      })),
      { id: "results", label: "Kết quả", badge: "4 mã" },
    ],
    [layers]
  );
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "overview");
  const [explainedStock, setExplainedStock] = useState<ScreeningStock | null>(null);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <section>
      <SectionHeader
        description={description}
        icon="5"
        title={title}
      />

      <Card>
        <CardBody className="space-y-5">
          <div className="rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3">
            <p className="text-xs font-bold text-ink">
              Vòng lọc này chỉ giúp loại nhiễu và chọn mã đáng mở hồ sơ phân tích. Báo cáo tài chính, định giá và thanh khoản chuyên sâu sẽ được kiểm tra ở module sau.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {funnelCounts.map((item, index) => (
                <div
                  key={item.label}
                  className="min-w-[150px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
                >
                  <p className="font-mono text-[11px] font-bold text-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink">{item.count}</p>
                  <p className="text-xs leading-5 text-muted">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {funnelCounts.map((item) => (
                <p
                  key={item.label}
                  className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted"
                >
                  <span className="font-bold text-ink">{item.label}:</span> {item.count} mã
                </p>
              ))}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-border-soft pb-3">
            {tabs.map((tab) => (
              <ScreeningTabButton
                key={tab.id}
                active={tab.id === activeTab.id}
                badge={tab.badge}
                label={tab.shortLabel ?? tab.label}
                onClick={() => setActiveTabId(tab.id)}
              />
            ))}
          </div>

          {activeTab.id === "overview" ? <OverviewTab tabs={tabs} /> : null}
          {activeTab.layer ? <DetailTab tab={activeTab} /> : null}
          {activeTab.id === "results" ? (
            <ResultsTab
              groups={resultGroups}
              stockCardLabels={stockCardLabels}
              onExplain={setExplainedStock}
            />
          ) : null}
        </CardBody>
      </Card>

      <StockScreeningExplanationDrawer
        stock={explainedStock}
        onClose={() => setExplainedStock(null)}
      />
    </section>
  );
}
