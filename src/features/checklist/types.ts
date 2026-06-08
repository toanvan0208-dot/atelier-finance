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
  | "Có thể đi tiếp"
  | "Cần kiểm tra thêm"
  | "Chưa nên quyết định vội"
  | "Nên mô phỏng trước"
  | "Nên quay lại phân tích";

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
