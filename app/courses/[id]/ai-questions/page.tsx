"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AiQuestionGenerationPage from "@/components/ai-questions/AiQuestionGenerationPage";

export default function CourseAiQuestionsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = React.use(params);
  const router = useRouter();

  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span
        className="text-[#6B7280] hidden md:inline cursor-pointer hover:text-[#2563EB]"
        onClick={() => router.push("/")}
      >
        Home
      </span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span
        className="text-[#6B7280] cursor-pointer hover:text-[#2563EB]"
        onClick={() => router.push(`/courses/${courseId}`)}
      >
        Course
      </span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">AI Questions</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <AiQuestionGenerationPage courseId={courseId} />
    </MainLayout>
  );
}
