"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ChevronRight, ListChecks, Loader2, ArrowLeft } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courseApi } from "@/services/courseService";
import type { QuizTopic, QuizTopicData } from "@/types/quiz";

import { LearnerQuizView } from "@/components/quizzes/LearnerQuizView";
import TeacherQuizView from "@/components/quizzes/TeacherQuizView";
import TeacherQuizSettings from "@/components/quizzes/TeacherQuizSettings";
import TeacherQuizQuestions from "@/components/quizzes/TeacherQuizQuestions";
import TeacherQuizQuestionBank from "@/components/quizzes/TeacherQuizQuestionBank";
import TeacherQuizSubmissions from "@/components/quizzes/TeacherQuizSubmissions";
import TeacherQuizDashboard from "@/components/quizzes/TeacherQuizDashboard";

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseQuizData(raw: unknown): QuizTopicData {
  const DEFAULT_DATA: QuizTopicData = {
    description: '',
    open: null,
    close: null,
    timeLimit: null,
    timeLimitUnit: 'Minutes',
    gradeToPass: 5,
    gradingMethod: 'Highest Grade',
    attemptAllowed: 'Unlimited',
    questions: [],
  };

  if (!raw) return DEFAULT_DATA;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DATA, ...parsed, questions: parsed.questions ?? [] };
    } catch {
      return DEFAULT_DATA;
    }
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      ...DEFAULT_DATA,
      ...obj,
      questions: Array.isArray(obj.questions) ? obj.questions : [],
    };
  }
  return DEFAULT_DATA;
}

/** Convert a raw TopicResponse from the API into a typed QuizTopic */
function toQuizTopic(raw: { id: string; title: string; type: string; sectionId: string; data?: unknown }): QuizTopic {
  return {
    id: raw.id,
    title: raw.title,
    type: 'quiz',
    sectionId: raw.sectionId,
    data: parseQuizData(raw.data),
  };
}

// ── Page component ─────────────────────────────────────────────────────────────

export default function QuizDetailPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const router = useRouter();
  const { user } = useAuth();

  // Typed, lifted quiz state
  const [quiz, setQuiz] = useState<QuizTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Callback child components call after mutations
  const handleQuizUpdated = useCallback((updated: QuizTopic) => {
    setQuiz(updated);
  }, []);

  useEffect(() => {
    if (!courseId || !topicId) {
      setIsLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        const response = await courseApi.getTopicById(courseId, topicId);
        setQuiz(toQuizTopic(response.data));
      } catch (error) {
        console.error("Failed to fetch quiz:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, topicId]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-[#DB2777]" />
        </div>
      </MainLayout>
    );
  }

  // ── Missing courseId ─────────────────────────────────────────────────────────

  if (!courseId) {
    return (
      <MainLayout headerTitle={<span className="text-[#6B7280]">Error</span>}>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">Missing Course ID</p>
          </div>
          <p className="text-gray-500 max-w-md">
            The URL is missing the parent course context. Please navigate to this
            quiz through the course page.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 bg-[#DB2777] text-white px-6 py-2 rounded-xl font-bold"
          >
            Go Home
          </button>
        </div>
      </MainLayout>
    );
  }

  // ── Quiz not found ───────────────────────────────────────────────────────────

  if (!quiz) {
    return (
      <MainLayout headerTitle={<span className="text-[#6B7280]">Error</span>}>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">Quiz Not Found</p>
          </div>
          <p className="text-gray-500 max-w-md">
            We couldn&apos;t retrieve the quiz details. The quiz might have been
            deleted or you don&apos;t have permission to view it.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 border border-gray-200 text-gray-600 px-6 py-2 rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </MainLayout>
    );
  }

  const isTeacher = user?.role === "Teacher" || user?.role === "Admin";

  // For components that still accept the old TopicResponse shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyQuiz = quiz as any;

  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span
        className="text-[#6B7280] hidden md:inline cursor-pointer hover:text-[#DB2777]"
        onClick={() => router.push("/")}
      >
        Home
      </span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span
        className="text-[#6B7280] cursor-pointer hover:text-[#DB2777]"
        onClick={() => router.push(`/courses/${courseId}`)}
      >
        Course
      </span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">{quiz.title}</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-full bg-white relative">
        {/* Deep Pink Top Background */}
        <div className="w-full bg-[#9D174D] pt-10 pb-20 px-6 md:px-10">
          <div className="flex flex-col gap-6 mb-8 text-white">
            <button 
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex items-center gap-2 w-fit px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to course
            </button>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <ListChecks className="w-6 h-6 shrink-0" />
              </div>
              <h1 className="text-[32px] font-bold">{quiz.title}</h1>
            </div>
          </div>

          {isTeacher ? (
            <Tabs defaultValue="quiz" className="w-full">
              <div className="border-b-2 border-white/20 w-full overflow-x-auto scrollbar-hide">
                <TabsList
                  variant="line"
                  className="bg-transparent p-0 flex h-auto overflow-x-auto overflow-y-hidden gap-6 md:gap-8 justify-start w-full min-w-max"
                >
                  {[
                    { value: 'quiz',      label: 'Quiz' },
                    { value: 'settings',  label: 'Settings' },
                    { value: 'questions', label: 'Questions' },
                    { value: 'results',   label: 'Results' },
                    { value: 'bank',      label: 'Question Bank' },
                    { value: 'dashboard', label: 'Dashboard' },
                  ].map(({ value, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="flex-none px-1 py-3 text-[13px] md:text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="mt-8">
                <TabsContent value="quiz" className="mt-0 outline-none w-full">
                  <TeacherQuizView quiz={legacyQuiz} courseId={courseId} />
                </TabsContent>
                <TabsContent value="settings" className="mt-0 outline-none w-full">
                  <TeacherQuizSettings quiz={legacyQuiz} courseId={courseId} />
                </TabsContent>
                <TabsContent value="questions" className="mt-0 outline-none w-full">
                  <TeacherQuizQuestions
                    quiz={quiz}
                    courseId={courseId}
                    onQuizUpdated={handleQuizUpdated}
                  />
                </TabsContent>
                <TabsContent value="results" className="mt-0 outline-none w-full">
                  <TeacherQuizSubmissions quiz={legacyQuiz} courseId={courseId} />
                </TabsContent>
                <TabsContent value="bank" className="mt-0 outline-none w-full">
                  <TeacherQuizQuestionBank
                    courseId={courseId}
                    quiz={quiz}
                    onQuizUpdated={handleQuizUpdated}
                  />
                </TabsContent>
                <TabsContent value="dashboard" className="mt-0 outline-none w-full">
                  <TeacherQuizDashboard quiz={legacyQuiz} courseId={courseId} />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex gap-8 border-b-2 border-white/20 text-white w-full">
              <span className="text-[14px] font-bold border-b-4 border-white pb-3 -mb-[2px]">
                Quiz
              </span>
            </div>
          )}
        </div>

        {/* Learner content */}
        <div className="px-6 md:px-10 -mt-16 w-full pb-12">
          {!isTeacher && (
            <div className="mt-0">
              <LearnerQuizView quiz={legacyQuiz} courseId={courseId} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
