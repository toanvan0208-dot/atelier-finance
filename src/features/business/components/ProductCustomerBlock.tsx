import type { ProductCustomerData } from "../types";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { BusinessSectionCard } from "./BusinessSectionCard";

type ProductCustomerBlockProps = {
  data: ProductCustomerData;
};

export function ProductCustomerBlock({ data }: ProductCustomerBlockProps) {
  return (
    <BusinessSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <p className="mb-3 text-sm font-bold text-ink">{data.productsTitle}</p>
          <BusinessFieldGrid columns="one" items={data.products} />
        </div>
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <p className="mb-3 text-sm font-bold text-ink">{data.customersTitle}</p>
          <BusinessFieldGrid columns="one" items={data.customers} />
        </div>
      </div>
    </BusinessSectionCard>
  );
}
