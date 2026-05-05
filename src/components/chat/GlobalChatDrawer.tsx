"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  X,
  ChevronLeft,
  GraduationCap,
  Users,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { courseApi, CourseResponse } from "@/services/courseService";
import { chatService, ConversationSummary } from "@/services/chatService";
import { userService, UserProfile } from "@/services/userService";
import { GroupChat } from "@/components/chat/GroupChat";

// ── Types ────────────────────────────────────────────────────────────────────

type ActiveView =
  | { type: "home" }
  | { type: "group"; course: CourseResponse }
  | { type: "dm"; conversationId: string; otherUser: UserProfile };

type HomeTab = "groups" | "dms";

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalChatDrawer() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>({ type: "home" });
  const [homeTab, setHomeTab] = useState<HomeTab>("groups");

  // Data
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [dmUsers, setDmUsers] = useState<Record<string, UserProfile>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const isTeacherOrAdmin = user?.role === "Teacher" || user?.role === "Admin";

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);

      if (user) {
        const dmConvs = data.filter(
          (c) => 
            c.user2Id !== "00000000-0000-0000-0000-000000000000" && 
            c.user2Id?.toLowerCase() !== c.id?.toLowerCase()
        );
        const userMap: Record<string, UserProfile> = {};
        await Promise.all(
          dmConvs.map(async (c) => {
            const otherId =
              c.user1Id?.toLowerCase() === user.id.toLowerCase()
                ? c.user2Id
                : c.user1Id;
            if (otherId && !dmUsers[otherId.toLowerCase()]) {
              try {
                const res = await userService.getUserById(otherId);
                userMap[otherId.toLowerCase()] = res.data;
              } catch {}
            }
          })
        );
        if (Object.keys(userMap).length > 0) {
          setDmUsers((prev) => ({ ...prev, ...userMap }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  }, [user]);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setLoadingCourses(true);
    try {
      const response = await courseApi.getAll(user.id);
      setCourses(response.data);
    } catch (err) {
      console.error("Failed to fetch courses for chat", err);
    } finally {
      setLoadingCourses(false);
    }
  }, [user]);

  // Poll every 10 s for unread badges
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchConversations]);

  // Mount flag to safely use createPortal (avoid SSR mismatch)
  useEffect(() => { setMounted(true); }, []);

  // Load courses when drawer opens
  useEffect(() => {
    if (isOpen && isAuthenticated) fetchCourses();
  }, [isOpen, isAuthenticated, fetchCourses]);

  // ── Unread helpers ────────────────────────────────────────────────────────

  const markAsRead = (convId: string) => {
    localStorage.setItem(`lastRead_${convId.toLowerCase()}`, new Date().toISOString());
    setConversations((prev) => [...prev]);
  };

  const isUnread = (convId: string | null | undefined): boolean => {
    if (!convId) return false;
    const id = convId.toLowerCase();
    const conv = conversations.find((c) => c.id?.toLowerCase() === id);
    if (!conv?.updatedAt) return false;
    const lastRead = localStorage.getItem(`lastRead_${id}`);
    if (!lastRead) return true;
    return new Date(conv.updatedAt) > new Date(lastRead);
  };

  const getDmConv = (targetUserId: string) => {
    const norm = targetUserId.toLowerCase();
    return conversations.find(
      (c) =>
        c.user2Id !== "00000000-0000-0000-0000-000000000000" &&
        c.user2Id?.toLowerCase() !== c.id?.toLowerCase() &&
        (c.user1Id?.toLowerCase() === norm || c.user2Id?.toLowerCase() === norm)
    );
  };

  const dmConversations = conversations.filter(
    (c) => 
      c.user2Id !== "00000000-0000-0000-0000-000000000000" &&
      c.user2Id?.toLowerCase() !== c.id?.toLowerCase()
  );

  const groupUnreadCount = courses.filter((c) => isUnread(c.id)).length;
  const dmUnreadCount = dmConversations.filter((c) => isUnread(c.id)).length;
  const totalUnread = groupUnreadCount + dmUnreadCount;

  // ── Navigation ────────────────────────────────────────────────────────────

  const openGroupChat = (course: CourseResponse) => {
    markAsRead(course.id);
    setActiveView({ type: "group", course });
  };

  const openDm = async (targetId: string) => {
    setLoadingChat(true);
    try {
      const conv = await chatService.getOrCreateConversation(targetId);
      const normTarget = targetId.toLowerCase();
      let targetUser = dmUsers[normTarget];
      if (!targetUser) {
        const res = await userService.getUserById(targetId);
        targetUser = res.data;
        setDmUsers((prev) => ({ ...prev, [normTarget]: targetUser }));
      }
      markAsRead(conv.id);
      await fetchConversations();
      setActiveView({ type: "dm", conversationId: conv.id, otherUser: targetUser });
    } catch (err) {
      console.error("Failed to open DM", err);
    } finally {
      setLoadingChat(false);
    }
  };

  const openExistingDm = (conv: ConversationSummary) => {
    if (!user) return;
    const otherId =
      conv.user1Id?.toLowerCase() === user.id.toLowerCase()
        ? conv.user2Id
        : conv.user1Id;
    const otherUser = dmUsers[otherId?.toLowerCase()];
    if (!otherUser) return;
    markAsRead(conv.id);
    setActiveView({ type: "dm", conversationId: conv.id, otherUser });
  };

  const goHome = () => setActiveView({ type: "home" });

  // ── Unique students across all courses (for teacher DM tab) ──────────────
  const uniqueStudents = courses
    .flatMap((c) => c.students ?? [])
    .filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx);

  // ── Header ────────────────────────────────────────────────────────────────

  const renderHeaderTitle = () => {
    if (activeView.type === "group")
      return (
        <div>
          <h2 className="text-[15px] font-black text-gray-800 truncate max-w-[200px]">
            {activeView.course.title}
          </h2>
          <p className="text-[11px] text-blue-500 font-semibold">Group Chat</p>
        </div>
      );
    if (activeView.type === "dm")
      return (
        <div>
          <h2 className="text-[15px] font-black text-gray-800 truncate max-w-[200px]">
            {activeView.otherUser.username}
          </h2>
          <p className="text-[11px] text-gray-400">Direct Message</p>
        </div>
      );
    return <h2 className="text-[15px] font-black text-gray-800">Messages</h2>;
  };

  if (!isAuthenticated) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280] transition-colors relative"
      >
        <MessageSquare className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse border border-white" />
        )}
      </button>

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop — rendered at document.body, outside all stacking contexts */}
          <div
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer panel — highest z-index */}
          <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200">

            {/* Header */}
            <div className="h-14 px-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                {activeView.type !== "home" && (
                  <button
                    onClick={goHome}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {renderHeaderTitle()}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">

              {/* ── HOME ─────────────────────────────────────────────────── */}
              {activeView.type === "home" && (
                <>
                  {/* Tab bar */}
                  <div className="flex border-b border-gray-100 bg-white shrink-0">
                    <button
                      onClick={() => setHomeTab("groups")}
                      className={`flex-1 py-3 text-[13px] font-bold transition-colors relative ${
                        homeTab === "groups"
                          ? "text-blue-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Groups
                        {groupUnreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-black">
                            {groupUnreadCount}
                          </span>
                        )}
                      </span>
                      {homeTab === "groups" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
                      )}
                    </button>

                    <button
                      onClick={() => setHomeTab("dms")}
                      className={`flex-1 py-3 text-[13px] font-bold transition-colors relative ${
                        homeTab === "dms"
                          ? "text-blue-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        Direct
                        {dmUnreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-black">
                            {dmUnreadCount}
                          </span>
                        )}
                      </span>
                      {homeTab === "dms" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
                      )}
                    </button>
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">

                    {/* Groups tab */}
                    {homeTab === "groups" && (
                      <>
                        {loadingCourses ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="text-center py-10 text-gray-400">
                            <GraduationCap className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                            <p className="text-[13px]">No courses yet</p>
                          </div>
                        ) : (
                          courses.map((course) => {
                            const unread = isUnread(course.id);
                            return (
                              <button
                                key={course.id}
                                onClick={() => openGroupChat(course)}
                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all text-left"
                              >
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-white relative">
                                  <Users className="w-5 h-5" />
                                  {unread && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[13px] truncate ${unread ? "font-black text-gray-900" : "font-semibold text-gray-700"}`}>
                                    {course.title}
                                  </p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    {isTeacherOrAdmin
                                      ? `${course.students?.length ?? 0} students`
                                      : `Teacher: ${course.creator?.username ?? "Unknown"}`}
                                  </p>
                                </div>
                                {unread && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </>
                    )}

                    {/* DMs tab */}
                    {homeTab === "dms" && (
                      <>
                        {/* Teacher: list unique students */}
                        {isTeacherOrAdmin ? (
                          uniqueStudents.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                              <p className="text-[13px]">No students yet</p>
                            </div>
                          ) : (
                            uniqueStudents.map((student) => {
                              const dmConv = getDmConv(student.id);
                              const unread = isUnread(dmConv?.id);
                              return (
                                <button
                                  key={student.id}
                                  onClick={() => openDm(student.id)}
                                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all text-left"
                                >
                                  <div className="relative shrink-0">
                                    <img
                                      src={
                                        student.avatar ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(student.username)}&background=random`
                                      }
                                      alt={student.username}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                    {unread && (
                                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-[13px] truncate ${unread ? "font-black text-gray-900" : "font-semibold text-gray-700"}`}>
                                      {student.username}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Student</p>
                                  </div>
                                  {unread && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )
                        ) : (
                          // Student: list DM conversations
                          dmConversations.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                              <p className="text-[13px]">No direct messages yet</p>
                            </div>
                          ) : (
                            dmConversations.map((conv) => {
                              if (!user) return null;
                              const otherId =
                                conv.user1Id?.toLowerCase() === user.id.toLowerCase()
                                  ? conv.user2Id
                                  : conv.user1Id;
                              const otherUser = dmUsers[otherId?.toLowerCase()];
                              if (!otherUser) return null;
                              const unread = isUnread(conv.id);
                              return (
                                <button
                                  key={conv.id}
                                  onClick={() => openExistingDm(conv)}
                                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all text-left"
                                >
                                  <div className="relative shrink-0">
                                    <img
                                      src={
                                        otherUser.avatar ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username)}&background=random`
                                      }
                                      alt={otherUser.username}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                    {unread && (
                                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-[13px] truncate ${unread ? "font-black text-gray-900" : "font-semibold text-gray-700"}`}>
                                      {otherUser.username}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{otherUser.role}</p>
                                  </div>
                                  {unread && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {/* ── GROUP CHAT ───────────────────────────────────────────── */}
              {activeView.type === "group" && (
                <div className="flex-1 overflow-hidden bg-white">
                  <GroupChat
                    conversationId={activeView.course.id}
                    currentUserId={user!.id}
                    title=""
                  />
                </div>
              )}

              {/* ── DM CHAT ──────────────────────────────────────────────── */}
              {activeView.type === "dm" && (
                <div className="flex-1 overflow-hidden bg-white">
                  {loadingChat ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <GroupChat
                      conversationId={activeView.conversationId}
                      currentUserId={user!.id}
                      title=""
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      , document.body)}
    </>
  );
}
