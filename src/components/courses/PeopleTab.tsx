"use client";

import React, { useState } from "react";
import { Users, ShieldCheck, Mail, MessageSquare, X } from "lucide-react";
import { CourseResponse } from "@/services/courseService";
import { chatService } from "@/services/chatService";
import { GroupChat } from "@/components/chat/GroupChat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PeopleTabProps {
  course: CourseResponse;
}

export function PeopleTab({ course }: PeopleTabProps) {
  const { user } = useAuth();
  // conversationId đang mở trong chat panel
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const handleEmailClick = (email?: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      toast.error("Email of this user is not public or not found");
    }
  };

  // Mở chat với một user cụ thể
  const openChat = async (targetUserId: string, targetName: string) => {
    if (!user?.id) return;
    if (loadingChat) return;
    setLoadingChat(true);
    try {
      const conv = await chatService.getOrCreateConversation(targetUserId);
      setActiveChatId(conv.id);
      setChatTitle(`Chat với ${targetName}`);
    } catch (err) {
      console.error("Failed to open chat:", err);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 relative">
      {/* Instructors Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4 mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#3B82F6]" />
            <h2 className="text-[20px] font-black text-[#374151]">
              Instructors
            </h2>
          </div>
          <span className="bg-blue-50 text-[#3B82F6] px-3 py-1 rounded-full text-[12px] font-black uppercase">
            1 Profile
          </span>
        </div>

        <div className="grid gap-4">
          {course.creator && (
            <div className="flex items-center justify-between p-4 bg-white border border-[#F3F4F6] rounded-[24px] hover:shadow-md transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-[#3B82F6]/20">
                  <img
                    src={
                      course.creator.avatar ||
                      `https://ui-avatars.com/api/?name=${course.creator.username}&background=3B82F6&color=fff`
                    }
                    alt={course.creator.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="font-black text-[#1F2937] text-[18px] block group-hover:text-[#3B82F6] transition-colors">
                    {course.creator.username}
                  </span>
                  <span className="text-[13px] text-gray-400 font-medium">
                    Main Instructor
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Nút Chat — chỉ hiện nếu không phải chính mình */}
                {user?.id !== course.creator.id && (
                  <button
                    onClick={() =>
                      openChat(course.creator!.id, course.creator!.username)
                    }
                    disabled={loadingChat}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-2xl transition-all font-bold text-[13px] disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {loadingChat ? "..." : "Nhắn tin"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Members Section */}
      <section>
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4 mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#F97316]" />
            <h2 className="text-[20px] font-black text-[#374151]">
              Classmates
            </h2>
          </div>
          <span className="bg-orange-50 text-[#F97316] px-3 py-1 rounded-full text-[12px] font-black uppercase">
            {course.students?.length || 0} Members
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {course.students && course.students.length > 0 ? (
            course.students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 bg-white border border-[#F3F4F6] rounded-[24px] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                    <img
                      src={
                        student.avatar ||
                        `https://ui-avatars.com/api/?name=${student.username}&background=random`
                      }
                      alt={student.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-[#4B5563] text-[16px] group-hover:text-[#3B82F6] transition-colors">
                    {student.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Nút Chat với classmate */}
                  {user?.id !== student.id && (
                    <button
                      onClick={() => openChat(student.id, student.username)}
                      disabled={loadingChat}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-[#3B82F6] rounded-xl transition-all text-[12px] font-bold disabled:opacity-50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">
                No students joined yet
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Chat Panel (slide-in từ phải) ──────────────────────────────── */}
      {activeChatId && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] z-50 flex flex-col shadow-2xl">
          <div className="flex-1 flex flex-col h-full">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
              <h3 className="font-black text-gray-800 text-[15px]">
                {chatTitle}
              </h3>
              <button
                onClick={() => setActiveChatId(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Chat component */}
            <div className="flex-1 min-h-0">
              <GroupChat
                conversationId={activeChatId}
                currentUserId={user?.id ?? ""}
                title=""
              />
            </div>
          </div>
        </div>
      )}

      {/* Overlay khi chat panel mở */}
      {activeChatId && (
        <div
          className="fixed inset-0 bg-black/20 z-40 sm:hidden"
          onClick={() => setActiveChatId(null)}
        />
      )}
    </div>
  );
}
