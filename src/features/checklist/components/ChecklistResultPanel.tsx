import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ChecklistModeId, ChecklistTickerState, StockChecklistResult } from "../types";

type ChecklistResultPanelProps = {
  mode: ChecklistModeId;
  result: StockChecklistResult;
  tickerState: ChecklistTickerState;
  onNavigate: (key: string) => void;
  onSelectFullMode: () => void;
};

const readinessLabel: Record<StockChecklistResult["readiness"], string> = {
  locked: "Chưa đủ điều kiện",
  not_enough_understanding: "Chưa đủ hiểu",
  need_more_analysis: "Cần quay lại phân tích",
  watchlist_only: "Tạm đủ để theo dõi",
  prepare_simulation_with_warning: "Có thể chuẩn bị mô phỏng với cảnh báo",
  ready_for_simulation: "Sẵn sàng mô phỏng",
  fomo_warning: "Rủi ro FOMO cao",
  unclear_thesis: "Thesis chưa đủ rõ",
  missing_critical_data: "Thiếu dữ liệu quan trọng",
};

export function ChecklistResultPanel({
  mode,
  onNavigate,
  onSelectFullMode,
  result,
  tickerState,
}: ChecklistResultPanelProps) {
  const fomo = result.readiness === "fomo_warning";
  const ready = result.readiness === "ready_for_simulation";

  return (
    <Card>
      <CardHeader
        icon="R"
        title="Kết quả tạm thời"
        description="Kết quả chỉ phản ánh mức độ hiểu cổ phiếu và độ đầy đủ dữ liệu, không phản ánh cổ phiếu tốt hay xấu tuyệt đối."
        chip={<Chip variant={ready ? "success" : fomo ? "warning" : "neutral"}>{readinessLabel[result.readiness]}</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Summary label="Thesis chính" value={tickerState.thesis} />
          <Summary label="Rủi ro lớn nhất" value={tickerState.mainRisk} />
          <Summary label="Dữ liệu xác nhận" value={tickerState.confirmingData.join(", ")} />
          <Summary label="Dữ liệu phủ định" value={tickerState.disconfirmingData.join(", ")} />
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
          <p className="text-sm font-bold text-ink">Hành động tiếp theo</p>
          <p className="mt-1 text-sm leading-6 text-muted">{result.nextAction}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {fomo ? (
              <Button onClick={() => onNavigate("technical")}>Ghi lại lý do và kiểm tra lại PVT</Button>
            ) : ready ? (
              <Button onClick={() => onNavigate("simulation")}>Chuyển sang Mô phỏng</Button>
            ) : mode === "standard" ? (
              <Button onClick={onSelectFullMode}>Làm kiểm tra đầy đủ trước mô phỏng</Button>
            ) : (
              <Button onClick={() => onNavigate(result.modulesToRevisit[0] ?? "risk")}>Quay lại module cần kiểm tra</Button>
            )}
            <Button variant="secondary">Lưu kết quả kiểm tra</Button>
            <Button variant="ghost" onClick={() => onNavigate("watchlist")}>Quay lại Watchlist</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{value}</p>
    </div>
  );
}
