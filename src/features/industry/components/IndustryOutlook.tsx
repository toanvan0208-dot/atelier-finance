import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { IndustryOutlookData } from "../types";

type IndustryOutlookProps = {
  data: IndustryOutlookData;
};

const outlookVariant = {
  positive: "success",
  neutral: "warning",
  negative: "danger",
} as const;

export function IndustryOutlook({ data }: IndustryOutlookProps) {
  return (
    <Card>
      <CardHeader
        chip={<Chip variant={outlookVariant[data.tone]}>{data.label}</Chip>}
        icon={data.icon}
        title={data.title}
      />
      <CardBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-subtle">
              {data.reasonsTitle}
            </p>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-muted">
              {data.reasons.map((reason) => (
                <li key={reason} className="rounded-md bg-surface-soft px-3 py-2">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-subtle">
              {data.watchItemsTitle}
            </p>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-muted">
              {data.watchItems.map((item) => (
                <li key={item} className="rounded-md bg-surface-soft px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
