import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { CheckThinkingData, CheckThinkingMode } from "../types";

type CheckThinkingHeroProps = {
  hero: CheckThinkingData["hero"];
  activeMode: CheckThinkingMode;
  onModeChange: (mode: CheckThinkingMode) => void;
};

export function CheckThinkingHero({ activeMode, hero, onModeChange }: CheckThinkingHeroProps) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Chip variant="accent">Checklist mới</Chip>
            <h1 className="mt-3 font-brand text-3xl font-bold leading-tight text-ink md:text-4xl">
              {hero.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">{hero.subtitle}</p>
          </div>
          <Button variant="secondary" onClick={() => onModeChange(activeMode)}>
            Tiếp tục kiểm tra
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {hero.modeCards.map((card) => {
            const isActive = card.mode === activeMode;

            return (
              <button
                key={card.mode}
                className={[
                  "rounded-[4px] border-[1.5px] px-4 py-4 text-left transition",
                  isActive
                    ? "border-border bg-accent-soft shadow-hard-sm"
                    : "border-border-soft bg-surface-soft hover:border-border",
                ].join(" ")}
                type="button"
                onClick={() => onModeChange(card.mode)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-ink">{card.title}</p>
                    <p className="mt-2 text-sm leading-5 text-muted">{card.description}</p>
                  </div>
                  <span className="text-lg font-bold text-ink">→</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-subtle">{card.helper}</p>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
