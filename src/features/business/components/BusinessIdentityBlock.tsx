import type { BusinessIdentityData, BusinessSectionLabels } from "../types";
import { AiExplanationBox } from "./AiExplanationBox";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { BusinessSectionCard } from "./BusinessSectionCard";

type BusinessIdentityBlockProps = {
  data: BusinessIdentityData;
  labels: BusinessSectionLabels;
};

export function BusinessIdentityBlock({ data, labels }: BusinessIdentityBlockProps) {
  return (
    <BusinessSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <BusinessFieldGrid items={data.fields} />
        <AiExplanationBox data={data.ai} fallbackTitle={labels.aiTitle} />
      </div>
    </BusinessSectionCard>
  );
}
