import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "./Card";
import { Chip } from "./Chip";

type MetricItem = {
  label: ReactNode;
  value: ReactNode;
};

type MetricCardProps = {
  title: ReactNode;
  value: ReactNode;
  period?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  status?: ReactNode;
  items?: MetricItem[];
};

export function MetricCard({
  description,
  icon,
  items = [],
  period,
  status,
  title,
  value,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader
        chip={status ? <Chip>{status}</Chip> : null}
        description={description}
        icon={icon}
        title={title}
      />
      <CardBody>
        <div className="font-mono text-3xl font-bold leading-none text-ink">
          {value}
          {period ? (
            <span className="ml-2 align-middle text-xs font-medium text-subtle">
              {period}
            </span>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {items.map((item, index) => (
              <div
                key={`${String(item.label)}-${index}`}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
              >
                <p className="text-[11px] font-semibold text-subtle">{item.label}</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-ink">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
