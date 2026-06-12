import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { ValuationUncertainty } from "../types";

type ValuationUncertaintyPanelProps = {
  data: ValuationUncertainty[];
  onNavigate?: (moduleKey: string) => void;
};

function statusVariant(status: ValuationUncertainty["status"]) {
  if (status === "Đã ổn") return "success";
  if (status === "Rủi ro cao") return "danger";
  return "warning";
}

export function ValuationUncertaintyPanel({ data, onNavigate }: ValuationUncertaintyPanelProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold leading-7 text-ink">Điều gì có thể làm định giá sai?</h2>
            <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
              Phần này chỉ giữ các dữ liệu làm kết quả định giá kém chắc chắn, không phân tích lại toàn bộ Báo cáo tài chính.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate?.("financials")}>
            Xem lại trong module BCTC
          </Button>
        </div>

        <div className="grid gap-2">
          {data.map((item) => (
            <div key={item.title} className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <Chip size="sm" variant={statusVariant(item.status)}>
                {item.status}
              </Chip>
              <div>
                <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
