"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGroupChat } from "@/hooks/useGroupChat";
import type { ChatMessage } from "@/services/chatService";
import { Send, Wifi, WifiOff, Loader2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Props ─────────────────────────────────────────────────────────────────────
interface GroupChatProps {
  /** ID của Conversation (= SignalR group). Truyền từ URL params hoặc props. */
  conversationId: string;
  /** ID của user đang đăng nhập — để phân biệt tin của mình / người khác. */
  currentUserId: string;
  /** Tên hiển thị của group/conversation */
  title?: string;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function ConnectionBadge({ status }: { status: string }) {
  const config = {
    connected:    { color: "bg-green-100 text-green-700", icon: <Wifi className="w-3 h-3" />, label: "Online" },
    connecting:   { color: "bg-yellow-100 text-yellow-700", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Đang kết nối..." },
    disconnected: { color: "bg-gray-100 text-gray-500", icon: <WifiOff className="w-3 h-3" />, label: "Offline" },
    error:        { color: "bg-red-100 text-red-600", icon: <WifiOff className="w-3 h-3" />, label: "Lỗi kết nối" },
  }[status] ?? { color: "bg-gray-100 text-gray-500", icon: null, label: status };

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  return (
    <div className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isMine && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[12px] font-black flex-shrink-0 mb-1">
          {msg.senderAvatar
            ? <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full rounded-full object-cover" />
            : msg.senderName?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
        {/* Sender name (chỉ hiện cho tin người khác) */}
        {!isMine && (
          <span className="text-[11px] font-bold text-gray-500 px-1">
            {msg.senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words shadow-sm ${
            isMine
              ? "bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white rounded-br-sm"
              : "bg-white border border-[#E5E7EB] text-gray-800 rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 px-1 font-medium">
          {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function GroupChat({ conversationId, currentUserId, title = "Chat" }: GroupChatProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, status, sendMessage, loadingHistory } = useGroupChat({
    conversationId,
    currentUserId,
    enabled: !!conversationId && !!currentUserId,
  });

  // Auto-scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending || status !== "connected") return;

    setIsSending(true);
    try {
      await sendMessage(trimmed);
      setInput("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("[chat] Send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center">
            <MessageCircle className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-[#1F2937]">{title}</h2>
            <p className="text-[11px] text-gray-400">{messages.length} tin nhắn</p>
          </div>
        </div>
        <ConnectionBadge status={status} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
              <p className="text-[13px] font-medium">Đang tải tin nhắn...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-[14px] font-bold text-gray-500">Chưa có tin nhắn nào</p>
            <p className="text-[12px] text-gray-400">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderId === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-4 bg-white border-t border-[#E5E7EB]">
        {status === "error" && (
          <p className="text-[12px] text-red-500 font-bold mb-2 text-center">
            ⚠️ Mất kết nối — đang thử kết nối lại...
          </p>
        )}
        <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-[#3B82F6] focus-within:bg-white transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              status === "connected"
                ? "Nhập tin nhắn... (Enter để gửi)"
                : "Đang kết nối..."
            }
            disabled={status !== "connected" || isSending}
            className="flex-1 bg-transparent text-[14px] text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending || status !== "connected"}
            className="w-9 h-9 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center hover:bg-[#2563EB] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
          >
            {isSending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
