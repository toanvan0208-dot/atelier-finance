"use client";

import { useMemo, useState } from "react";
import { learningPageData } from "../data/learning.data";
import {
  ActiveLessonPanel,
  AIRecommendationDrawer,
  CurrentLearningPositionCard,
  LearningHeader,
  LearningTabs,
  MistakeReviewView,
  OnePracticeBlock,
  ProfileView,
  RelatedLessonsCompact,
  RoadmapView,
  TodayCoachCard,
} from "./LearningBlocks";

export function LearningPage() {
  const data = learningPageData;
  const [activeTab, setActiveTab] = useState("today");
  const [activeStageId, setActiveStageId] = useState(data.stages[0].id);
  const [activeLessonId, setActiveLessonId] = useState(data.todayLessonId);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);

  const activeLesson = useMemo(
    () =>
      data.lessons.find((lesson) => lesson.id === activeLessonId) ??
      data.lessons.find((lesson) => lesson.id === data.todayLessonId) ??
      data.lessons[0],
    [activeLessonId, data.lessons, data.todayLessonId]
  );

  const todayLesson = useMemo(
    () =>
      data.lessons.find((lesson) => lesson.id === data.todayLessonId) ??
      data.lessons[0],
    [data.lessons, data.todayLessonId]
  );

  const recommendedLessons = useMemo(
    () =>
      data.lessons
        .filter((lesson) => lesson.status === "AI gợi ý" && lesson.id !== activeLesson.id)
        .slice(0, 6),
    [activeLesson.id, data.lessons]
  );

  function handleViewRoadmap() {
    setActiveStageId(todayLesson.stageId);
    setActiveTab("roadmap");
  }

  function handleSelectLesson(lessonId: string) {
    const nextLesson = data.lessons.find((lesson) => lesson.id === lessonId);
    setActiveLessonId(lessonId);
    if (nextLesson) {
      setActiveStageId(nextLesson.stageId);
    }
    setActiveTab("today");
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <LearningHeader
        description={data.header.description}
        eyebrow={data.header.eyebrow}
        title={data.header.title}
      />

      <LearningTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "today" ? (
        <div className="space-y-5">
          <TodayCoachCard lesson={todayLesson} onStartLesson={handleSelectLesson} />
          <CurrentLearningPositionCard
            lesson={todayLesson}
            stages={data.stages}
            onViewRoadmap={handleViewRoadmap}
          />
          <ActiveLessonPanel lesson={activeLesson} />
          <RelatedLessonsCompact
            lessons={recommendedLessons}
            onOpenDrawer={() => setIsRecommendationOpen(true)}
            onSelectLesson={handleSelectLesson}
          />
          <OnePracticeBlock lesson={activeLesson} />
        </div>
      ) : null}

      {activeTab === "roadmap" ? (
        <RoadmapView
          activeStageId={activeStageId}
          lessons={data.lessons}
          stages={data.stages}
          onSelectLesson={handleSelectLesson}
        />
      ) : null}

      {activeTab === "mistakes" ? (
        <MistakeReviewView
          lessons={data.lessons}
          mistakes={data.mistakes}
          onSelectLesson={handleSelectLesson}
        />
      ) : null}

      {activeTab === "profile" ? (
        <ProfileView
          lessons={data.lessons}
          profile={data.profile}
          stages={data.stages}
        />
      ) : null}

      <AIRecommendationDrawer
        lessons={recommendedLessons}
        open={isRecommendationOpen}
        onClose={() => setIsRecommendationOpen(false)}
        onSelectLesson={handleSelectLesson}
      />
    </div>
  );
}
