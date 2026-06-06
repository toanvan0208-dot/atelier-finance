import { EmptyState, LoadingState, SectionHeader } from "@/components/ui";
import { businessPageData } from "../data/business.data";
import { BusinessDisclaimer } from "./BusinessDisclaimer";
import { BusinessEcosystemBlock } from "./BusinessEcosystemBlock";
import { BusinessHeader } from "./BusinessHeader";
import { BusinessIdentityBlock } from "./BusinessIdentityBlock";
import { BusinessNextActions } from "./BusinessNextActions";
import { BusinessProgressSidebar } from "./BusinessProgressSidebar";
import { BusinessQuickSummary } from "./BusinessQuickSummary";
import { BusinessRiskBlock } from "./BusinessRiskBlock";
import { BusinessTypeTags } from "./BusinessTypeTags";
import { BusinessUnderstandingChecklist } from "./BusinessUnderstandingChecklist";
import { CapitalAllocationBlock } from "./CapitalAllocationBlock";
import { CompetitiveAdvantageBlock } from "./CompetitiveAdvantageBlock";
import { DriverBlock } from "./DriverBlock";
import { GovernanceBlock } from "./GovernanceBlock";
import { IndustryThesisLinkBlock } from "./IndustryThesisLinkBlock";
import { PersonalBusinessThesis } from "./PersonalBusinessThesis";
import { ProductCustomerBlock } from "./ProductCustomerBlock";
import { RevenueSourceBlock } from "./RevenueSourceBlock";
import { ScalabilityBlock } from "./ScalabilityBlock";
import { ValueChainPositionBlock } from "./ValueChainPositionBlock";

export function BusinessPage() {
  const data = businessPageData;

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

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <BusinessProgressSidebar data={data.progress} />

        <div className="space-y-5">
          <BusinessIdentityBlock data={data.identity} labels={data.labels} />
          <BusinessTypeTags data={data.businessType} />
          <ProductCustomerBlock data={data.productCustomer} />
          <RevenueSourceBlock data={data.revenueSource} />
          <DriverBlock data={data.drivers} />
          <ValueChainPositionBlock data={data.valueChain} />
          <BusinessEcosystemBlock data={data.ecosystem} />
          <GovernanceBlock data={data.governance} />
          <CapitalAllocationBlock data={data.capitalAllocation} />
          <IndustryThesisLinkBlock data={data.industryThesis} />
          <CompetitiveAdvantageBlock data={data.competitiveAdvantage} />
          <ScalabilityBlock data={data.scalability} />
          <BusinessRiskBlock data={data.risks} />
          <PersonalBusinessThesis data={data.personalThesis} />
          <BusinessUnderstandingChecklist data={data.checklist} />
          <BusinessDisclaimer data={data.disclaimer} />
          <BusinessNextActions data={data.nextActions} />
        </div>
      </div>
    </div>
  );
}
