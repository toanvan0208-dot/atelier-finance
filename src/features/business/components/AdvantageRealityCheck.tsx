import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { BusinessJourneyCompetitiveAdvantageData } from "../types";

type AdvantageRealityCheckProps = {
  data: BusinessJourneyCompetitiveAdvantageData;
  onDeepDive: () => void;
};

function durabilityTone(level: string) {
  if (level === "Tương đối bền") return "success" as const;
  if (level === "Dễ bị sao chép") return "danger" as const;
  return "warning" as const;
}

export function AdvantageRealityCheck({ data, onDeepDive }: AdvantageRealityCheckProps) {
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

        <div className="overflow-x-auto">
          <div className="min-w-[720px] rounded-[4px] border border-border-soft">
            <div className="grid grid-cols-[0.8fr_1.1fr_1.1fr_150px] border-b border-border-soft bg-surface-soft px-4 py-3 text-xs font-bold text-ink">
              <span>Lợi thế được nói đến</span>
              <span>Nếu là thật, nó tạo tiền bằng cách nào?</span>
              <span>Cần nghi ngờ điều gì?</span>
              <span>Mức bền</span>
            </div>
            {data.advantages.map((item) => (
              <div key={item.advantageName} className="grid grid-cols-[0.8fr_1.1fr_1.1fr_150px] gap-3 border-b border-border-soft px-4 py-3 last:border-b-0">
                <p className="text-sm font-bold text-ink">{item.advantageName}</p>
                <p className="text-sm leading-6 text-muted">{item.howItCreatesMoney}</p>
                <p className="text-sm leading-6 text-muted">{item.whatToQuestion}</p>
                <Chip size="sm" variant={durabilityTone(item.durabilityLevel)}>
                  {item.durabilityLevel}
                </Chip>
              </div>
            ))}
          </div>
        </div>

        <p className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3 text-sm font-bold leading-6 text-ink">
          {data.practicalConclusion}
        </p>
      </CardBody>
    </Card>
  );
}
