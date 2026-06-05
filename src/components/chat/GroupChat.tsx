"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGroupChat } from "@/hooks/useGroupChat";
import type { ChatMessage } from "@/services/chatService";
import {
  Send,
  Wifi,
  WifiOff,
  Loader2,
  MessageCircle,
  Image as ImageIcon,
  Paperclip,
  X,
  FileIcon,
  Download,
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  Trophy,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import axiosInstance from "@/lib/axios";
import {
  downloadFile,
  requestNotificationPermission,
  showNotification,
} from "@/lib/utils";
import { toast } from "sonner";

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
    connected: {
      color: "bg-green-100 text-green-700",
      icon: <Wifi className="w-3 h-3" />,
      label: "Online",
    },
    connecting: {
      color: "bg-yellow-100 text-yellow-700",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: "Đang kết nối...",
    },
    disconnected: {
      color: "bg-gray-100 text-gray-500",
      icon: <WifiOff className="w-3 h-3" />,
      label: "Offline",
    },
    error: {
      color: "bg-red-100 text-red-600",
      icon: <WifiOff className="w-3 h-3" />,
      label: "Lỗi kết nối",
    },
  }[status] ?? {
    color: "bg-gray-100 text-gray-500",
    icon: null,
    label: status,
  };

  return (
    <span
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${config.color}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ── Helper render Markdown ────────────────────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("# ")) {
      return (
        <h1
          key={i}
          className="text-xl font-black text-gray-900 mt-4 mb-2 border-b pb-1"
        >
          {line.replace("# ", "")}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="text-lg font-bold text-gray-800 mt-3 mb-2">
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className="text-md font-bold text-indigo-700 mt-2 mb-1">
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      const boldParts = line.replace("- ", "").split("**");
      return (
        <li
          key={i}
          className="ml-4 list-disc text-sm text-gray-700 leading-relaxed py-0.5"
        >
          {boldParts.map((part, index) =>
            index % 2 === 1 ? (
              <strong key={index} className="font-bold text-gray-900">
                {part}
              </strong>
            ) : (
              part
            ),
          )}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }
    const boldParts = line.split("**");
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">
        {boldParts.map((part, index) =>
          index % 2 === 1 ? (
            <strong key={index} className="font-bold text-gray-900">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
      </p>
    );
  });
}

// ── Date/Time Helpers ─────────────────────────────────────────────────────────
const isSameDay = (date1Str: string, date2Str: string) => {
  try {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch {
    return false;
  }
};

const formatDateSeparator = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    if (isToday) return "Hôm nay";
    if (isYesterday) return "Hôm qua";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return "";
  }
};

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isMine,
  generatingQuizForFileId,
  showQuizConfigForMessageId,
  setShowQuizConfigForMessageId,
  bloomLevel,
  setBloomLevel,
  questionCount,
  setQuestionCount,
  handleGenerateQuiz,
}: {
  msg: ChatMessage;
  isMine: boolean;
  generatingQuizForFileId: string | null;
  showQuizConfigForMessageId: string | null;
  setShowQuizConfigForMessageId: (id: string | null) => void;
  bloomLevel: string;
  setBloomLevel: (val: string) => void;
  questionCount: number;
  setQuestionCount: (val: number) => void;
  handleGenerateQuiz: (messageId: string) => void;
}) {
  const isQuizSupported = (fileName: string | undefined, fileUrl: string) => {
    const name = fileName || fileUrl;
    const ext = name.split(".").pop()?.toLowerCase();
    return ext === "pdf" || ext === "docx" || ext === "txt";
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        {!isMine && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[12px] font-black flex-shrink-0 mb-1">
            {msg.senderAvatar ? (
              <img
                src={msg.senderAvatar}
                alt={msg.senderName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (msg.senderName?.[0]?.toUpperCase() ?? "?")
            )}
          </div>
        )}

        <div
          className={`flex flex-col gap-1 max-w-[75%] min-w-0 ${isMine ? "items-end" : "items-start"}`}
        >
          {/* Sender name (chỉ hiện cho tin người khác) */}
          {!isMine && (
            <span className="text-[11px] font-bold text-gray-500 px-1">
              {msg.senderName}
            </span>
          )}

          {/* Bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words shadow-sm max-w-full ${
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
                  onClick={() => window.open(msg.imageUrl, "_blank")}
                />
              </div>
            )}

            {msg.fileUrl && (
              <div
                className={`mt-2 flex items-center gap-3 p-3 rounded-xl border w-full max-w-full min-w-0 ${
                  isMine
                    ? "bg-white/10 border-white/20"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMine ? "bg-white/20" : "bg-white shadow-sm"
                  }`}
                >
                  <FileIcon className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[12px] font-bold truncate ${isMine ? "text-white" : "text-gray-800"}`}
                  >
                    {msg.fileName ||
                      msg.fileUrl.split("/").pop()?.split("_").pop() ||
                      "Document"}
                  </p>
                  <p
                    className={`text-[10px] ${isMine ? "text-blue-100" : "text-gray-400"}`}
                  >
                    File đính kèm
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isQuizSupported(msg.fileName, msg.fileUrl) && (
                    <button
                      onClick={() =>
                        setShowQuizConfigForMessageId(
                          showQuizConfigForMessageId === msg.id ? null : msg.id,
                        )
                      }
                      disabled={generatingQuizForFileId === msg.id}
                      className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all ${
                        isMine
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "bg-white text-violet-600 shadow-sm border border-violet-100 hover:bg-violet-50"
                      }`}
                      title="Sinh Quiz AI"
                    >
                      {generatingQuizForFileId === msg.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() =>
                      downloadFile(
                        msg.fileUrl!,
                        msg.fileName ||
                          msg.fileUrl!.split("/").pop()?.split("_").pop() ||
                          "Document",
                      )
                    }
                    className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform ${
                      isMine
                        ? "bg-white/20 text-white"
                        : "bg-white text-gray-600 shadow-sm"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span 
            className="text-[10px] text-gray-400 px-1 font-medium select-none"
            title={new Date(msg.timestamp).toLocaleString("vi-VN")}
          >
            {formatTime(msg.timestamp)}
            {" • "}
            {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true, locale: vi })}
          </span>
        </div>
      </div>

      {/* AI Quiz Configuration Panel (Inline below file message) */}
      {showQuizConfigForMessageId === msg.id && (
        <div
          className={`mt-1.5 p-4 rounded-2xl border bg-white text-gray-800 shadow-lg border-violet-200 animate-in slide-in-from-top-2 duration-200 w-full max-w-[280px] ${
            isMine ? "self-end" : "self-start"
          }`}
        >
          <h4 className="text-[12px] font-black text-gray-900 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />{" "}
            Cấu hình Sinh Quiz AI
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">
                CẤP ĐỘ BLOOM
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value)}
                className="w-full text-[12px] border border-gray-200 rounded-lg p-1.5 bg-gray-50 focus:outline-none focus:border-indigo-500"
              >
                <option value="Remember">Remember (Nhớ)</option>
                <option value="Understand">Understand (Hiểu)</option>
                <option value="Apply">Apply (Áp dụng)</option>
                <option value="Analyze">Analyze (Phân tích)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">
                SỐ LƯỢNG CÂU HỎI
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full text-[12px] border border-gray-200 rounded-lg p-1.5 bg-gray-50 focus:outline-none focus:border-indigo-500"
              >
                <option value={3}>3 câu</option>
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowQuizConfigForMessageId(null)}
                className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-[11px] font-bold text-gray-500 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleGenerateQuiz(msg.id)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-md hover:scale-105 active:scale-95"
              >
                Sinh Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function GroupChat({
  conversationId,
  currentUserId,
  title = "Chat",
}: GroupChatProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<
    { url: string; type: "image" | "file"; name: string }[]
  >([]);

  // AI States
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const [generatingQuizForFileId, setGeneratingQuizForFileId] = useState<
    string | null
  >(null);
  const [showQuizConfigForMessageId, setShowQuizConfigForMessageId] = useState<
    string | null
  >(null);
  const [bloomLevel, setBloomLevel] = useState("Understand");
  const [questionCount, setQuestionCount] = useState(5);

  // Quiz success modal
  const [showQuizSuccessModal, setShowQuizSuccessModal] = useState(false);
  const [quizSuccessData, setQuizSuccessData] = useState<{
    topicId: string;
    fileName: string;
    bloomLevel: string;
    questionCount: number;
  } | null>(null);

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
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Gọi endpoint Media upload
      const res = await axiosInstance.post("/Media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadData = res.data.data; // MediaUploadResponse
      const url =
        type === "image" ? uploadData.displayUrl : uploadData.downloadUrl;

      setAttachments((prev) => [...prev, { url, type, name: file.name }]);
    } catch (err) {
      console.error("[chat] Upload error:", err);
      toast.error("Tải file lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    const hasAttachments = attachments.length > 0;

    if ((!trimmed && !hasAttachments) || isSending || status !== "connected")
      return;

    setIsSending(true);
    try {
      const imageUrl = attachments.find((a) => a.type === "image")?.url;
      const fileAttachment = attachments.find((a) => a.type === "file");
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

  // ── AI Handlers ───────────────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (messages.length < 2) return;
    requestNotificationPermission();
    setLoadingSummary(true);
    // Scroll to bottom so the AI thinking indicator is visible
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    const toastId = toast.loading(
      "Trợ lý AI đang tóm tắt nội dung cuộc trò chuyện. Vui lòng đợi trong giây lát...",
      {
        cancel: {
          label: "Ẩn",
          onClick: () => {},
        },
      },
    );
    try {
      const res = await axiosInstance.post(
        "/ai/chat/summarize",
        {
          conversationId,
          limit: 50,
        },
        {
          timeout: 60000, // 60s
        },
      );
      setSummaryText(res.data.summary);
      setShowSummaryModal(true);
      toast.dismiss(toastId);
      toast.success("Tóm tắt cuộc trò chuyện hoàn tất!");
      showNotification(
        "LetsLearn AI",
        "Tóm tắt cuộc trò chuyện bằng AI đã hoàn tất!",
      );
    } catch (err: any) {
      console.error("[AI Summarize] error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể thực hiện tóm tắt.";
      toast.dismiss(toastId);
      toast.error("Lỗi tóm tắt AI: " + errMsg);
      showNotification(
        "LetsLearn AI",
        "Tóm tắt cuộc trò chuyện bằng AI thất bại.",
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGenerateQuiz = async (messageId: string) => {
    // Lưu lại thông tin file của message đang được sinh quiz
    const targetMsg = messages.find((m) => m.id === messageId);
    const targetFileName =
      targetMsg?.fileName || targetMsg?.fileUrl?.split("/").pop() || "Tài liệu";

    requestNotificationPermission();
    setShowQuizConfigForMessageId(null);
    setGeneratingQuizForFileId(messageId);
    // Scroll to bottom so the AI thinking indicator is visible
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    const toastId = toast.loading(
      "Trợ lý AI đang tạo Quiz trắc nghiệm từ tài liệu. Tiến trình này có thể mất 1-2 phút",
      {
        cancel: {
          label: "Ẩn",
          onClick: () => {},
        },
      },
    );
    try {
      const res = await axiosInstance.post(
        "/ai/chat/generate-quiz",
        {
          messageId,
          bloomLevel,
          questionCount,
        },
        {
          timeout: 120000, // 120s
        },
      );
      // Hiển thị popup kết quả thay vì chỉ toast
      setQuizSuccessData({
        topicId: res.data.topicId,
        fileName: targetFileName,
        bloomLevel,
        questionCount,
      });
      setShowQuizSuccessModal(true);
      toast.dismiss(toastId);
      toast.success("Tạo Quiz từ tài liệu thành công!");
      showNotification(
        "LetsLearn AI",
        `Sinh câu hỏi ôn tập (Quiz) từ tài liệu "${targetFileName}" thành công!`,
      );
    } catch (err: any) {
      console.error("[AI Quiz] error:", err);
      const errMsg =
        err.response?.data?.message || err.message || "Không thể sinh Quiz.";
      toast.dismiss(toastId);
      toast.error("Lỗi sinh Quiz AI: " + errMsg);
      showNotification(
        "LetsLearn AI",
        `Sinh câu hỏi ôn tập (Quiz) từ tài liệu "${targetFileName}" thất bại.`,
      );
    } finally {
      setGeneratingQuizForFileId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center">
            <MessageCircle className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-[#1F2937]">{title}</h2>
            <p className="text-[11px] text-gray-400">
              {messages.length} tin nhắn
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length >= 2 && (
            <button
              onClick={handleSummarize}
              disabled={loadingSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-[12px] font-bold shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loadingSummary ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  Đang tóm tắt...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-3.5 h-3.5 text-white" />
                  Tóm tắt AI
                </>
              )}
            </button>
          )}
          <ConnectionBadge status={status} />
        </div>
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
            <p className="text-[14px] font-bold text-gray-500">
              Chưa có tin nhắn nào
            </p>
            <p className="text-[12px] text-gray-400">
              Hãy bắt đầu cuộc trò chuyện!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showDateSeparator =
                !prevMsg || !isSameDay(prevMsg.timestamp, msg.timestamp);

              return (
                <React.Fragment key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-6 py-2 select-none animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="flex-1 border-t border-[#E5E7EB] max-w-[15%]"></div>
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/95 backdrop-blur-md border border-[#E5E7EB] text-[#4B5563] rounded-full text-[11px] font-bold shadow-xs mx-3">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{formatDateSeparator(msg.timestamp)}</span>
                      </div>
                      <div className="flex-1 border-t border-[#E5E7EB] max-w-[15%]"></div>
                    </div>
                  )}
                  <MessageBubble
                    msg={msg}
                    isMine={msg.senderId === currentUserId}
                    generatingQuizForFileId={generatingQuizForFileId}
                    showQuizConfigForMessageId={showQuizConfigForMessageId}
                    setShowQuizConfigForMessageId={setShowQuizConfigForMessageId}
                    bloomLevel={bloomLevel}
                    setBloomLevel={setBloomLevel}
                    questionCount={questionCount}
                    setQuestionCount={setQuestionCount}
                    handleGenerateQuiz={handleGenerateQuiz}
                  />
                </React.Fragment>
              );
            })}

            {loadingSummary && (
              <div className="flex gap-2.5 items-end animate-pulse mt-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[12px] font-black flex-shrink-0 mb-1">
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col gap-1 max-w-[75%] items-start">
                  <span className="text-[11px] font-bold text-gray-500 px-1">
                    Trợ lý AI
                  </span>
                  <div className="px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words bg-violet-50 border border-violet-100 text-violet-800 rounded-bl-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 flex-shrink-0" />
                    <span>
                      Đang phân tích các tin nhắn và tổng hợp nội dung cuộc trò
                      chuyện... Vui lòng đợi.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {generatingQuizForFileId && (
              <div className="flex gap-2.5 items-end animate-pulse mt-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[12px] font-black flex-shrink-0 mb-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col gap-1 max-w-[75%] items-start">
                  <span className="text-[11px] font-bold text-gray-500 px-1">
                    Trợ lý AI
                  </span>
                  <div className="px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words bg-violet-50 border border-violet-100 text-violet-800 rounded-bl-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 flex-shrink-0" />
                    <span>
                      Đang đọc tài liệu giảng trình và soạn thảo câu hỏi Quiz...
                      Tiến trình này có thể mất 1-2 phút.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-4 bg-white border-t border-[#E5E7EB]">
        {/* Preview Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((at, i) => (
              <div
                key={i}
                className="relative group animate-in fade-in zoom-in duration-200"
              >
                {at.type === "image" ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-sm">
                    <img
                      src={at.url}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <FileIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-bold text-gray-600 max-w-[100px] truncate">
                      {at.name}
                    </span>
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
              onChange={(e) => handleFileSelect(e, "image")}
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={
                status !== "connected" ||
                uploading ||
                attachments.some((a) => a.type === "image")
              }
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors disabled:opacity-30"
              title="Gửi ảnh"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleFileSelect(e, "file")}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={
                status !== "connected" ||
                uploading ||
                attachments.some((a) => a.type === "file")
              }
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
                uploading
                  ? "Đang tải file..."
                  : status === "connected"
                    ? "Nhập tin nhắn..."
                    : "Đang kết nối..."
              }
              disabled={status !== "connected" || isSending || uploading}
              className="flex-1 bg-transparent text-[14px] text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={
                (!input.trim() && attachments.length === 0) ||
                isSending ||
                status !== "connected" ||
                uploading
              }
              className="w-9 h-9 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center hover:bg-[#2563EB] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Summary Modal (Glassmorphism design) */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600 animate-bounce" />
                <span className="font-black text-[15px] text-gray-900">
                  Trợ lý AI - Tóm tắt hội thoại
                </span>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 select-text">
              {renderMarkdown(summaryText)}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-all shadow-md hover:scale-105 active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Success Modal */}
      {showQuizSuccessModal && quizSuccessData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
            {/* Header gradient */}
            <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 text-white text-center overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
              {/* Icon */}
              <div className="relative w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <h3 className="relative font-black text-[18px] mb-1">
                Quiz AI tạo thành công! 🎉
              </h3>
              <p className="relative text-[13px] text-white/80">
                Bộ câu hỏi đã được thêm vào khóa học
              </p>
              {/* Close button */}
              <button
                onClick={() => setShowQuizSuccessModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3">
              {/* File source */}
              <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                    Tài liệu nguồn
                  </p>
                  <p className="text-[13px] font-bold text-gray-800 truncate">
                    {quizSuccessData.fileName}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-violet-50 rounded-2xl border border-violet-100 text-center">
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wide mb-1">
                    Số câu hỏi
                  </p>
                  <p className="text-[22px] font-black text-violet-700">
                    {quizSuccessData.questionCount}
                  </p>
                  <p className="text-[10px] text-violet-400">câu trắc nghiệm</p>
                </div>
                <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">
                    Cấp độ Bloom
                  </p>
                  <p className="text-[13px] font-black text-indigo-700 mt-1">
                    {quizSuccessData.bloomLevel}
                  </p>
                  <p className="text-[10px] text-indigo-400">taxonomy level</p>
                </div>
              </div>

              {/* Success note */}
              <div className="flex items-start gap-2.5 p-3 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-green-700 leading-relaxed">
                  Quiz đã được thêm vào phần <strong>Ôn tập</strong> của khóa
                  học. Bot đã gửi thông báo đến tất cả thành viên nhóm.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowQuizSuccessModal(false)}
                className="flex-1 py-2.5 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-[13px] font-bold text-gray-600 transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowQuizSuccessModal(false);
                  toast.info("Vào mục Ôn tập trong khóa học để làm bài Quiz!");
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Làm Quiz ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
