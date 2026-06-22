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
  if (isDemoData) return "Du lieu mau tinh";
  if (isResearchOnly) return "Du lieu local research-only";
  return "Du lieu co metadata nguon";
};

const statusDescription = ({
  isDemoData,
  isResearchOnly,
}: {
  isDemoData: boolean;
  isResearchOnly: boolean;
}): string => {
  if (isDemoData) {
    return "Du lieu sample/static chi dung de minh hoa cach doc va kiem tra, khong phai du lieu san sang cho production.";
  }

  if (isResearchOnly) {
    return "Dữ liệu local/research-only dùng cho kiểm thử và nghiên cứu; chưa phê duyệt sản xuất và cần đọc kèm trạng thái nguồn.";
  }

  return "Du lieu co metadata nguon va moc thoi gian, van can kiem tra pham vi, readiness va quyen su dung truoc khi tin cay.";
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
                Co the da cu
              </span>
            ) : null}
            {hasMissingFields ? (
              <span className="rounded-[3px] border border-[#D6B15C] bg-surface px-2 py-1 text-[11px] font-bold text-[#765416]">
                Thieu {missingFields.length} truong
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-semibold">{statusDescription({ isDemoData, isResearchOnly })}</p>
          {hasMissingFields ? (
            <p className="mt-1">
              Mot so truong du lieu con thieu: {missingFields.slice(0, 5).join(", ")}
              {missingFields.length > 5 ? ", ..." : ""}.
            </p>
          ) : null}
          <p className="mt-1">Khong xem day la ket luan dau tu.</p>
        </div>
        <dl className="grid shrink-0 gap-1 text-[11px] lg:min-w-[220px]">
          <div className="flex justify-between gap-3">
            <dt className="font-bold">Nguon</dt>
            <dd className="text-right">{source || "Chua co nguon du lieu"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold">Moc du lieu</dt>
            <dd className="text-right">{formattedAsOf || "Chua co moc du lieu"}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
