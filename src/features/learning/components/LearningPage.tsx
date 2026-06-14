"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { learningPageData } from "../data/learning.data";
import type {
  LearningLesson,
  LearningTabId,
  LessonStatus,
  MistakeSelfCheck,
} from "../types";
import { LearningCoachBar } from "./LearningCoachBar";
import { LearningProgressCard } from "./LearningProgressCard";
import { LearningProfileView } from "./LearningProfileView";
import { LearningRoadmapView } from "./LearningRoadmapView";
import { LearningTabs } from "./LearningTabs";
import { MistakeRepairCenter } from "./MistakeRepairCenter";
import { TodayLearningView } from "./TodayLearningView";

const moduleKeyMap: Record<string, string> = {
  "Định giá": "valuation",
  "BCTC": "financials",
  "BCTC cơ bản": "financials",
  "PVT": "technical",
  "Rủi ro": "risk",
  "Checklist": "checklist",
  "Mô phỏng": "simulation",
  "Watchlist": "watchlist",
  "Vĩ mô": "macro",
  "Phân tích ngành": "industry",
  "Ngành": "industry",
  "Hiểu doanh nghiệp": "business",
  "Lọc cổ phiếu": "screening",
  "Nhật ký": "simulation",
};

type LearningPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

export function LearningPage({ onNavigate }: LearningPageProps) {
  const data = learningPageData;
  const [activeTab, setActiveTab] = useState<LearningTabId>("today");
  const [activeStageId, setActiveStageId] = useState(data.stages[0].id);
  const [activeLessonId, setActiveLessonId] = useState(data.todayLessonId);
  const [lessonStatuses, setLessonStatuses] = useState<Record<string, LessonStatus>>({});
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [reviewLessonIds, setReviewLessonIds] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [miniCaseAnswers, setMiniCaseAnswers] = useState<Record<string, string>>({});
  const [mistakeChoices, setMistakeChoices] = useState<Record<string, MistakeSelfCheck>>({});
  const [weakTopicIds, setWeakTopicIds] = useState<Set<string>>(new Set(data.profile.weakTopics));
  const [improvedModules, setImprovedModules] = useState<string[]>([]);
  const [showCoachReason, setShowCoachReason] = useState(false);

  const selectedMistake = useMemo(() => {
    const selectedId = Object.keys(mistakeChoices).find((id) => mistakeChoices[id] !== undefined);
    return data.mistakes.find((mistake) => mistake.id === selectedId);
  }, [data.mistakes, mistakeChoices]);

  const coachLesson = useMemo(() => {
    const relatedLessonId = selectedMistake?.relatedLessonIds[0];
    return data.lessons.find((lesson) => lesson.id === relatedLessonId) ??
      data.lessons.find((lesson) => lesson.id === data.todayLessonId) ??
      data.lessons[0];
  }, [data.lessons, data.todayLessonId, selectedMistake]);

  const activeLesson = useMemo(
    () => data.lessons.find((lesson) => lesson.id === activeLessonId) ?? coachLesson,
    [activeLessonId, coachLesson, data.lessons]
  );

  const secondaryLessons = useMemo(
    () =>
      data.lessons
        .filter((lesson) => lesson.id !== coachLesson.id && (lesson.status === "AI gợi ý" || reviewLessonIds.has(lesson.id)))
        .slice(0, 3),
    [coachLesson.id, data.lessons, reviewLessonIds]
  );

  function getLessonStatus(lesson: LearningLesson): LessonStatus {
    return lessonStatuses[lesson.id] ?? lesson.status;
  }

  function selectLesson(lessonId: string) {
    const lesson = data.lessons.find((item) => item.id === lessonId);
    setActiveLessonId(lessonId);
    if (lesson) {
      setActiveStageId(lesson.stageId);
    }
    setLessonStatuses((current) => ({
      ...current,
      [lessonId]: current[lessonId] === "Đã học" ? "Đã học" : "Đang học",
    }));
    setActiveTab("today");
  }

  function handleQuizAnswer(lessonId: string, answer: string) {
    const lesson = data.lessons.find((item) => item.id === lessonId);
    setQuizAnswers((current) => ({ ...current, [lessonId]: answer }));
    if (lesson && answer !== lesson.quiz.answer) {
      markNeedReview(lessonId);
    }
  }

  function handleMiniCaseAnswer(lessonId: string, answer: string) {
    setMiniCaseAnswers((current) => ({ ...current, [lessonId]: answer }));
  }

  function markUnderstood(lessonId: string) {
    const lesson = data.lessons.find((item) => item.id === lessonId);
    setLessonStatuses((current) => ({ ...current, [lessonId]: "Đã học" }));
    setCompletedLessonIds((current) => new Set([...current, lessonId]));
    setReviewLessonIds((current) => {
      const next = new Set(current);
      next.delete(lessonId);
      return next;
    });
    if (lesson) {
      setWeakTopicIds((current) => {
        const next = new Set(current);
        next.delete(lesson.title);
        next.delete(lesson.concept);
        return next;
      });
      setImprovedModules((current) => {
        const additions = lesson.relatedModules.filter((moduleName) => !current.includes(moduleName)).slice(0, 2);
        return [...current, ...additions];
      });
    }
  }

  function markNeedReview(lessonId: string) {
    setLessonStatuses((current) => ({ ...current, [lessonId]: "Cần ôn lại" }));
    setReviewLessonIds((current) => new Set([...current, lessonId]));
  }

  function handleMistakeChoice(mistakeId: string, choice: MistakeSelfCheck) {
    const mistake = data.mistakes.find((item) => item.id === mistakeId);
    setMistakeChoices((current) => ({ ...current, [mistakeId]: choice }));
    if (mistake) {
      setWeakTopicIds((current) => new Set([...current, mistake.title]));
      const lessonId = mistake.relatedLessonIds[0];
      if (choice === "Tôi đã mắc lỗi này" || choice === "Tôi muốn luyện thêm") {
        markNeedReview(lessonId);
        setActiveLessonId(lessonId);
      }
    }
  }

  function openModule(moduleName: string) {
    const key = moduleKeyMap[moduleName] ?? "overview";
    if (onNavigate) {
      onNavigate(key);
      return;
    }

    window.location.href = `/workspace?module=${key}`;
  }

  const quizCount = Object.keys(quizAnswers).length;
  const miniCaseCount = Object.values(miniCaseAnswers).filter((answer) => answer.trim()).length;

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <LearningCoachBar
        lesson={coachLesson}
        status={getLessonStatus(coachLesson)}
        reason={selectedMistake ? `Bạn vừa đánh dấu lỗi: ${selectedMistake.title}. Coach gợi ý bài này để sửa đúng điểm yếu đó.` : coachLesson.whySuggested}
        onStartLesson={selectLesson}
        onShowReason={() => setShowCoachReason((current) => !current)}
        onOpenModule={openModule}
      />

      {showCoachReason ? (
        <Card>
          <CardHeader title="Vì sao AI gợi ý bài này?" chip={<Chip variant="accent">Mock logic</Chip>} />
          <CardBody>
            <p className="text-sm leading-7 text-muted">
              Logic hiện tại dùng mock/local state: bài hôm nay, lỗi bạn chọn trong tab Sửa lỗi sai, quiz sai và chủ đề còn yếu sẽ làm thay đổi bài được gợi ý.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <LearningTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          {activeTab === "today" ? (
            <TodayLearningView
              mainLesson={coachLesson}
              activeLesson={activeLesson}
              secondaryLessons={secondaryLessons}
              getStatus={getLessonStatus}
              quizAnswer={quizAnswers[activeLesson.id]}
              miniCaseAnswer={miniCaseAnswers[activeLesson.id]}
              onSelectLesson={selectLesson}
              onQuizAnswer={handleQuizAnswer}
              onMiniCaseAnswer={handleMiniCaseAnswer}
              onMarkUnderstood={markUnderstood}
              onNeedReview={markNeedReview}
              onOpenModule={openModule}
            />
          ) : null}

          {activeTab === "roadmap" ? (
            <LearningRoadmapView
              stages={data.stages}
              lessons={data.lessons}
              activeStageId={activeStageId}
              onStageChange={setActiveStageId}
              onSelectLesson={selectLesson}
              getStatus={getLessonStatus}
            />
          ) : null}

          {activeTab === "mistakes" ? (
            <MistakeRepairCenter
              mistakes={data.mistakes}
              lessons={data.lessons}
              mistakeChoices={mistakeChoices}
              onMistakeChoice={handleMistakeChoice}
              onSelectLesson={selectLesson}
              onOpenModule={openModule}
            />
          ) : null}

          {activeTab === "profile" ? (
            <LearningProfileView
              profile={{ ...data.profile, weakTopics: Array.from(weakTopicIds) }}
              lessons={data.lessons}
              improvedModules={improvedModules}
              onSelectLesson={selectLesson}
              onOpenModule={openModule}
            />
          ) : null}
        </main>

        <LearningProgressCard
          lessons={data.lessons}
          profile={{ ...data.profile, weakTopics: Array.from(weakTopicIds) }}
          completedLessonIds={completedLessonIds}
          reviewLessonIds={reviewLessonIds}
          quizCount={quizCount}
          miniCaseCount={miniCaseCount}
          improvedModules={improvedModules}
          getStatus={getLessonStatus}
        />
      </div>
    </div>
  );
}
