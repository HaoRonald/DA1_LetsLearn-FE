"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  FileText,
  FileUp,
  Link as LinkIcon,
  ListChecks,
  Video,
  ChevronDown,
  Edit3,
  Trash2,
  ArrowUpDown,
  Plus,
  Image as ImageIcon,
  X,
  Check,
  ExternalLink,
  CreditCard,
  Lock,
  Loader2,
  Globe,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CourseResponse,
  TopicResponse,
  courseApi,
} from "@/services/courseService";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sectionApi } from "@/services/sectionService";
import { topicApi } from "@/services/topicService";

interface CourseTabProps {
  course: CourseResponse;
}

export function CourseTab({ course }: CourseTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [activeSectionIdForTopic, setActiveSectionIdForTopic] = useState<
    string | null
  >(null);
  const [showSectionModal, setShowSectionModal] = useState(false);

  const [isJoining, setIsJoining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isPaidCourse = course.price && course.price > 0;

  // Forms
  const [courseForm, setCourseForm] = useState({
    id: course.id,
    title: course.title || "",
    description: course.description || "",
    category: course.category || "",
    level: course.level || "",
    imageUrl: course.imageUrl || "",
    price: course.price || 0,
    isPublished: course.isPublished ?? false,
  });

  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
  });

  const hasEditPermission =
    user?.role === "Admin" ||
    (user?.role === "Teacher" && course.creatorId === user?.id);
  const isEnrolled =
    course.students?.some((s) => s.id === user?.id) ||
    hasEditPermission ||
    course.creatorId === user?.id;

  // Simple check for edit permission (can be improved with auth context later)
  useEffect(() => {
    // In a real app, we check if current user ID === course.creatorId
    // For now, let's keep it false by default or allow toggling for demo
  }, [course]);

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setIsJoining(true);
    try {
      await courseApi.join(course.id);
      toast.success("Joined course successfully!");
      window.location.reload();
    } catch (err: any) {
      console.error("Failed to join course:", err);
      toast.error(err.response?.data?.message || "Failed to join course");
    } finally {
      setIsJoining(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async (paymentMethod: string) => {
    setIsProcessingPayment(true);
    try {
      // TODO: Integrate with actual payment API when backend is ready
      // For now, simulate payment success and join course
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // After "payment" success, join the course
      await courseApi.join(course.id);
      toast.success("Payment successful! You are now enrolled in this course.");
      setShowPaymentModal(false);
      window.location.reload();
    } catch (err: any) {
      console.error("Payment failed:", err);
      toast.error(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSaveCourse = async () => {
    setIsSaving(true);
    try {
      await courseApi.update(course.id, {
        ...courseForm,
        price: courseForm.price || 0,
        isPublished: courseForm.isPublished,
      });
      toast.success("Course details updated successfully!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      toast.error("Section title is required");
      return;
    }
    setIsSaving(true);
    try {
      await sectionApi.create({
        courseId: course.id,
        title: sectionForm.title,
        description: sectionForm.description,
      });
      toast.success("Section added successfully!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add section");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTopic = async (type: string) => {
    if (!activeSectionIdForTopic) return;
    setIsSaving(true);
    try {
      await topicApi.create(course.id, {
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type: type.toLowerCase(),
        sectionId: activeSectionIdForTopic,
      });
      toast.success("Topic created successfully!");
      setActiveSectionIdForTopic(null);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create topic");
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "assignment":
        return <FileUp className="w-5 h-5 text-[#7E22CE]" />;
      case "quiz":
        return <ListChecks className="w-5 h-5 text-[#DB2777]" />;
      case "meeting":
        return <Video className="w-5 h-5 text-[#3B82F6]" />;
      case "file":
        return <FileText className="w-5 h-5 text-[#3B82F6]" />;
      case "link":
        return <LinkIcon className="w-5 h-5 text-[#10B981]" />;
      case "page":
        return <FileText className="w-5 h-5 text-[#DB2777]" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleTopicClick = (topic: TopicResponse) => {
    if (!isEnrolled) {
      toast.error("Please join the course first to view this content!");
      return;
    }

    const type = topic.type?.toLowerCase();
    if (type === "assignment") {
      router.push(`/assignments/${topic.id}?courseId=${course.id}`);
    } else if (type === "quiz") {
      router.push(`/quizzes/${topic.id}?courseId=${course.id}`);
    } else if (type === "page") {
      router.push(`/pages/${topic.id}?courseId=${course.id}`);
    } else if (type === "file") {
      router.push(`/files/${topic.id}?courseId=${course.id}`);
    } else if (type === "link") {
      router.push(`/links/${topic.id}?courseId=${course.id}`);
    } else if (type === "meeting") {
      router.push(`/meetings/${topic.id}?courseId=${course.id}`);
    }
  };

  return (
    <div className="w-full relative pb-24 px-4 sm:px-0">
      {/* Banner */}
      <div className="relative w-full h-[200px] sm:h-[240px] md:h-[320px] rounded-[24px] overflow-hidden mb-8 shadow-md group">
        <img
          src={
            course.imageUrl ||
            "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1600&auto=format&fit=crop"
          }
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {hasEditPermission && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <button
              onClick={() => setShowCourseModal(true)}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[#3B82F6] font-bold text-[12px] sm:text-[14px] shadow-sm hover:bg-white transition-all transform hover:scale-105"
            >
              <Edit3 className="w-4 h-4" /> Customize
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between text-white gap-4">
          <div className="flex-1">
            <div className="mb-2">
              <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-[#3B82F6] rounded-full text-[10px] sm:text-[12px] font-bold uppercase tracking-wider">
                {course.category || "Course"}
              </span>
            </div>
            <h1 className="text-[24px] sm:text-[32px] md:text-[44px] font-bold leading-tight mb-1 line-clamp-2">
              {course.title}
            </h1>
            <p className="hidden sm:block text-[16px] md:text-[18px] font-medium opacity-90 max-w-2xl line-clamp-2">
              {course.description}
            </p>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/20">
              <span className="hidden xs:inline text-[11px] sm:text-[13px] font-medium text-white/70">
                ID:
              </span>
              <span className="text-[12px] sm:text-[14px] font-bold tracking-wide text-white">
                {course.id.substring(0, 8)}...
              </span>
              <button className="hover:text-[#60A5FA] transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex -space-x-2">
              {course.students?.slice(0, 3).map((student, idx) => (
                <img
                  key={student.id || idx}
                  src={
                    student.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(student.username || "S")}&background=random`
                  }
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-200"
                  alt={student.username || "Student"}
                  title={student.username || "Student"}
                />
              ))}
              {(course.students?.length || 0) > 0 && (
                <div
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold"
                  title="Total students"
                >
                  {course.students?.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xs:flex-row justify-between xs:items-center gap-4 mb-6">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#374151]">Course Content</h2>
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-1">
          <button className="text-[12px] sm:text-[14px] font-bold text-[#3B82F6] hover:underline underline-offset-4 whitespace-nowrap">
            Collapse all
          </button>
          {hasEditPermission && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all whitespace-nowrap ${isEditMode ? "bg-[#3B82F6] text-white" : "bg-gray-100 text-[#6B7280] hover:bg-gray-200"}`}
            >
              {isEditMode ? "Editing" : "Edit content"}
            </button>
          )}
          {!isEnrolled && user?.role === "Learner" && (
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {isPaidCourse && (
                <span className="text-[14px] sm:text-[18px] font-bold text-[#F97316] whitespace-nowrap">
                  ${course.price}
                </span>
              )}
              <button
                onClick={isPaidCourse ? handleBuyNow : handleJoin}
                disabled={isJoining}
                className="px-3 sm:px-4 py-2 bg-[#F97316] text-white text-[12px] sm:text-[14px] font-bold rounded-lg shadow-md hover:bg-[#EA580C] hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <CreditCard className="w-4 h-4 hidden xs:block" />
                {isJoining ? "..." : isPaidCourse ? "Buy Now" : "Join"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-4">
        {course.sections && course.sections.length > 0 ? (
          <Accordion
            type="multiple"
            defaultValue={course.sections.map((s) => s.id)}
            className="w-full"
          >
            {course.sections
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((section) => (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="border border-[#F3F4F6] rounded-2xl bg-white px-6 py-1 mb-4 shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline py-4 text-[17px] font-bold text-[#1F2937] [&>svg]:hidden flex justify-between w-full group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B82F6] group-hover:bg-[#3B82F6] group-hover:text-white transition-all">
                        <ChevronDown className="w-5 h-5 transition-transform duration-200 shrink-0" />
                      </div>
                      {section.title}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium text-gray-400 mr-2">
                        {section.topics?.length || 0} topics
                      </span>
                      {isEditMode && (
                        <Edit3 className="w-4 h-4 text-[#9CA3AF] hover:text-[#3B82F6]" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    {section.description && (
                      <div className="flex items-start gap-2 mb-6 text-[#6B7280] text-[15px] bg-gray-50/50 p-4 rounded-xl">
                        <p className="flex-1 italic">{section.description}</p>
                        {isEditMode && (
                          <Edit3 className="w-4 h-4 text-[#9CA3AF] cursor-pointer" />
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {section.topics && section.topics.length > 0 ? (
                        section.topics.map((topic) => (
                          <div
                            key={topic.id}
                            onClick={() => handleTopicClick(topic)}
                            className="flex items-center justify-between py-4 px-3 rounded-xl hover:bg-[#F9FAFB] transition-all cursor-pointer group/item border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover/item:border-blue-200 transition-colors">
                                {getIcon(topic.type)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[#4B5563] group-hover/item:text-[#3B82F6] transition-colors">
                                  {topic.title}
                                </span>
                                <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-bold">
                                  {topic.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {isEditMode ? (
                                <div className="flex items-center gap-3">
                                  <button className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button className="text-gray-300 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                                    <ArrowUpDown className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <ExternalLink className="w-4 h-4 text-gray-300 group-hover/item:text-blue-400 transition-all" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-gray-400 italic text-[14px]">
                          No topics in this section.
                        </div>
                      )}
                    </div>

                    {/* Add new topic Button */}
                    {isEditMode && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSectionIdForTopic(section.id);
                          }}
                          className="bg-white border-2 border-dashed border-gray-200 hover:border-[#3B82F6] hover:bg-blue-50/30 transition-all text-[#6B7280] hover:text-[#3B82F6] font-bold px-8 py-3 rounded-2xl flex items-center gap-2 text-[14px] w-full justify-center"
                        >
                          <Plus className="w-4 h-4" /> Add new topic
                        </button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium mb-4">
              No sections available
            </p>
            {isEditMode && (
              <button
                onClick={() => setShowSectionModal(true)}
                className="bg-[#3B82F6] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create First Section
              </button>
            )}
          </div>
        )}

        {/* Floating Add Section Button (if sections exist and editing) */}
        {isEditMode && course.sections && course.sections.length > 0 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowSectionModal(true)}
              className="bg-white border-2 border-dashed border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-blue-50/50 transition-all text-[#6B7280] hover:text-[#3B82F6] font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 text-[15px] w-full max-w-lg justify-center shadow-sm"
            >
              <Plus className="w-5 h-5" /> Add New Section
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* Edit Course Settings Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB] shrink-0">
              <div>
                <h2 className="text-[#1F2937] font-black text-[22px]">
                  Course Settings
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCourseModal(false);
                  // Quick reset
                  setCourseForm({
                    id: course.id,
                    title: course.title || "",
                    description: course.description || "",
                    category: course.category || "",
                    level: course.level || "",
                    imageUrl: course.imageUrl || "",
                    price: course.price || 0,
                    isPublished: course.isPublished ?? false,
                  });
                }}
                className="text-[#9CA3AF] hover:text-[#EF4444] hover:bg-red-50 p-2 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#374151]">
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#374151]">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-[14px] font-bold text-[#374151]">
                    Category
                  </label>
                  <input
                    type="text"
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, category: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-[14px] font-bold text-[#374151]">
                    Level
                  </label>
                  <input
                    type="text"
                    value={courseForm.level}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, level: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#374151]">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={courseForm.imageUrl}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, imageUrl: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#374151]">
                  Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] text-[14px]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={courseForm.price || ""}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[#9CA3AF] text-[12px]">Set 0 for free course</p>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#374151]">
                  Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCourseForm({ ...courseForm, isPublished: true })}
                    className={`flex-1 h-12 rounded-xl border text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${
                      courseForm.isPublished
                        ? "bg-[#10B981] border-[#10B981] text-white"
                        : "bg-white border-gray-200 text-[#6B7280] hover:border-[#10B981]"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseForm({ ...courseForm, isPublished: false })}
                    className={`flex-1 h-12 rounded-xl border text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${
                      !courseForm.isPublished
                        ? "bg-[#6B7280] border-[#6B7280] text-white"
                        : "bg-white border-gray-200 text-[#6B7280] hover:border-[#6B7280]"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Private
                  </button>
                </div>
                <p className="text-[#9CA3AF] text-[12px]">
                  {courseForm.isPublished
                    ? "Anyone can find and enroll in this course"
                    : "Only people with the course link can enroll"}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCourseModal(false);
                  setCourseForm({
                    id: course.id,
                    title: course.title || "",
                    description: course.description || "",
                    category: course.category || "",
                    level: course.level || "",
                    imageUrl: course.imageUrl || "",
                    price: course.price || 0,
                    isPublished: course.isPublished ?? false,
                  });
                }}
                className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB]">
              <h2 className="text-[#1F2937] font-black text-[22px]">
                New Section
              </h2>
              <button
                onClick={() => setShowSectionModal(false)}
                className="text-[#9CA3AF] hover:text-[#EF4444] hover:bg-red-50 p-2 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#374151]">
                  Section Title
                </label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, title: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Chapter 1: Introduction"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#374151]">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={sectionForm.description}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Brief overview of this section..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowSectionModal(false)}
                className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSection}
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? "Creating..." : "Create Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSectionIdForTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[650px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-[#EA580C] font-bold text-[20px]">
                Add a topic
              </h2>
              <button
                onClick={() => setActiveSectionIdForTopic(null)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 flex items-center gap-6 border-b border-gray-100">
              <button className="py-3 text-[14px] font-bold text-[#3B82F6] border-b-2 border-[#3B82F6]">
                All
              </button>
              <button className="py-3 text-[14px] font-medium text-gray-500 hover:text-gray-700">
                Activities
              </button>
              <button className="py-3 text-[14px] font-medium text-gray-500 hover:text-gray-700">
                Resources
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    name: "Assignment",
                    type: "assignment",
                    icon: (
                      <FileUp
                        className="w-7 h-7 text-[#8B5CF6]"
                        strokeWidth={1.5}
                      />
                    ),
                  },
                  {
                    name: "Quiz",
                    type: "quiz",
                    icon: (
                      <ListChecks
                        className="w-7 h-7 text-[#EC4899]"
                        strokeWidth={1.5}
                      />
                    ),
                  },
                  {
                    name: "Meeting",
                    type: "meeting",
                    icon: (
                      <Video
                        className="w-7 h-7 text-[#3B82F6]"
                        strokeWidth={1.5}
                      />
                    ),
                  },
                  {
                    name: "File",
                    type: "file",
                    icon: (
                      <FileText
                        className="w-7 h-7 text-[#3B82F6]"
                        strokeWidth={1.5}
                      />
                    ),
                  },
                  {
                    name: "Link",
                    type: "link",
                    icon: (
                      <LinkIcon
                        className="w-7 h-7 text-[#10B981]"
                        strokeWidth={1.5}
                      />
                    ),
                  },
                  {
                    name: "Page",
                    type: "page",
                    icon: (
                      <FileText
                        className="w-7 h-7 text-[#EC4899]"
                        strokeWidth={1.5}
                      />
                    ),
                  },
                ].map((opt) => (
                  <button
                    key={opt.name}
                    disabled={isSaving}
                    onClick={() => handleCreateTopic(opt.type)}
                    className="flex flex-col items-center justify-center p-4 h-28 border border-gray-200 hover:border-[#3B82F6] hover:bg-blue-50/30 rounded-2xl transition-all hover:shadow-sm disabled:opacity-50"
                  >
                    <div className="mb-2">{opt.icon}</div>
                    <span className="text-[14px] font-medium text-gray-600">
                      {opt.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-[#1F2937] font-bold text-[20px]">
                  Complete Payment
                </h2>
                <p className="text-[#6B7280] text-[14px] mt-1">
                  Secure payment for {course.title}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment}
                className="text-[#9CA3AF] hover:text-[#EF4444] hover:bg-red-50 p-2 rounded-xl transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="p-6 bg-[#F9FAFB]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#6B7280] text-[14px]">Course</span>
                <span className="text-[#1F2937] font-medium text-[14px] max-w-[200px] truncate">
                  {course.title}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#6B7280] text-[14px]">Instructor</span>
                <span className="text-[#1F2937] font-medium text-[14px]">
                  {course.creator?.username || "Unknown"}
                </span>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex items-center justify-between">
                <span className="text-[#1F2937] font-bold text-[16px]">Total</span>
                <span className="text-[#F97316] font-black text-[28px]">
                  ${course.price}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-6 space-y-4">
              <p className="text-[#6B7280] text-[13px] font-medium uppercase tracking-wider">
                Select payment method
              </p>

              {/* Credit Card Option */}
              <button
                onClick={() => handlePayment("credit_card")}
                disabled={isProcessingPayment}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#3B82F6] hover:bg-blue-50/30 transition-all disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-[#1F2937] rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[#1F2937] text-[15px]">Credit / Debit Card</p>
                  <p className="text-[#6B7280] text-[12px]">Visa, Mastercard, AMEX</p>
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-5 bg-[#1A1F71] rounded"></div>
                  <div className="w-8 h-5 bg-[#EB001B] rounded-l"></div>
                </div>
              </button>

              {/* PayPal Option */}
              <button
                onClick={() => handlePayment("paypal")}
                disabled={isProcessingPayment}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#3B82F6] hover:bg-blue-50/30 transition-all disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-[18px]">P</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[#1F2937] text-[15px]">PayPal</p>
                  <p className="text-[#6B7280] text-[12px]">Pay with your PayPal account</p>
                </div>
              </button>

              {/* Bank Transfer Option */}
              <button
                onClick={() => handlePayment("bank_transfer")}
                disabled={isProcessingPayment}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#3B82F6] hover:bg-blue-50/30 transition-all disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-[#10B981] rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-[16px]">BT</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[#1F2937] text-[15px]">Bank Transfer</p>
                  <p className="text-[#6B7280] text-[12px]">Direct bank payment</p>
                </div>
              </button>

              {isProcessingPayment && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
                  <span className="ml-2 text-[#6B7280] text-[14px]">Processing payment...</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-[#6B7280] text-[12px]">
              <Lock className="w-3 h-3" />
              <span>Your payment is secured with SSL encryption</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
