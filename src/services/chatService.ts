// chatService.ts — REST API calls cho chat (lấy lịch sử tin nhắn)
// SignalR connection được quản lý riêng trong useGroupChat hook

import axiosInstance from "@/lib/axios";

// ── Shared Contract (khớp với ChatMessageDto của BE) ─────────────────────────
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  imageUrl?: string;
  fileUrl?: string;
  timestamp: string; // ISO 8601
}

export interface ConversationSummary {
  id: string;
  user1Id: string;
  user2Id: string;
  updatedAt: string | null; // ISO 8601
}

// ── REST API ──────────────────────────────────────────────────────────────────

export const chatService = {
  /**
   * Lấy lịch sử tin nhắn của một conversation.
   * Tái dụng endpoint POST /message/getMessages sẵn có.
   */
  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await axiosInstance.post<ChatMessage[]>("/message/getMessages", {
      conversationId,
    });
    return res.data;
  },

  /**
   * Tạo/lấy conversation với một user khác (1-1 DM).
   * Dùng endpoint POST /conversation?otherUserId=...
   */
  getOrCreateConversation: async (otherUserId: string): Promise<{ id: string }> => {
    const res = await axiosInstance.post<{ id: string }>(
      `/conversation?otherUserId=${otherUserId}`
    );
    return res.data;
  },

  /**
   * Lấy tất cả conversations của user hiện tại.
   */
  getConversations: async (): Promise<ConversationSummary[]> => {
    const res = await axiosInstance.get<ConversationSummary[]>("/conversation");
    return res.data;
  },
};
