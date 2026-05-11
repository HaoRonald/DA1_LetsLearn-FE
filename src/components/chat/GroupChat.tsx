"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGroupChat } from "@/hooks/useGroupChat";
import type { ChatMessage } from "@/services/chatService";
import { Send, Wifi, WifiOff, Loader2, MessageCircle, Image as ImageIcon, Paperclip, X, FileIcon, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import axiosInstance from "@/lib/axios";
import { downloadFile } from "@/lib/utils";

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
          {msg.content && <p>{msg.content}</p>}
          
          {msg.imageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
              <img 
                src={msg.imageUrl} 
                alt="attachment" 
                className="max-w-full h-auto max-h-[300px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(msg.imageUrl, '_blank')}
              />
            </div>
          )}

          {msg.fileUrl && (
            <div className={`mt-2 flex items-center gap-3 p-3 rounded-xl border ${
              isMine ? "bg-white/10 border-white/20" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isMine ? "bg-white/20" : "bg-white shadow-sm"
              }`}>
                <FileIcon className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-bold truncate ${isMine ? "text-white" : "text-gray-800"}`}>
                  {msg.fileName || msg.fileUrl.split('/').pop()?.split('_').pop() || "Document"}
                </p>
                <p className={`text-[10px] ${isMine ? "text-blue-100" : "text-gray-400"}`}>File đính kèm</p>
              </div>
              <button 
                onClick={() => downloadFile(msg.fileUrl!, msg.fileName || msg.fileUrl!.split('/').pop()?.split('_').pop() || "Document")}
                className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform ${
                  isMine ? "bg-white/20 text-white" : "bg-white text-gray-600 shadow-sm"
                }`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
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
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<{ url: string, type: 'image' | 'file', name: string }[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { messages, status, sendMessage, loadingHistory } = useGroupChat({
    conversationId,
    currentUserId,
    enabled: !!conversationId && !!currentUserId,
  });

  // Auto-scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Gọi endpoint Media upload
      const res = await axiosInstance.post("/Media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const uploadData = res.data.data; // MediaUploadResponse
      const url = type === 'image' ? uploadData.displayUrl : uploadData.downloadUrl;
      
      setAttachments(prev => [...prev, { url, type, name: file.name }]);
    } catch (err) {
      console.error("[chat] Upload error:", err);
      alert("Tải file lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    const hasAttachments = attachments.length > 0;
    
    if ((!trimmed && !hasAttachments) || isSending || status !== "connected") return;

    setIsSending(true);
    try {
      const imageUrl = attachments.find(a => a.type === 'image')?.url;
      const fileAttachment = attachments.find(a => a.type === 'file');
      const fileUrl = fileAttachment?.url;
      const fileName = fileAttachment?.name;
      
      await sendMessage(trimmed, imageUrl, fileUrl, fileName);
      setInput("");
      setAttachments([]);
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
        {/* Preview Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((at, i) => (
              <div key={i} className="relative group animate-in fade-in zoom-in duration-200">
                {at.type === 'image' ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-sm">
                    <img src={at.url} className="w-full h-full object-cover" alt="preview" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <FileIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-bold text-gray-600 max-w-[100px] truncate">{at.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="text-[12px] text-red-500 font-bold mb-2 text-center">
            ⚠️ Mất kết nối — đang thử kết nối lại...
          </p>
        )}
        
        <div className="flex items-center gap-2">
          {/* Media Buttons */}
          <div className="flex items-center gap-1">
            <input 
              type="file" 
              ref={imageInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileSelect(e, 'image')}
            />
            <button 
              onClick={() => imageInputRef.current?.click()}
              disabled={status !== "connected" || uploading || attachments.some(a => a.type === 'image')}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors disabled:opacity-30"
              title="Gửi ảnh"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => handleFileSelect(e, 'file')}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={status !== "connected" || uploading || attachments.some(a => a.type === 'file')}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors disabled:opacity-30"
              title="Đính kèm file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-[#3B82F6] focus-within:bg-white transition-all shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                uploading ? "Đang tải file..." :
                status === "connected"
                  ? "Nhập tin nhắn..."
                  : "Đang kết nối..."
              }
              disabled={status !== "connected" || isSending || uploading}
              className="flex-1 bg-transparent text-[14px] text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isSending || status !== "connected" || uploading}
              className="w-9 h-9 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center hover:bg-[#2563EB] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
            >
              {isSending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
