import type { ReactNode } from "react";
import { Button } from "./Button";

type NextStepCardProps = {
  title: ReactNode;
  description: ReactNode;
  actionLabel?: ReactNode;
};

export function NextStepCard({
  actionLabel,
  description,
  title,
}: NextStepCardProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        </div>
        {actionLabel ? (
          <Button size="sm" variant="secondary">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
