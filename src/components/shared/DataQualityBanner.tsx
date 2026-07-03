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

const statusLabel = ({
  isDemoData,
  isResearchOnly,
}: {
  isDemoData: boolean;
  isResearchOnly: boolean;
}): string => {
  if (isDemoData) return "Dữ liệu minh họa";
  if (isResearchOnly) return "Dữ liệu nghiên cứu, cần rà soát";
  return "Dữ liệu có thông tin nguồn";
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
    return "Nguồn đang được kiểm tra. Dữ liệu này chỉ dùng để tham khảo trong quá trình phân tích, chưa xem như dữ liệu chính thức.";
  }

  return "Dữ liệu có thông tin nguồn, nhưng vẫn cần kiểm tra kỹ trước khi tin cậy.";
};

export function DataQualityBanner({
  isDemoData = false,
  isResearchOnly = false,
  isStale = false,
  missingFields = [],
  className,
}: DataQualityBannerProps) {
  const hasMissingFields = missingFields.length > 0;

  return (
    <section
      className={cn(
        "rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-4 py-3 text-xs leading-5 text-[#765416]",
        className,
      )}
      aria-label="Trang thai chat luong du lieu"
    >
      <div>
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
              Một số dữ liệu còn thiếu nên phần liên quan sẽ hiển thị là Chưa đủ dữ liệu hoặc N/A.
            </p>
          ) : null}
          <p className="mt-1">Không xem đây là lời khuyên đầu tư.</p>
        </div>
      </div>
    </section>
  );
}
