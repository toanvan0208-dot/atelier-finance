import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { buildMacroIndustryReadinessUiModel } from "../lib/macro-industry-readiness-ui";
import type { MacroIndustryDomain } from "../lib/macro-industry-data-boundary";

type MacroIndustryReadinessSkeletonProps = {
  domain: MacroIndustryDomain;
};

export function MacroIndustryReadinessSkeleton({ domain }: MacroIndustryReadinessSkeletonProps) {
  const model = buildMacroIndustryReadinessUiModel(domain);

  return (
    <Card data-testid={`macro-industry-readiness-${model.moduleKey}`}>
      <CardHeader
        title={model.title}
        description={model.summary}
        chip={<Chip variant="warning">{model.badgeLabel}</Chip>}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {model.statusCards.map((card) => (
            <div key={card.label} className="rounded-[5px] border border-border-soft bg-surface-soft p-3">
              <p className="text-[11px] font-bold uppercase text-subtle">{card.label}</p>
              <p className="mt-1 break-words text-sm font-extrabold text-ink [overflow-wrap:anywhere]">{card.value}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[5px] border border-border-soft bg-surface p-4">
            <h3 className="text-sm font-extrabold text-ink">Truong du lieu can chuan bi</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {model.requiredFields.map((field) => (
                <Chip key={field} size="sm" variant="neutral">
                  {field}
                </Chip>
              ))}
            </div>
          </div>

          <div className="rounded-[5px] border border-border-soft bg-surface p-4">
            <h3 className="text-sm font-extrabold text-ink">Cac buoc can hoan tat</h3>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              {model.futureGates.map((gate) => (
                <li key={gate.label}>
                  <span className="font-semibold text-ink">{gate.label}</span>
                  <span className="block">{gate.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {model.boundaryBadges.map((badge) => (
            <Chip key={badge} size="sm" variant="warning">
              {badge}
            </Chip>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
