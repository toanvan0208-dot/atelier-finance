export type LessonLevel = "Cơ bản" | "Trung bình" | "Nâng cao";
export type LessonStatus = "Chưa học" | "Đang học" | "Đã học" | "Cần ôn lại" | "AI gợi ý";
export type StageStatus = "Đang học" | "Tạm ổn" | "Cần ôn" | "Chưa bắt đầu";
export type ModuleReadinessStatus =
  | "Sẵn sàng dùng"
  | "Có thể dùng với hướng dẫn"
  | "Cần học thêm trước"
  | "Cần ôn lại";

export type LearningTabId = "today" | "roadmap" | "mistakes" | "profile";

export type MistakeSelfCheck = "Tôi đã mắc lỗi này" | "Tôi chưa chắc" | "Tôi muốn luyện thêm";

export type LearningQuiz = {
  question: string;
  answer: string;
  options?: string[];
  explanation?: string;
};

export type LearningMiniCase = {
  prompt: string;
  goodAnswer: string;
  options?: string[];
};

export type LearningLesson = {
  id: string;
  title: string;
  duration: string;
  level: LessonLevel;
  stageId: string;
  relatedModules: string[];
  status: LessonStatus;
  problemSolved: string;
  whySuggested: string;
  outcome: string;
  concept: string;
  simpleExplanation: string;
  usedInModule: string;
  realExample: string;
  commonMistake: string;
  dataToCheck: string[];
  quiz: LearningQuiz;
  miniCase?: LearningMiniCase;
};

export type LearningStage = {
  id: string;
  title: string;
  description: string;
  relatedModules: string[];
  progress: {
    completed: number;
    total: number;
  };
  status: StageStatus;
  lessonIds: string[];
};

export type LearningMistake = {
  id: string;
  title: string;
  signal: string;
  danger: string;
  miniCase: string;
  relatedLessonIds: string[];
  severity: "high" | "medium" | "low";
};

export type ModuleReadiness = {
  moduleName: string;
  status: ModuleReadinessStatus;
  reason: string;
  recommendedLessonId: string;
};

export type LearningProfile = {
  level: string;
  learnedTopics: string[];
  weakTopics: string[];
  completedLessons: string;
  completedQuiz: string;
  completedMiniCase: string;
  personalNote: string;
  readiness: ModuleReadiness[];
};

export type LearningPageData = {
  header: {
    eyebrow: string;
    title: string;
    description: string;
  };
  todayLessonId: string;
  stages: LearningStage[];
  lessons: LearningLesson[];
  mistakes: LearningMistake[];
  profile: LearningProfile;
};
