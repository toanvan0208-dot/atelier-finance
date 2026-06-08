import { Chip } from "@/components/ui";
import type { AddStockIdeaFormData } from "../types";
import { TextStack, WatchlistSectionCard } from "./WatchlistPrimitives";

type AddStockIdeaFormProps = {
  data: AddStockIdeaFormData;
};

export function AddStockIdeaForm({ data }: AddStockIdeaFormProps) {
  return (
    <WatchlistSectionCard description={data.description} icon="+" title={data.title}>
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {data.fields.map((field) => (
            <div
              key={field}
              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
            >
              <p className="text-[11px] font-semibold text-subtle">{field}</p>
              <p className="mt-1 text-xs font-bold text-ink">Chưa nhập</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-ink">Gợi ý lý do theo dõi</p>
          <div className="flex flex-wrap gap-2">
            {data.reasonSuggestions.map((reason) => (
              <Chip key={reason} size="sm" variant="neutral">
                {reason}
              </Chip>
            ))}
          </div>
        </div>
        <TextStack items={[data.softWarning]} />
      </div>
    </WatchlistSectionCard>
  );
}
