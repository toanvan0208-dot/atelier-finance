export type MacroObservationFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "event_based"
  | "unknown";

export type MacroFreshnessStatus = "fresh" | "stale" | "unknown";

export type MacroObservationFreshness = {
  staleStatus: MacroFreshnessStatus;
  ageDays?: number;
  maxAgeDays?: number;
  reason: string;
};

export function evaluateMacroObservationFreshness({
  observationDate,
  expectedFrequency,
  asOfDate,
}: {
  observationDate?: string | null;
  expectedFrequency?: MacroObservationFrequency;
  asOfDate?: string | Date;
}): MacroObservationFreshness {
  if (!observationDate) {
    return {
      staleStatus: "unknown",
      reason: "Chưa có dữ liệu quan sát trong hệ thống",
    };
  }

  const obsDate = new Date(observationDate);
  const now = asOfDate ? new Date(asOfDate) : new Date();
  
  if (isNaN(obsDate.getTime())) {
    return {
      staleStatus: "unknown",
      reason: "Ngày quan sát không hợp lệ",
    };
  }

  const ageMs = now.getTime() - obsDate.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  let maxAgeDays = 0;

  switch (expectedFrequency) {
    case "daily":
      maxAgeDays = 5; // Allow for weekends/holidays
      break;
    case "weekly":
      maxAgeDays = 14;
      break;
    case "monthly":
      maxAgeDays = 60; // Up to 2 months
      break;
    case "quarterly":
      maxAgeDays = 150; // Up to 5 months
      break;
    case "annual":
      maxAgeDays = 450; // Up to 15 months to account for publishing delays
      break;
    case "event_based":
    case "unknown":
    default:
      return {
        staleStatus: "unknown",
        ageDays,
        reason: "Tần suất không xác định hoặc dựa trên sự kiện, không thể tự động đánh giá độ trễ.",
      };
  }

  if (ageDays > maxAgeDays) {
    return {
      staleStatus: "stale",
      ageDays,
      maxAgeDays,
      reason: `Dữ liệu đã cũ (${ageDays} ngày), vượt quá giới hạn cho phép (${maxAgeDays} ngày).`,
    };
  }

  return {
    staleStatus: "fresh",
    ageDays,
    maxAgeDays,
    reason: `Dữ liệu vẫn trong giới hạn cập nhật (${ageDays}/${maxAgeDays} ngày).`,
  };
}
