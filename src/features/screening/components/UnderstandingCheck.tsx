import { Card, CardBody, CardHeader, Chip, SectionHeader } from "@/components/ui";
import type { UnderstandingCheckData } from "../types";

type UnderstandingCheckProps = {
  data: UnderstandingCheckData;
};

export function UnderstandingCheck({ data }: UnderstandingCheckProps) {
  return (
    <section>
      <SectionHeader
        description={data.description}
        icon={data.icon}
        title={data.title}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card>
          <CardHeader title={data.questionsTitle} />
          <CardBody>
            <ol className="space-y-2">
              {data.questions.map((question) => (
                <li key={question} className="text-sm leading-6 text-muted">
                  {question}
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={data.feedbackTitle} />
          <CardBody className="space-y-3">
            {data.feedbackLevels.map((level) => (
              <div key={level.label}>
                <Chip variant="accent">{level.label}</Chip>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {level.description}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
