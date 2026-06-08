import { Chip } from "@/components/ui";
import type { WatchlistFiltersData } from "../types";
import { WatchlistSectionCard } from "./WatchlistPrimitives";

type WatchlistFiltersProps = {
  data: WatchlistFiltersData;
};

const filterGroups = [
  {
    title: "Nhóm ngành",
    items: ["Công nghệ", "Ngân hàng", "Thép", "Bán lẻ", "Logistics"],
  },
  {
    title: "Trạng thái phân tích",
    items: ["Mới thêm", "Đang phân tích", "Cần xem lại", "Đang mô phỏng"],
  },
  {
    title: "Mức ưu tiên",
    items: ["Cao", "Vừa", "Theo dõi nhẹ", "Chờ dữ liệu"],
  },
  {
    title: "Module còn thiếu",
    items: ["Hiểu DN", "Ngành", "BCTC", "Định giá", "PVT", "Rủi ro"],
  },
  {
    title: "Rủi ro chính",
    items: ["Định giá", "FOMO", "Tài chính", "Thanh khoản", "Quản trị"],
  },
];

export function WatchlistFilters({ data }: WatchlistFiltersProps) {
  const title = data.title ? "Bộ lọc" : "Bộ lọc";

  return (
    <WatchlistSectionCard
      description="Lọc để biết cổ phiếu nào cần làm tiếp, không phải để tìm tín hiệu hành động."
      icon="FL"
      title={title}
    >
      <div className="space-y-4">
        {filterGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-bold text-ink">{group.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <Chip key={item} size="sm" variant="neutral">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-2 text-xs font-bold text-ink">Sắp xếp theo</p>
          <div className="grid gap-1.5">
            {["Mới thêm", "Cần xem lại trước", "Ưu tiên cao", "Gần sự kiện"].map((sort) => (
              <button
                key={sort}
                className="rounded-[3px] border border-border-soft bg-surface-soft px-2 py-1.5 text-left text-xs font-semibold text-muted hover:border-border hover:text-ink"
                type="button"
              >
                {sort}
              </button>
            ))}
          </div>
        </div>
      </div>
    </WatchlistSectionCard>
  );
}
