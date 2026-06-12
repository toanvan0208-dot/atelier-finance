import { Button, Card, CardBody, Chip } from "@/components/ui";

type BeginnerSummaryPanelProps = {
  items: string[];
  onNavigate?: (moduleKey: string) => void;
};

export function BeginnerSummaryPanel({ items, onNavigate }: BeginnerSummaryPanelProps) {
  return (
    <Card className="lg:sticky lg:top-20">
      <CardBody className="space-y-4">
        <div>
          <Chip variant="accent">Ghi nhớ</Chip>
          <h2 className="mt-2 text-base font-bold text-ink">Người mới cần nhớ gì?</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Tóm tắt phần quan trọng nhất để không bị lạc vào số liệu quá sớm.
          </p>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <span className="font-mono text-[11px] font-bold text-subtle">{String(index + 1).padStart(2, "0")}</span>
              <p className="text-xs font-semibold leading-5 text-ink">{item}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-border-soft pt-4">
          <Button className="w-full" size="sm" variant="secondary" onClick={() => onNavigate?.("industry")}>
            Cần kiểm chứng ở ngành?
          </Button>
          <Button className="w-full" size="sm" variant="primary" onClick={() => onNavigate?.("financials")}>
            Sang BCTC kiểm chứng
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
