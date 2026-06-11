export type ChecklistPurposeId =
  | "simulation"
  | "real_decision"
  | "new_data_update"
  | "price_volume_event"
  | "unclear_thesis";

export type ChecklistStatusId =
  | "not_started"
  | "in_progress"
  | "basic_ok"
  | "need_more_check"
  | "missing_important_data";

export type ReadinessStatus =
  | "Sẵn sàng cho bước tiếp theo"
  | "Tạm đủ để mô phỏng"
  | "Cần kiểm tra thêm"
  | "Chưa nên đi tiếp"
  | "Thiếu dữ liệu quan trọng"
  | "Có thể mô phỏng với cảnh báo";

export type ChecklistPurpose = {
  id: ChecklistPurposeId;
  label: string;
  description: string;
  priorityGroupIds: string[];
  explanation: string;
};

export type ChecklistGroup = {
  id: string;
  name: string;
  goal: string;
  status: ChecklistStatusId;
  answered: number;
  total: number;
  missingPoints: string[];
  relatedModules: Array<{
    label: string;
    moduleKey: string;
  }>;
  questions: string[];
  softWarning?: string;
};

export type ChecklistState = {
  ticker: string;
  companyName: string;
  industry: string;
  checklistPurpose: ChecklistPurposeId;
  readinessStatus: ReadinessStatus;
  completedGroups: number;
  totalGroups: number;
  missingPoints: string[];
  thesis: string;
  confirmingData: string[];
  disconfirmingData: string[];
  groups: ChecklistGroup[];
  result: {
    readiness: ReadinessStatus;
    nextAction: string;
    suggestedModules: Array<{
      label: string;
      moduleKey: string;
    }>;
    recommendedLessons: string[];
  };
};
