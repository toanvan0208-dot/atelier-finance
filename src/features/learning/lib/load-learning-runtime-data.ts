import { learningPageData } from "../data/learning.data";
import type { LearningRuntimeData } from "../types";

export function loadLearningRuntimeData(): LearningRuntimeData {
  return {
    ...learningPageData,
    contentMode: "educational_static",
    sourceLabel: "atelier_learning_static_content",
    productionApproved: false,
  };
}
