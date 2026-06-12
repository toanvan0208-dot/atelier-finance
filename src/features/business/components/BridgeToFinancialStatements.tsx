import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { BusinessJourneyBridgeData } from "../types";

type BridgeToFinancialStatementsProps = {
  data: BusinessJourneyBridgeData;
  onNavigate?: (moduleKey: string) => void;
};

export function BridgeToFinancialStatements({ data, onNavigate }: BridgeToFinancialStatementsProps) {
  return (
    <Card className="border-border bg-accent-soft">
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Chip variant="accent">Tạm kết</Chip>
            <h2 className="mt-2 text-xl font-bold leading-7 text-ink">{data.title}</h2>
            <p className="mt-2 max-w-[78ch] text-sm font-bold leading-6 text-ink">
              {data.businessUnderstandingSummary}
            </p>
          </div>
          <Button size="sm" variant="primary" onClick={() => onNavigate?.("financials")}>
            Sang Báo cáo tài chính
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <section className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
            <h3 className="text-sm font-bold text-ink">Điểm mạnh cần kiểm chứng</h3>
            <List items={data.strengthsToVerify} />
          </section>
          <section className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
            <h3 className="text-sm font-bold text-ink">Điểm yếu cần kiểm chứng</h3>
            <List items={data.weaknessesToVerify} />
          </section>
          <section className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
            <h3 className="text-sm font-bold text-ink">Sang BCTC xem gì?</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.financialMetricsToCheck.map((item) => (
                <Chip key={item} size="sm" variant="neutral">
                  {item}
                </Chip>
              ))}
            </div>
          </section>
        </div>

        <p className="rounded-[4px] border border-border bg-surface px-4 py-3 text-sm font-semibold leading-6 text-muted">
          {data.nextModuleSuggestion}
        </p>
      </CardBody>
    </Card>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <p key={item} className="text-sm leading-6 text-muted">
          {item}
        </p>
      ))}
    </div>
  );
}
