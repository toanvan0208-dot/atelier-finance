"use client";

import { Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { StockIdea, WatchlistFilterState, WatchlistSortBy, WatchlistStatus } from "../types";
import { WatchlistSectionCard } from "./WatchlistPrimitives";

type WatchlistFiltersProps = {
  filteredCount: number;
  filters: WatchlistFilterState;
  ideas: StockIdea[];
  onChange: (filters: WatchlistFilterState) => void;
  totalCount: number;
};

const sortOptions: Array<{ value: WatchlistSortBy; label: string }> = [
  { value: "priority", label: "Ưu tiên cao trước" },
  { value: "reviewDate", label: "Cần xem lại gần nhất" },
  { value: "missingThesis", label: "Thiếu thesis trước" },
  { value: "eventDate", label: "Có sự kiện gần trước" },
  { value: "progress", label: "Tiến độ cao trước" },
  { value: "recentlyAdded", label: "Mới thêm gần đây" },
];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function ToggleChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-[3px] border px-2 py-1 text-xs font-bold transition",
        active
          ? "border-border bg-accent-soft text-ink shadow-hard-sm"
          : "border-border-soft bg-surface-soft text-muted hover:border-border hover:text-ink"
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function WatchlistFilters({
  filteredCount,
  filters,
  ideas,
  onChange,
  totalCount,
}: WatchlistFiltersProps) {
  const industries = unique(ideas.map((idea) => idea.industry));
  const priorities = unique(ideas.map((idea) => idea.priority));
  const missingModules = unique(ideas.flatMap((idea) => idea.missingModules));
  const risks = unique(ideas.flatMap((idea) => idea.risks));
  const statuses = unique(ideas.map((idea) => idea.status)) as WatchlistStatus[];

  function update(next: Partial<WatchlistFilterState>) {
    onChange({ ...filters, ...next });
  }

  function toggleString(key: keyof WatchlistFilterState, value: string) {
    update({ [key]: filters[key] === value ? undefined : value });
  }

  function resetFilters() {
    onChange({ sortBy: "priority" });
  }

  return (
    <WatchlistSectionCard
      action={<Chip variant="neutral">{filteredCount}/{totalCount}</Chip>}
      description="Filter đang tác động trực tiếp tới workspace bên dưới."
      icon="FL"
      title="Bộ lọc kỷ luật"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-ink">Tìm mã hoặc thesis</span>
          <input
            className="mt-2 h-9 w-full rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm text-ink outline-none focus:bg-accent-soft"
            placeholder="VD: MWG, CFO, FOMO..."
            value={filters.search ?? ""}
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>

        <FilterGroup title="Trạng thái pipeline">
          {statuses.map((status) => (
            <ToggleChip
              key={status}
              active={filters.pipelineStatus === status}
              onClick={() => update({ pipelineStatus: filters.pipelineStatus === status ? "all" : status })}
            >
              {status}
            </ToggleChip>
          ))}
        </FilterGroup>

        <FilterGroup title="Ngành">
          {industries.map((industry) => (
            <ToggleChip
              key={industry}
              active={filters.industry === industry}
              onClick={() => toggleString("industry", industry)}
            >
              {industry}
            </ToggleChip>
          ))}
        </FilterGroup>

        <FilterGroup title="Mức ưu tiên">
          {priorities.map((priority) => (
            <ToggleChip
              key={priority}
              active={filters.priority === priority}
              onClick={() => toggleString("priority", priority)}
            >
              {priority}
            </ToggleChip>
          ))}
        </FilterGroup>

        <FilterGroup title="Module còn thiếu">
          {missingModules.slice(0, 8).map((module) => (
            <ToggleChip
              key={module}
              active={filters.missingModule === module}
              onClick={() => toggleString("missingModule", module)}
            >
              {module}
            </ToggleChip>
          ))}
        </FilterGroup>

        <FilterGroup title="Rủi ro chính">
          {risks.slice(0, 8).map((risk) => (
            <ToggleChip
              key={risk}
              active={filters.mainRisk === risk}
              onClick={() => toggleString("mainRisk", risk)}
            >
              {risk}
            </ToggleChip>
          ))}
        </FilterGroup>

        <FilterGroup title="Cờ kiểm tra nhanh">
          <ToggleChip active={Boolean(filters.hasEvent)} onClick={() => update({ hasEvent: !filters.hasEvent || undefined })}>
            Có sự kiện
          </ToggleChip>
          <ToggleChip active={filters.thesisStatus === "missing"} onClick={() => update({ thesisStatus: filters.thesisStatus === "missing" ? "all" : "missing" })}>
            Thiếu thesis
          </ToggleChip>
          <ToggleChip active={Boolean(filters.readyForSimulation)} onClick={() => update({ readyForSimulation: !filters.readyForSimulation || undefined })}>
            Sẵn sàng mô phỏng
          </ToggleChip>
          <ToggleChip active={Boolean(filters.pausedOnly)} onClick={() => update({ pausedOnly: !filters.pausedOnly || undefined })}>
            Tạm loại
          </ToggleChip>
          <ToggleChip active={Boolean(filters.fomoWarning)} onClick={() => update({ fomoWarning: !filters.fomoWarning || undefined })}>
            FOMO warning
          </ToggleChip>
        </FilterGroup>

        <div>
          <p className="mb-2 text-xs font-bold text-ink">Sắp xếp theo</p>
          <div className="grid gap-1.5">
            {sortOptions.map((sort) => (
              <button
                key={sort.value}
                className={cn(
                  "rounded-[3px] border px-2 py-1.5 text-left text-xs font-semibold transition",
                  filters.sortBy === sort.value
                    ? "border-border bg-accent-soft text-ink"
                    : "border-border-soft bg-surface-soft text-muted hover:border-border hover:text-ink"
                )}
                type="button"
                onClick={() => update({ sortBy: sort.value })}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" size="sm" variant="secondary" onClick={resetFilters}>
          Xóa bộ lọc
        </Button>
      </div>
    </WatchlistSectionCard>
  );
}

function FilterGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-ink">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
