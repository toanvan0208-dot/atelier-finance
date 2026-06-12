import { Button, Card, CardBody } from "@/components/ui";
import type { BusinessJourneyStrategyData } from "../types";

type StrategyLeadershipSectionProps = {
  data: BusinessJourneyStrategyData;
  onDeepDive: () => void;
};

const blocks = [
  { key: "strategicDirection", title: "Công ty muốn đi đâu?" },
  { key: "executionCapability", title: "Công ty có năng lực làm được không?" },
  { key: "leadershipConcerns", title: "Rủi ro nếu chiến lược sai là gì?" },
] as const;

export function StrategyLeadershipSection({ data, onDeepDive }: StrategyLeadershipSectionProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold leading-7 text-ink">{data.question}</h2>
            <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">{data.shortExplanation}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onDeepDive}>
            Xem sâu hơn
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {blocks.map((block) => (
            <section key={block.key} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-sm font-bold text-ink">{block.title}</h3>
              <div className="mt-3 space-y-2">
                {data[block.key].slice(0, 3).map((item) => (
                  <p key={item} className="text-sm leading-6 text-muted">
                    {item}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <p className="rounded-[4px] border border-border-soft bg-surface px-4 py-3 text-sm leading-6 text-muted">
            <span className="font-bold text-ink">Cách dùng tiền cần quan sát: </span>
            {data.capitalAllocationNotes.join(" ")}
          </p>
          <p className="rounded-[4px] border border-border-soft bg-surface px-4 py-3 text-sm leading-6 text-muted">
            <span className="font-bold text-ink">Lợi ích cổ đông nhỏ: </span>
            {data.shareholderAlignment}
          </p>
        </div>

        <p className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3 text-sm font-bold leading-6 text-ink">
          {data.practicalConclusion}
        </p>
      </CardBody>
    </Card>
  );
}
