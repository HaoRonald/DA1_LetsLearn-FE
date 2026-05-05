"use client";

import React, { useState, useEffect } from "react";
import { GroupChat } from "@/components/chat/GroupChat";
import { chatService } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { CourseResponse } from "@/services/courseService";
import { Loader2, MessageCircle, Users } from "lucide-react";

interface GroupChatTabProps {
  course: CourseResponse;
}

/**
 * GroupChatTab — Tab chat nhóm cho toàn bộ thành viên trong course.
 *
 * Cách hoạt động:
 * - Dùng conversation giữa student ↔ teacher (instructor) làm kênh chat chính.
 * - Nếu user là teacher (creator), hiện danh sách student để chọn chat.
 * - Nếu user là student, tự động mở chat với teacher.
 */
export function GroupChatTab({ course }: GroupChatTabProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  const isTeacher =
    user?.role === "Teacher" || user?.role === "Admin" || course.creatorId === user?.id;

  // Nếu là student → tự động mở chat với teacher
  useEffect(() => {
    if (!user?.id || isTeacher || !course.creator) return;
    openConversation(course.creator.id, course.creator.username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, course.creator?.id]);

  const openConversation = async (targetId: string, targetName: string) => {
    setLoading(true);
    try {
      const conv = await chatService.getOrCreateConversation(targetId);
      setConversationId(conv.id);
      setSelectedUser({ id: targetId, name: targetName });
    } catch (err) {
      console.error("[GroupChatTab] Failed to get conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // ── Teacher view: chọn student để chat ─────────────────────────────────────
  if (isTeacher) {
    return (
      <div className="flex h-full gap-0 rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white shadow-sm">
        {/* Sidebar danh sách students */}
        <div className="w-64 shrink-0 border-r border-[#F3F4F6] flex flex-col bg-[#FAFAFA]">
          <div className="px-4 py-4 border-b border-[#F3F4F6]">
            <h3 className="font-black text-[14px] text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Tin nhắn
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {(course.students?.length ?? 0)} học sinh
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {course.students && course.students.length > 0 ? (
              course.students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openConversation(s.id, s.username)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white transition-all text-left group ${
                    selectedUser?.id === s.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                  }`}
                >
                  <img
                    src={s.avatar || `https://ui-avatars.com/api/?name=${s.username}&background=random`}
                    alt={s.username}
                    className="w-9 h-9 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className={`text-[13px] font-bold truncate ${selectedUser?.id === s.id ? "text-blue-600" : "text-gray-700"}`}>
                      {s.username}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">Student</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-[12px]">
                Chưa có học sinh nào
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : conversationId && selectedUser ? (
            <GroupChat
              conversationId={conversationId}
              currentUserId={user.id}
              title={`Chat với ${selectedUser.name}`}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-blue-300" />
              </div>
              <p className="font-bold text-gray-500">Chọn học sinh để nhắn tin</p>
              <p className="text-[12px]">Chọn một học sinh từ danh sách bên trái</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Student view: chat thẳng với teacher ────────────────────────────────────
  return (
    <div className="h-full">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : conversationId ? (
        <GroupChat
          conversationId={conversationId}
          currentUserId={user.id}
          title={`Chat với ${course.creator?.username ?? "Giáo viên"}`}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
          <MessageCircle className="w-12 h-12 text-gray-300" />
          <p className="font-bold">Không thể kết nối chat</p>
          <button
            onClick={() => course.creator && openConversation(course.creator.id, course.creator.username)}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-[13px] hover:bg-blue-600 transition-all"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
