import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ThesisBreaker } from "../types";

type ThesisBreakerPanelProps = {
  items: ThesisBreaker[];
  onNavigate: (key: string) => void;
};

export function ThesisBreakerPanel({ items, onNavigate }: ThesisBreakerPanelProps) {
  return (
    <Card>
      <CardHeader
        title="Điều gì có thể làm luận điểm đầu tư sai?"
        description="Biến rủi ro thành câu phản biện rõ, không chỉ liệt kê chung chung."
      />
      <CardBody className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft p-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Chip size="sm" variant="accent">{item.label}</Chip>
              <p className="mt-3 text-sm font-semibold leading-6 text-ink">{item.statement}</p>
            </div>
            {item.targetModule ? (
              <Button className="md:mt-1" size="sm" variant="secondary" onClick={() => onNavigate(item.targetModule ?? "risk")}>
                Kiểm tra
              </Button>
            ) : null}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
