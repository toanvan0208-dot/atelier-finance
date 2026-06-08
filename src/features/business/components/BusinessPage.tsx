import { EmptyState, LoadingState, SectionHeader } from "@/components/ui";
import { businessPageData } from "../data/business.data";
import { BusinessDisclaimer } from "./BusinessDisclaimer";
import { BusinessEcosystemBlock } from "./BusinessEcosystemBlock";
import { BusinessHeader } from "./BusinessHeader";
import { BusinessIdentityBlock } from "./BusinessIdentityBlock";
import { BusinessNextActions } from "./BusinessNextActions";
import { BusinessQuickSummary } from "./BusinessQuickSummary";
import { BusinessRiskBlock } from "./BusinessRiskBlock";
import { BusinessStepAccordion } from "./BusinessStepAccordion";
import { BusinessTypeTags } from "./BusinessTypeTags";
import { CapitalAllocationBlock } from "./CapitalAllocationBlock";
import { CompetitiveAdvantageBlock } from "./CompetitiveAdvantageBlock";
import { DriverBlock } from "./DriverBlock";
import { GovernanceBlock } from "./GovernanceBlock";
import { IndustryThesisLinkBlock } from "./IndustryThesisLinkBlock";
import { ProductCustomerBlock } from "./ProductCustomerBlock";
import { RevenueSourceBlock } from "./RevenueSourceBlock";
import { ScalabilityBlock } from "./ScalabilityBlock";
import { ValueChainPositionBlock } from "./ValueChainPositionBlock";

export function BusinessPage() {
  const data = businessPageData;
  const steps = data.progress.steps;

  if (data.isLoading) {
    return (
      <LoadingState
        description={data.loading.description}
        title={data.loading.title}
      />
    );
  }

  if (!data.header.ticker) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6">
      <BusinessHeader data={data.header} />
      <BusinessQuickSummary data={data.quickSummary} />

      <SectionHeader
        description={data.contentHeader.description}
        eyebrow={data.contentHeader.eyebrow}
        icon={data.contentHeader.icon}
        title={data.contentHeader.title}
      />

      <BusinessStepAccordion
        data={data.progress}
        items={[
          {
            step: steps[0],
            content: <BusinessIdentityBlock data={data.identity} labels={data.labels} />,
          },
          {
            step: steps[1],
            content: <BusinessTypeTags data={data.businessType} />,
          },
          {
            step: steps[2],
            content: <ProductCustomerBlock data={data.productCustomer} />,
          },
          {
            step: steps[3],
            content: <RevenueSourceBlock data={data.revenueSource} />,
          },
          {
            step: steps[4],
            content: <DriverBlock data={data.drivers} />,
          },
          {
            step: steps[5],
            content: <ValueChainPositionBlock data={data.valueChain} />,
          },
          {
            step: steps[6],
            content: <BusinessEcosystemBlock data={data.ecosystem} />,
          },
          {
            step: steps[7],
            content: <GovernanceBlock data={data.governance} />,
          },
          {
            step: steps[8],
            content: <CapitalAllocationBlock data={data.capitalAllocation} />,
          },
          {
            step: steps[9],
            content: <IndustryThesisLinkBlock data={data.industryThesis} />,
          },
          {
            step: steps[10],
            content: <CompetitiveAdvantageBlock data={data.competitiveAdvantage} />,
          },
          {
            step: steps[11],
            content: <ScalabilityBlock data={data.scalability} />,
          },
          {
            step: steps[12],
            content: <BusinessRiskBlock data={data.risks} />,
          },
        ]}
      />

      <div className="space-y-5">
        <BusinessDisclaimer data={data.disclaimer} />
        <BusinessNextActions data={data.nextActions} />
      </div>
    </div>
  );
}
