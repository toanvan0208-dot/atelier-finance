import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { BusinessConclusionData } from "../types";

type BusinessConclusionProps = {
  data: BusinessConclusionData;
  canGoToFinancials?: boolean;
};

export function BusinessConclusion({ canGoToFinancials = false, data }: BusinessConclusionProps) {
  return (
    <Card className="bg-accent-soft">
      <CardHeader
        chip={<Chip variant={canGoToFinancials ? "success" : "warning"}>{canGoToFinancials ? "Có thể sang BCTC" : "Cần mini check"}</Chip>}
        description="Checkpoint trước khi dùng BCTC để kiểm chứng giả thuyết kinh doanh."
        icon="K"
        title="Kết luận hiểu doanh nghiệp"
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {data.items.map((item) => (
            <div
              key={item.title}
              className="rounded-[4px] border border-border-soft bg-surface px-3 py-3"
            >
              <p className="text-xs font-bold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.content}</p>
            </div>
          ))}
        </div>
        <div className="rounded-[4px] border border-border bg-surface px-4 py-3">
          <p className="text-xs font-bold text-ink">Kết luận tạm thời</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            MWG là doanh nghiệp bán lẻ chuỗi dễ hiểu, nhưng thesis chỉ mạnh hơn nếu biên lợi nhuận, tồn kho và CFO xác nhận phục hồi.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant={canGoToFinancials ? "primary" : "secondary"} disabled={!canGoToFinancials}>
              {canGoToFinancials ? "Sang BCTC để kiểm chứng" : "Hoàn thành mini check"}
            </Button>
            <Button size="sm" variant="ghost">Quay lại máy tạo tiền</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
