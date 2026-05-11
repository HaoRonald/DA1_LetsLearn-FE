"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { chatService, type ChatMessage } from "@/services/chatService";

// ── Types ─────────────────────────────────────────────────────────────────────
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface UseGroupChatOptions {
  conversationId: string; // Group/Conversation ID để join
  currentUserId: string;  // ID của user đang đăng nhập (để phân biệt tin mình/người khác)
  enabled?: boolean;       // Chỉ kết nối khi enabled=true (default: true)
}

interface UseGroupChatReturn {
  messages: ChatMessage[];
  status: ConnectionStatus;
  sendMessage: (content: string, imageUrl?: string, fileUrl?: string, fileName?: string) => Promise<void>;
  loadingHistory: boolean;
}

// ── Helper: đọc token từ cookie ACCESS_TOKEN ──────────────────────────────────
/**
 * BE set cookie 'ACCESS_TOKEN' với format 'Bearer_<token>'.
 * SignalR cần token raw (không có prefix) để truyền qua accessTokenFactory.
 */
function getTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("ACCESS_TOKEN="))
    ?.split("=")
    .slice(1)
    .join("="); // Handle nếu token có ký tự '='
  if (raw?.startsWith("Bearer_")) return decodeURIComponent(raw.slice("Bearer_".length));
  return raw ? decodeURIComponent(raw) : "";
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGroupChat({
  conversationId,
  currentUserId,
  enabled = true,
}: UseGroupChatOptions): UseGroupChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Ref giữ connection để không bị tạo lại mỗi render
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  // Guard chống double-connect (React StrictMode)
  const isConnectingRef = useRef(false);

  // Lấy base URL (bỏ phần /api ở cuối vì hub không nằm trong /api)
  const hubUrl = (
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5169"
  ) + "/hubs/chat";

  // ── Load history từ REST API ────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!conversationId) return;
    setLoadingHistory(true);
    try {
      const history = await chatService.getMessages(conversationId);
      setMessages(history);
    } catch (err) {
      console.error("[chat] Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [conversationId]);

  // ── Kết nối SignalR ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !conversationId || isConnectingRef.current) return;
    isConnectingRef.current = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // Truyền token qua query string ?access_token=...
        // BE JwtAuthMiddleware sẽ đọc từ context.Request.Query["access_token"]
        accessTokenFactory: () => getTokenFromCookie(),
        // withCredentials để gửi cookie kèm (backup)
        withCredentials: true,
        // Ưu tiên WebSocket, fallback ServerSentEvents / LongPolling
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.ServerSentEvents |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        // Chiến lược reconnect: 0s, 2s, 5s, 10s, 30s rồi dừng
        nextRetryDelayInMilliseconds: (ctx) => {
          const delays = [0, 2000, 5000, 10000, 30000];
          return delays[ctx.previousRetryCount] ?? null;
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ── Event listeners ────────────────────────────────────────────────────
    
    // Nhận tin nhắn mới từ BE broadcast
    connection.on("ReceiveMessage", (msg: ChatMessage) => {
      setMessages((prev) => {
        // Tránh duplicate (trường hợp message gửi thành công từ chính mình)
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // BE xác nhận đã join group thành công
    connection.on("Joined", (joinedId: string) => {
      console.log(`[chat] Joined group: ${joinedId}`);
    });

    // Trạng thái reconnect
    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => setStatus("connected"));
    connection.onclose(() => {
      setStatus("disconnected");
      isConnectingRef.current = false;
    });

    // ── Start ────────────────────────────────────────────────────────────

    const start = async () => {
      try {
        setStatus("connecting");
        await connection.start();
        connectionRef.current = connection;

        // Sau khi kết nối thành công, join vào group conversation
        await connection.invoke("JoinConversation", conversationId);
        setStatus("connected");

        // Load lịch sử tin nhắn song song
        await loadHistory();
      } catch (err) {
        console.error("[chat] Connection error:", err);
        setStatus("error");
        isConnectingRef.current = false;
      }
    };

    start();

    // ── Cleanup khi component unmount hoặc conversationId thay đổi ────────
    return () => {
      isConnectingRef.current = false;
      connectionRef.current?.stop();
      connectionRef.current = null;
      setStatus("disconnected");
    };
  }, [conversationId, enabled, hubUrl, loadHistory]);

  // ── Send message qua SignalR ─────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string, fileUrl?: string, fileName?: string) => {
      const conn = connectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
        throw new Error("Not connected to chat server.");
      }
      if (!content.trim() && !imageUrl && !fileUrl) return;

      // Invoke hub method "SendMessage" — BE sẽ lưu DB rồi broadcast
      await conn.invoke("SendMessage", conversationId, content.trim(), imageUrl || null, fileUrl || null, fileName || null);
    },
    [conversationId]
  );

  return { messages, status, sendMessage, loadingHistory };
}
