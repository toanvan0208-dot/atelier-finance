import {
  industryBeneficiariesData,
  industryDeepDiveData,
  industryHealthData,
  industryImpactFactorsData,
  industryOutlookData,
  industryOverviewData,
  representativeStocksData,
} from "../data/industry.data";
import { IndustryBeneficiaries } from "./IndustryBeneficiaries";
import { IndustryDeepDive } from "./IndustryDeepDive";
import { IndustryHealthScore } from "./IndustryHealthScore";
import { IndustryImpactFactors } from "./IndustryImpactFactors";
import { IndustryOutlook } from "./IndustryOutlook";
import { IndustryOverview } from "./IndustryOverview";
import { RepresentativeStocks } from "./RepresentativeStocks";

export function IndustryPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-7">
      <div>
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
          <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
            {industryOverviewData.icon}
          </span>
          <span>{industryOverviewData.eyebrow}</span>
        </div>
        <h1 className="font-brand text-2xl font-bold text-ink">
          {industryOverviewData.title}
        </h1>
        <p className="mt-2 max-w-[68ch] text-sm leading-7 text-muted">
          {industryOverviewData.description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <IndustryOverview data={industryOverviewData} />
        <IndustryHealthScore data={industryHealthData} />
      </div>

      <IndustryImpactFactors data={industryImpactFactorsData} />
      <IndustryOutlook data={industryOutlookData} />
      <IndustryBeneficiaries data={industryBeneficiariesData} />
      <RepresentativeStocks data={representativeStocksData} />
      <IndustryDeepDive data={industryDeepDiveData} />
    </div>
  );
}
