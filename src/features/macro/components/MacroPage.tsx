import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  ExpandableInsight,
  InsightCard,
  MetricCard,
  ModuleSummary,
  NextStepCard,
  SectionHeader,
  Tabs,
} from "@/components/ui";
import {
  globalMacroTopics,
  macroGuidance,
  macroOverview,
  macroSections,
  macroSignals,
  macroTabsCopy,
  vietnamMacroMetricCards,
  vietnamMacroRows,
  warningDashboardItems,
} from "../data/macro.data";
import { MacroTopicGrid } from "./MacroTopicGrid";
import { MacroVietnamTable } from "./MacroVietnamTable";
import { MacroWarningDashboard } from "./MacroWarningDashboard";

export function MacroPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-7">
      <div>
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
          <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
            {macroOverview.icon}
          </span>
          <span>{macroOverview.eyebrow}</span>
        </div>
        <h1 className="font-brand text-2xl font-bold text-ink">
          {macroOverview.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">{macroOverview.description}</p>
      </div>

      <InsightCard
        description={macroGuidance.insight.description}
        eyebrow={macroGuidance.insight.eyebrow}
        title={macroGuidance.insight.title}
      />

      <ExpandableInsight
        title={macroGuidance.explanation.title}
        summary={macroGuidance.explanation.summary}
        openLabel="Giải thích đơn giản"
        closeLabel="Thu gọn"
      >
        <div className="grid gap-2">
          {macroGuidance.explanation.details.map((detail) => (
            <p
              key={detail}
              className="rounded-[4px] border border-border-soft bg-surface-soft/70 px-3 py-2 text-sm leading-6 text-muted"
            >
              {detail}
            </p>
          ))}
        </div>
      </ExpandableInsight>

      <section>
        <SectionHeader
          icon={macroSections.layers.icon}
          title={macroSections.layers.title}
        />
        <Card>
          <CardBody>
            <Tabs
              ariaLabel={macroTabsCopy.ariaLabel}
              items={[
                {
                  value: "global",
                  label: macroTabsCopy.global.tabLabel,
                  content: (
                    <Card>
                      <CardHeader
                        chip={<Chip>{macroTabsCopy.global.chip}</Chip>}
                        icon={macroTabsCopy.global.icon}
                        title={macroTabsCopy.global.title}
                      />
                      <CardBody>
                        <MacroTopicGrid topics={globalMacroTopics} />
                      </CardBody>
                    </Card>
                  ),
                },
                {
                  value: "vietnam",
                  label: macroTabsCopy.vietnam.tabLabel,
                  content: (
                    <div className="space-y-4">
                      {vietnamMacroMetricCards.map((metricCard) => (
                        <MetricCard
                          key={metricCard.id}
                          icon={metricCard.icon}
                          items={metricCard.metrics}
                          period={metricCard.period}
                          status={metricCard.status}
                          title={metricCard.title}
                          value={metricCard.value}
                        />
                      ))}

                      <Card>
                        <CardHeader
                          chip={<Chip>{macroTabsCopy.vietnam.chip}</Chip>}
                          icon={macroTabsCopy.vietnam.icon}
                          title={macroTabsCopy.vietnam.title}
                        />
                        <CardBody>
                          <MacroVietnamTable rows={vietnamMacroRows} />
                        </CardBody>
                      </Card>
                    </div>
                  ),
                },
                {
                  value: "warning",
                  label: macroTabsCopy.warning.tabLabel,
                  content: (
                    <Card>
                      <CardHeader
                        chip={<Chip>{macroTabsCopy.warning.chip}</Chip>}
                        icon={macroTabsCopy.warning.icon}
                        title={macroTabsCopy.warning.title}
                      />
                      <CardBody>
                        <MacroWarningDashboard
                          items={warningDashboardItems}
                          signals={macroSignals}
                        />
                      </CardBody>
                    </Card>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      </section>

      <NextStepCard
        actionLabel={macroGuidance.nextStep.actionLabel}
        description={macroGuidance.nextStep.description}
        title={macroGuidance.nextStep.title}
      />

      <ModuleSummary
        items={macroGuidance.summary.items}
        title={macroGuidance.summary.title}
      />
    </div>
  );
}
