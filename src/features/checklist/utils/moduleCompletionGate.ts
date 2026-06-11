import type {
  AnalysisModuleCompletion,
  AnalysisModuleStatus,
  ChecklistBlockingModule,
} from "../types";

const minimumStatuses = new Set<AnalysisModuleStatus>([
  "minimum_completed",
  "completed",
]);

export function getModuleCompletionStatus(
  moduleCompletion: AnalysisModuleCompletion
): AnalysisModuleStatus {
  if (moduleCompletion.status === "completed" && moduleCompletion.missingOutputs.length > 0) {
    return "needs_update";
  }

  if (moduleCompletion.completionPercent <= 0) {
    return "not_started";
  }

  return moduleCompletion.status;
}

export function canUnlockStandardChecklist(
  modules: AnalysisModuleCompletion[]
): boolean {
  return modules
    .filter((module) => module.required)
    .every((module) => minimumStatuses.has(getModuleCompletionStatus(module)));
}

export function canUnlockFullSimulationChecklist(
  modules: AnalysisModuleCompletion[]
): boolean {
  return modules
    .filter((module) => module.required)
    .every((module) => getModuleCompletionStatus(module) === "completed");
}

export function getChecklistBlockingModules(
  modules: AnalysisModuleCompletion[]
): ChecklistBlockingModule[] {
  return modules
    .filter((module) => module.required)
    .filter((module) => !minimumStatuses.has(getModuleCompletionStatus(module)))
    .map((module) => ({
      moduleKey: module.moduleKey,
      moduleName: module.moduleName,
      status: getModuleCompletionStatus(module),
      missingOutputs: module.missingOutputs,
      blockingReason:
        module.blockingReason ??
        module.missingOutputs[0] ??
        "Chưa đủ output tối thiểu để mở bài kiểm tra.",
      navigateTo: module.navigateTo,
    }));
}

export function getFullChecklistBlockingModules(
  modules: AnalysisModuleCompletion[]
): ChecklistBlockingModule[] {
  return modules
    .filter((module) => module.required)
    .filter((module) => getModuleCompletionStatus(module) !== "completed")
    .map((module) => ({
      moduleKey: module.moduleKey,
      moduleName: module.moduleName,
      status: getModuleCompletionStatus(module),
      missingOutputs:
        module.status === "minimum_completed" && module.missingOutputs.length === 0
          ? ["Cần lưu kết luận đầy đủ trước khi mô phỏng."]
          : module.missingOutputs,
      blockingReason:
        module.status === "needs_update"
          ? "Module có dữ liệu cần cập nhật, chưa được tính là hoàn thành đầy đủ."
          : module.blockingReason ??
            module.missingOutputs[0] ??
            "Chưa đạt trạng thái hoàn thành đầy đủ.",
      navigateTo: module.navigateTo,
    }));
}
