"use client";

import React, { useState } from "react";
import { FileUp, ListChecks, MoreVertical, Calendar, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseResponse } from "@/services/courseService";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ActivitiesTabProps {
  course: CourseResponse;
}

export function ActivitiesTab({ course }: ActivitiesTabProps) {
  const [filter, setFilter] = useState("all");
  const router = useRouter();
  const { user } = useAuth();

  const hasEditPermission =
    user?.role === "Admin" ||
    (user?.role === "Teacher" && course.creatorId === user?.id);
  const isEnrolled =
    course.students?.some((s) => s.id === user?.id) ||
    hasEditPermission ||
    course.creatorId === user?.id;

  // Flatten all topics from all sections that are activities
  const allActivities =
    course.sections?.flatMap((section) =>
      (section.topics || [])
        .filter(
          (topic) =>
              (topic.type?.toLowerCase() === "assignment" || topic.type?.toLowerCase() === "quiz" || topic.type?.toLowerCase() === "page" || topic.type?.toLowerCase() === "file") &&
            (filter === "all" || topic.type?.toLowerCase() === filter),
        )
        .map((topic) => ({ ...topic, sectionTitle: section.title })),
    ) || [];

  return (
    <div className="w-full max-w-5xl mx-auto py-4 md:py-8 px-4 md:px-0">
      {/* Dropdown filters */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 md:mb-10 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#374151]">
            Course Activities
          </h2>
          <p className="text-gray-400 text-[13px] md:text-[14px]">
            Manage and track your assignments and tests
          </p>
        </div>
        <Select defaultValue="all" onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-11 border-[#E5E7EB] text-[#6B7280] rounded-xl bg-white shadow-sm font-bold">
            <SelectValue placeholder="Select topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            <SelectItem value="page">Pages</SelectItem>
            <SelectItem value="file">Files</SelectItem>
            <SelectItem value="assignment">Assignments</SelectItem>
            <SelectItem value="quiz">Quizzes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-8 md:space-y-12">
        {course.sections?.map((section) => {
          const sectionActivities = (section.topics || []).filter(
            (t: any) => (t.type?.toLowerCase() === "assignment" || t.type?.toLowerCase() === "quiz" || t.type?.toLowerCase() === "page" || t.type?.toLowerCase() === "file") &&
            (filter === "all" || t.type?.toLowerCase() === filter),
          );

          if (sectionActivities.length === 0) return null;

          return (
            <section key={section.id} className="relative">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-5 md:h-6 bg-[#3B82F6] rounded-full"></div>
                  <h3 className="text-[16px] md:text-[18px] font-black text-[#4B5563] line-clamp-1">
                    {section.title}
                  </h3>
                </div>
                <button className="text-[#9CA3AF] hover:bg-gray-100 p-1.5 md:p-2 rounded-xl transition-all shrink-0">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4">
                {sectionActivities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => {
                      if (!isEnrolled) {
                        toast.error(
                          "Please join the course first to view this content!",
                        );
                        return;
                      }
                      const type = activity.type?.toLowerCase();
                      if (type === "assignment") {
                        router.push(`/assignments/${activity.id}?courseId=${course.id}`);
                      } else if (type === "quiz") {
                        router.push(`/quizzes/${activity.id}?courseId=${course.id}`);
                      } else if (type === "page") {
                        router.push(`/pages/${activity.id}?courseId=${course.id}`);
                      } else if (type === "file") {
                        router.push(`/files/${activity.id}?courseId=${course.id}`);
                      } else if (type === "link") {
                        router.push(`/links/${activity.id}?courseId=${course.id}`);
                      } else if (type === "meeting") {
                        router.push(`/meetings/${activity.id}?courseId=${course.id}`);
                      }
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-white border border-[#F3F4F6] hover:border-[#3B82F6] rounded-[20px] group cursor-pointer transition-all shadow-sm hover:shadow-md gap-4"
                  >
                    <div className="flex items-center gap-4 md:gap-5">
                      <div
                        className={`p-2.5 md:p-3 rounded-2xl shrink-0 ${
                          activity.type?.toLowerCase() === "assignment" ? "bg-purple-50 text-purple-600" : 
                          activity.type?.toLowerCase() === "page" ? "bg-blue-50 text-blue-600" :
                          activity.type?.toLowerCase() === "file" ? "bg-orange-50 text-orange-600" :
                          "bg-pink-50 text-pink-600"}`}
                      >
                        {activity.type?.toLowerCase() === "assignment" ? (
                          <FileUp className="w-5 h-5 md:w-6 md:h-6" />
                        ) : activity.type?.toLowerCase() === "page" ? (
                          <FileText className="w-5 h-5 md:w-6 md:h-6" />
                        ) : activity.type?.toLowerCase() === "file" ? (
                          <FileText className="w-5 h-5 md:w-6 md:h-6" />
                        ) : (
                          <ListChecks className="w-5 h-5 md:w-6 md:h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[15px] md:text-[16px] text-[#1F2937] group-hover:text-[#3B82F6] transition-colors line-clamp-1">
                          {activity.title}
                        </h4>
                        <div className="flex items-center gap-2 md:gap-3 mt-1">
                          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-gray-400">
                            {activity.type}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <div className="flex items-center gap-1.5 text-[11px] md:text-[12px] text-gray-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="line-clamp-1">
                              {isEnrolled ? "See details" : "Locked"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] md:text-[11px] font-bold text-gray-400 mb-0.5 uppercase tracking-tighter">
                          Status
                        </p>
                        <span
                          className={`text-[12px] md:text-[13px] font-black ${activity.type === "assignment" ? "text-[#F97316]" : "text-gray-400"}`}
                        >
                          {isEnrolled
                            ? activity.type === "assignment"
                              ? "Available"
                              : "Pending"
                            : "Locked"}
                        </span>
                      </div>
                      <div className="h-8 md:h-10 w-[1px] bg-gray-100 hidden sm:block"></div>
                      <button className="bg-[#F9FAFB] group-hover:bg-[#3B82F6] text-[#6B7280] group-hover:text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[13px] md:text-[14px] font-bold transition-all whitespace-nowrap">
                        {isEnrolled ? "Details" : "Join"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {allActivities.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-500">
              No activities found
            </h3>
            <p className="text-gray-400 text-[14px] mt-1">
              There are no assignments or quizzes matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
