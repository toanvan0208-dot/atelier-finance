import { Chip } from "@/components/ui";
import type { ValuationDisclaimerData } from "../types";

type ValuationDisclaimerProps = {
  data: ValuationDisclaimerData;
};

export function ValuationDisclaimer({ data }: ValuationDisclaimerProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-warning/15 px-4 py-4 shadow-soft">
      <Chip variant="warning">{data.title}</Chip>
      <p className="mt-3 text-sm leading-7 text-muted">{data.content}</p>
    </section>
  );
}
