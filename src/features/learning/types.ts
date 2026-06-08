export type LessonLevel = "Cơ bản" | "Trung bình" | "Nâng cao";
export type LessonStatus = "Chưa học" | "Đang học" | "Đã học" | "Cần ôn lại" | "AI gợi ý";
export type CategoryStatus = "Chưa bắt đầu" | "Đang học" | "Tạm ổn" | "Cần ôn lại";
export type ModuleReadiness =
  | "Chưa sẵn sàng"
  | "Có thể dùng với hướng dẫn"
  | "Có thể dùng cơ bản"
  | "Cần ôn lại"
  | "Đã hiểu khá tốt";

export type LearningQuiz = {
  question: string;
  answer: string;
};

export type LearningMiniCase = {
  prompt: string;
  goodAnswer: string;
};

export type LearningLesson = {
  id: string;
  title: string;
  category: string;
  duration: string;
  level: LessonLevel;
  relatedModules: string[];
  problemSolved: string;
  status: LessonStatus;
  goal: string;
  plainExplanation: string;
  realExample: string;
  dataToCheck: string[];
  commonMistake: string;
  linkedModules: string[];
  quiz: LearningQuiz;
  miniCase?: LearningMiniCase;
  outcome: string;
};

export type LearningCategory = {
  id: string;
  title: string;
  goal: string;
  relatedModule: string;
  status: CategoryStatus;
  learnedCount: number;
  weakCount: number;
  lessonIds: string[];
};

export type LearningDashboardData = {
  recommendedToday: string;
  currentContext: string;
  weakTopics: string[];
  progress: Array<{ label: string; value: string; detail: string }>;
  recentMistake: string;
  moduleBeforeContinue: string;
};

export type AILearningCoachData = {
  learningFor: string;
  reason: string;
  preQuestion: string;
  afterLesson: string;
  actions: string[];
};

export type ErrorReviewItem = {
  title: string;
  example: string;
  suggestedLessons: string[];
};

export type PracticeItem = {
  type: "Quiz khái niệm" | "Quiz tình huống" | "Mini case";
  title: string;
  prompt: string;
  goodAnswer: string;
  feedback: string;
};

export type LearningProfile = {
  level: string;
  learnedTopics: string[];
  weakTopics: string[];
  recommendedLessons: string[];
  completedQuiz: string;
  completedMiniCase: string;
  repeatedMistakes: string[];
  relatedModules: string[];
  nextLessons: string[];
  readiness: Array<{ moduleName: string; status: ModuleReadiness; reason: string }>;
  reviewQueue: string[];
  personalNote: string;
};

export type ContextualLearningHintData = {
  title: string;
  reason: string;
  lessonTitle: string;
  duration: string;
  relatedModule: string;
};

export type LearningPageData = {
  dashboard: LearningDashboardData;
  categories: LearningCategory[];
  lessons: LearningLesson[];
  coach: AILearningCoachData;
  contextualHints: ContextualLearningHintData[];
  errorReviews: ErrorReviewItem[];
  practice: PracticeItem[];
  profile: LearningProfile;
};
