"use client";

import { Card, CardBody, Chip, SectionHeader, Tabs } from "@/components/ui";
import type { TabItem } from "@/components/ui";
import type { AssessmentTone, BusinessAnalysisBlock, BusinessAnalysisGroup } from "../types";

type BusinessAnalysisGroupsProps = {
  groups: BusinessAnalysisGroup[];
};

function chipTone(tone?: AssessmentTone) {
  return tone ?? "neutral";
}

function AnalysisBlock({ block }: { block: BusinessAnalysisBlock }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-ink">{block.title}</p>
        {block.tone ? (
          <Chip size="sm" variant={chipTone(block.tone)}>
            {block.tone === "warning" ? "Cần kiểm chứng" : "Quan sát sơ bộ"}
          </Chip>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{block.content}</p>

      {block.fields ? (
        <div className="mt-3 grid gap-2">
          {block.fields.map((field) => (
            <div
              key={field.label}
              className="grid gap-1 rounded-[4px] border border-border-soft bg-surface px-3 py-2 md:grid-cols-[180px_minmax(0,1fr)]"
            >
              <p className="text-xs font-bold text-ink">{field.label}</p>
              <p className="text-xs leading-5 text-muted">{field.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {block.bullets ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {block.bullets.map((item) => (
            <Chip key={item} size="sm" variant="neutral">
              {item}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GroupContent({ group }: { group: BusinessAnalysisGroup }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-4">
        <p className="text-xs font-bold text-ink">Câu hỏi chính</p>
        <p className="mt-1 text-base font-bold leading-7 text-ink">{group.question}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{group.intro}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {group.blocks.map((block) => (
          <AnalysisBlock key={block.title} block={block} />
        ))}
      </div>

      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
          Output của cụm
        </p>
        <p className="mt-1 text-sm font-bold leading-6 text-ink">{group.output}</p>
      </div>
    </div>
  );
}

export function BusinessAnalysisGroups({ groups }: BusinessAnalysisGroupsProps) {
  const tabs: TabItem[] = groups.map((group) => ({
    value: group.id,
    label: group.label,
    content: <GroupContent group={group} />,
  }));

  return (
    <section>
      <SectionHeader
        description="13 bước cũ được gộp lại thành 5 cụm lớn để người mới đọc theo một hành trình ngắn hơn nhưng vẫn giữ chiều sâu."
        icon="5"
        title="5 cụm phân tích chính"
      />
      <Card>
        <CardBody>
          <Tabs ariaLabel="5 cụm hiểu doanh nghiệp" items={tabs} />
        </CardBody>
      </Card>
    </section>
  );
}
