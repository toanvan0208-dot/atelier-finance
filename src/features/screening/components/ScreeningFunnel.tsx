import { Card, CardBody, Chip, SectionHeader } from "@/components/ui";
import type { ScreeningFunnelLayer } from "../types";

type ScreeningFunnelProps = {
  title: string;
  description: string;
  layers: ScreeningFunnelLayer[];
};

function statusTone(status: ScreeningFunnelLayer["status"]) {
  if (status === "Đạt") return "success";
  if (status === "Cần kiểm tra") return "warning";
  if (status === "Cảnh báo") return "danger";
  return "neutral";
}

export function ScreeningFunnel({
  description,
  layers,
  title,
}: ScreeningFunnelProps) {
  return (
    <section>
      <SectionHeader description={description} icon="5" title={title} />
      <Card>
        <CardBody>
          <div className="grid gap-3 lg:grid-cols-5">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="relative rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface text-[11px] font-bold text-accent">
                    {layer.icon}
                  </span>
                  <Chip size="sm" variant={statusTone(layer.status)}>
                    {layer.status}
                  </Chip>
                </div>
                <h3 className="mt-3 text-sm font-bold text-ink">{layer.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-ink">
                  {layer.question}
                </p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-accent">
                    Vì sao quan trọng?
                  </summary>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {layer.explanation}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
