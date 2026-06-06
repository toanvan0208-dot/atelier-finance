import type { IndustryThesisLinkData } from "../types";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { BusinessSectionCard } from "./BusinessSectionCard";

type IndustryThesisLinkBlockProps = {
  data: IndustryThesisLinkData;
};

export function IndustryThesisLinkBlock({ data }: IndustryThesisLinkBlockProps) {
  return (
    <BusinessSectionCard description={data.description} icon={data.icon} title={data.title}>
      <BusinessFieldGrid items={data.fields} />
    </BusinessSectionCard>
  );
}
