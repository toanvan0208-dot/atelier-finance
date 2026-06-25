import { cn } from "@/lib/cn";

export type DataQualityBannerProps = {
  source?: string | null;
  asOf?: string | Date | null;
  isDemoData?: boolean;
  isResearchOnly?: boolean;
  isStale?: boolean;
  missingFields?: string[];
  className?: string;
};

const formatDate = (value?: string | Date | null): string | null => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const statusLabel = ({
  isDemoData,
  isResearchOnly,
}: {
  isDemoData: boolean;
  isResearchOnly: boolean;
}): string => {
  if (isDemoData) return "Dữ liệu minh họa";
  if (isResearchOnly) return "Dữ liệu nghiên cứu (productionApproved: false)";
  return "Dữ liệu có metadata nguồn";
};

const statusDescription = ({
  isDemoData,
  isResearchOnly,
}: {
  isDemoData: boolean;
  isResearchOnly: boolean;
}): string => {
  if (isDemoData) {
    return "Dữ liệu minh họa chỉ dùng để tham khảo cách hiển thị, không dùng để ra quyết định thật.";
  }

  if (isResearchOnly) {
    return "Nguồn đang kiểm tra, chưa phê duyệt sản xuất. Dữ liệu chưa dùng như dữ liệu chính thức.";
  }

  return "Dữ liệu có metadata nguồn, nhưng vẫn cần kiểm tra kỹ trước khi tin cậy.";
};

export function DataQualityBanner({
  source,
  asOf,
  isDemoData = false,
  isResearchOnly = false,
  isStale = false,
  missingFields = [],
  className,
}: DataQualityBannerProps) {
  const formattedAsOf = formatDate(asOf);
  const hasMissingFields = missingFields.length > 0;

  return (
    <section
      className={cn(
        "rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-4 py-3 text-xs leading-5 text-[#765416]",
        className,
      )}
      aria-label="Trang thai chat luong du lieu"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[3px] border border-[#D6B15C] bg-surface px-2 py-1 text-[11px] font-bold text-[#765416]">
              {statusLabel({ isDemoData, isResearchOnly })}
            </span>
            {isStale ? (
              <span className="rounded-[3px] border border-[#D6B15C] bg-surface px-2 py-1 text-[11px] font-bold text-[#765416]">
                Có thể đã cũ
              </span>
            ) : null}
            {hasMissingFields ? (
              <span className="rounded-[3px] border border-[#D6B15C] bg-surface px-2 py-1 text-[11px] font-bold text-[#765416]">
                Thiếu {missingFields.length} trường (Chưa đủ dữ liệu)
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-semibold">{statusDescription({ isDemoData, isResearchOnly })}</p>
          {hasMissingFields ? (
            <p className="mt-1">
              Một số trường dữ liệu còn thiếu: {missingFields.slice(0, 5).join(", ")}
              {missingFields.length > 5 ? ", ..." : ""}.
            </p>
          ) : null}
          <p className="mt-1">Không xem đây là lời khuyên đầu tư.</p>
        </div>
        <dl className="grid shrink-0 gap-1 text-[11px] lg:min-w-[220px]">
          <div className="flex justify-between gap-3">
            <dt className="font-bold">Nguồn</dt>
            <dd className="text-right">{source || "Chưa rõ nguồn dữ liệu"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold">Mốc dữ liệu</dt>
            <dd className="text-right">{formattedAsOf || "Chưa có mốc dữ liệu"}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
