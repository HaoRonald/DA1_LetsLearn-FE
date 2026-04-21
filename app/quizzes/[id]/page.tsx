"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, ListChecks, Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courseApi, TopicResponse } from "@/services/courseService";

import { LearnerQuizView } from "@/components/quizzes/LearnerQuizView";
import TeacherQuizView from "@/components/quizzes/TeacherQuizView";
import TeacherQuizSettings from "@/components/quizzes/TeacherQuizSettings";
import TeacherQuizQuestions from "@/components/quizzes/TeacherQuizQuestions";
import TeacherQuizQuestionBank from "@/components/quizzes/TeacherQuizQuestionBank";
import TeacherQuizSubmissions from "@/components/quizzes/TeacherQuizSubmissions";
import TeacherQuizDashboard from "@/components/quizzes/TeacherQuizDashboard";

// Quiz detail page
export default function QuizDetailPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const router = useRouter();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<TopicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !topicId) {
      setIsLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        const response = await courseApi.getTopicById(courseId, topicId);
        setQuiz(response.data);
      } catch (error) {
        console.error("Failed to fetch quiz:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, topicId]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-[#DB2777]" />
        </div>
      </MainLayout>
    );
  }

  if (!courseId) {
    return (
      <MainLayout headerTitle={<span className="text-[#6B7280]">Error</span>}>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">Missing Course ID</p>
          </div>
          <p className="text-gray-500 max-w-md">
            The URL is missing the parent course context. Please navigate to
            this quiz through the course page.
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

  // At this point courseId is guaranteed to be non-null (guarded above)
  const safeCourseId = courseId as string;
  const isTeacher = user?.role === "Teacher" || user?.role === "Admin";


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
        onClick={() => router.push(`/courses/${safeCourseId}`)}
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
        {/* Deep Pink/Magenta Top Background */}
        <div className="w-full bg-[#9D174D] pt-10 pb-20 px-6 md:px-10">
          <div className="flex items-center gap-4 mb-8 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <ListChecks className="w-6 h-6 shrink-0" />
            </div>
            <h1 className="text-[32px] font-bold">{quiz.title}</h1>
          </div>

          {/* Tabs */}
          {isTeacher ? (
            <Tabs defaultValue="quiz" className="w-full">
              <div className="border-b-2 border-white/20 w-full overflow-x-auto scrollbar-hide">
                <TabsList
                  variant="line"
                  className="bg-transparent p-0 flex h-auto overflow-x-auto overflow-y-hidden gap-6 md:gap-8 justify-start w-full min-w-max"
                >
                  <TabsTrigger
                    value="quiz"
                    className="flex-none px-1 py-3 text-[13px] md:text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Quiz
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="flex-none px-1 py-3 text-[13px] md:text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Settings
                  </TabsTrigger>
                  <TabsTrigger
                    value="questions"
                    className="flex-none px-1 py-3 text-[13px] md:text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Questions
                  </TabsTrigger>
                  <TabsTrigger
                    value="results"
                    className="flex-none px-1 py-3 text-[13px] md:text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Results
                  </TabsTrigger>
                  <TabsTrigger
                    value="bank"
                    className="flex-none px-1 py-3 text-[13px] md:text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Question Bank
                  </TabsTrigger>
                  <TabsTrigger
                    value="dashboard"
                    className="flex-none px-1 py-3 text-[13px] md:text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Dashboard
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="mt-8">
                <TabsContent value="quiz" className="mt-0 outline-none w-full">
                  <TeacherQuizView quiz={quiz} courseId={safeCourseId} />
                </TabsContent>
                <TabsContent
                  value="settings"
                  className="mt-0 outline-none w-full"
                >
                  <TeacherQuizSettings quiz={quiz} courseId={safeCourseId} />
                </TabsContent>
                <TabsContent
                  value="questions"
                  className="mt-0 outline-none w-full"
                >
                  <TeacherQuizQuestions quiz={quiz} courseId={safeCourseId} />
                </TabsContent>
                <TabsContent
                  value="results"
                  className="mt-0 outline-none w-full"
                >
                  <TeacherQuizSubmissions quiz={quiz} courseId={safeCourseId} />
                </TabsContent>
                <TabsContent value="bank" className="mt-0 outline-none w-full">
                  <TeacherQuizQuestionBank courseId={safeCourseId} />
                </TabsContent>
                <TabsContent
                  value="dashboard"
                  className="mt-0 outline-none w-full"
                >
                  <TeacherQuizDashboard quiz={quiz} courseId={safeCourseId} />
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

        {/* Content for Learner */}
        <div className="px-6 md:px-10 -mt-16 w-full pb-12">
          {!isTeacher && (
            <div className="mt-0">
              <LearnerQuizView quiz={quiz} courseId={safeCourseId} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
