"use client";

import { GroupChat } from "@/components/chat/GroupChat";
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/services/chatService";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";

/**
 * Demo page: /chat?conversationId=<uuid>
 * 
 * Cách dùng thực tế:
 *   - Từ CourseDetailPage, gọi chatService.getOrCreateConversation(otherUserId)
 *   - Rồi truyền conversationId vào <GroupChat />
 */
export default function ChatDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string; userId?: string }>;
}) {
  return <ChatContent searchParams={searchParams} />;
}

function ChatContent({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string; userId?: string }>;
}) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [activeConvId, setActiveConvId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!targetUserId.trim()) return;
    setLoading(true);
    try {
      const conv = await chatService.getOrCreateConversation(targetUserId.trim());
      setActiveConvId(conv.id);
    } catch (err) {
      console.error("Failed to get/create conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-4 gap-4">
        <h1 className="text-2xl font-black text-gray-800">💬 Group Chat Demo</h1>

        {!activeConvId ? (
          // Bước 1: Nhập conversationId hoặc userId để tạo conversation
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto w-full mt-10">
            <h2 className="text-lg font-black text-gray-700 mb-4">Bắt đầu chat</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold text-gray-500 block mb-1">
                  Conversation ID (nếu đã có)
                </label>
                <input
                  type="text"
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  placeholder="UUID của conversation..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                onClick={() => setActiveConvId(conversationId)}
                disabled={!conversationId.trim()}
                className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-40"
              >
                Mở chat theo Conversation ID
              </button>

              <div className="flex items-center gap-2 text-gray-300">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] font-bold text-gray-400">HOẶC</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-500 block mb-1">
                  User ID người muốn chat
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="UUID của người dùng..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                onClick={handleStart}
                disabled={!targetUserId.trim() || loading}
                className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-40"
              >
                {loading ? "Đang tạo..." : "Tạo / Mở conversation"}
              </button>
            </div>
          </div>
        ) : (
          // Bước 2: Hiện chat
          <div className="flex-1 min-h-0">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[12px] text-gray-400 font-mono">Conv: {activeConvId}</p>
              <button
                onClick={() => setActiveConvId("")}
                className="text-[12px] text-gray-400 hover:text-red-500 transition-colors font-bold"
              >
                ← Đổi chat
              </button>
            </div>
            <div className="h-[calc(100vh-220px)]">
              <GroupChat
                conversationId={activeConvId}
                currentUserId={user?.id ?? ""}
                title="Chat"
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
