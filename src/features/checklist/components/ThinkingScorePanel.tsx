import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ThinkingScoreResult } from "../types";

type ThinkingScorePanelProps = {
  score: ThinkingScoreResult;
};

export function ThinkingScorePanel({ score }: ThinkingScorePanelProps) {
  return (
    <Card>
      <CardHeader
        title="Phản hồi theo năng lực"
        description="Điểm số chỉ là gợi ý học tập, trọng tâm là năng lực cần luyện tiếp."
        chip={<Chip variant="accent">{score.totalScore}/{score.maxScore}</Chip>}
      />
      <CardBody className="space-y-4">
        <div>
          <p className="text-base font-bold text-ink">{score.headline}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{score.feedback}</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {score.competencyScores.map((item) => (
            <div key={item.competency} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-ink">{item.competency}</p>
                <Chip size="sm" variant="neutral">
                  {item.score}/{item.maxScore}
                </Chip>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{item.feedback}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-ink">{item.nextAction}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
