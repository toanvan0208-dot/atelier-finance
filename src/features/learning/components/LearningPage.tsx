"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/ui";
import { learningPageData } from "../data/learning.data";
import {
  AILearningCoachPanel,
  ContextualLearningHint,
  ErrorBasedReviewSection,
  KnowledgeMap,
  LearningDashboard,
  LearningLessonCard,
  LearningPathSidebar,
  LearningProfileSummary,
  LessonDetailView,
  PracticeSection,
  RecommendedLessonQueue,
} from "./LearningBlocks";

export function LearningPage() {
  const data = learningPageData;
  const [activeCategoryId, setActiveCategoryId] = useState(data.categories[0].id);
  const [activeLessonId, setActiveLessonId] = useState(
    data.lessons.find((lesson) => lesson.status === "AI gợi ý")?.id ?? data.lessons[0].id
  );

  const activeCategory = useMemo(
    () =>
      data.categories.find((category) => category.id === activeCategoryId) ??
      data.categories[0],
    [activeCategoryId, data.categories]
  );

  const visibleLessons = useMemo(() => {
    const categoryLessonIds = new Set(activeCategory.lessonIds);
    return data.lessons.filter((lesson) => categoryLessonIds.has(lesson.id));
  }, [activeCategory.lessonIds, data.lessons]);

  const selectedLesson = useMemo(
    () =>
      data.lessons.find((lesson) => lesson.id === activeLessonId) ??
      visibleLessons[0] ??
      data.lessons[0],
    [activeLessonId, data.lessons, visibleLessons]
  );

  const recommendedLessons = data.lessons.filter((lesson) => lesson.status === "AI gợi ý").slice(0, 5);

  function handleSelectCategory(categoryId: string) {
    const nextCategory = data.categories.find((category) => category.id === categoryId);
    setActiveCategoryId(categoryId);

    if (nextCategory?.lessonIds[0]) {
      setActiveLessonId(nextCategory.lessonIds[0]);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-5">
      <LearningDashboard data={data.dashboard} />

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside>
          <LearningPathSidebar
            activeCategory={activeCategoryId}
            categories={data.categories}
            onSelect={handleSelectCategory}
          />
        </aside>

        <main className="min-w-0 space-y-5">
          <SectionHeader
            title={activeCategory.title}
            description={`${activeCategory.goal} Module liên quan: ${activeCategory.relatedModule}.`}
          />

          <div className="grid gap-3 md:grid-cols-2">
            {visibleLessons.map((lesson) => (
              <LearningLessonCard
                key={lesson.id}
                lesson={lesson}
                isSelected={lesson.id === selectedLesson.id}
                onOpen={setActiveLessonId}
              />
            ))}
          </div>

          <LessonDetailView lesson={selectedLesson} />

          <section className="space-y-3">
            <SectionHeader
              title="Gợi ý học đúng lúc"
              description="Các hint này có thể nhúng trong Vĩ mô, BCTC hoặc Mô phỏng khi người dùng thiếu kiến thức."
            />
            <div className="grid gap-3 lg:grid-cols-3">
              {data.contextualHints.map((hint) => (
                <ContextualLearningHint key={`${hint.relatedModule}-${hint.lessonTitle}`} data={hint} />
              ))}
            </div>
          </section>

          <ErrorBasedReviewSection items={data.errorReviews} />
          <PracticeSection items={data.practice} />
          <KnowledgeMap categories={data.categories} onSelect={handleSelectCategory} />
          <LearningProfileSummary profile={data.profile} />
        </main>

        <aside className="space-y-4">
          <AILearningCoachPanel data={data.coach} />
          <RecommendedLessonQueue lessons={recommendedLessons} />
        </aside>
      </div>
    </div>
  );
}
