"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, Trash2, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationService } from "@/services/notificationService";
import { AppNotification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // SSR safety
  useEffect(() => { setMounted(true); }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Close when clicking outside (both button and portal dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recalculate position on open or resize
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  const handleToggleDropdown = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string, isRead: boolean) => {
    e.stopPropagation();
    try {
      const updated = await notificationService.markAsRead(id, isRead);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: updated.isRead } : n))
      );
    } catch {
      toast.error("Failed to update notification.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id, true).then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      });
    }
    if (notification.type === "NEW_COURSE" && notification.entityId) {
      router.push(`/courses/${notification.entityId}`);
    }
    setIsOpen(false);
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case "NEW_COURSE": return <GraduationCap className="w-4 h-4" />;
      case "NEW_TOPIC": return <BookOpen className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getIconBg = (type?: string, isRead?: boolean) => {
    if (!isRead) {
      switch (type) {
        case "NEW_COURSE": return "bg-purple-100 text-purple-600";
        case "NEW_TOPIC": return "bg-blue-100 text-blue-600";
        default: return "bg-amber-100 text-amber-600";
      }
    }
    return "bg-gray-100 text-gray-500";
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isAuthenticated) return null;

  // ── Dropdown panel (portalled to body) ──────────────────────────────────
  const dropdownPanel = mounted && isOpen ? createPortal(
    <div
      ref={dropdownRef}
      style={{ top: dropdownPos.top, right: dropdownPos.right, position: "fixed" }}
      className="w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-[14px] font-black text-[#1F2937]">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-50 text-[#3B82F6] text-[11px] font-bold rounded-lg">
              {unreadCount} new
            </span>
          )}
          {notifications.length > 0 && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm("Delete all notifications?")) {
                  for (const n of notifications) await notificationService.deleteNotification(n.id);
                  setNotifications([]);
                  toast.success("All notifications deleted.");
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-red-500 transition-colors"
              title="Delete all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-[14px] font-bold text-gray-800">All caught up!</p>
            <p className="text-[12px] text-gray-400">You have no new notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-4 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer group relative ${
                  !notification.isRead ? "bg-blue-50/20" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                )}
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${getIconBg(notification.type, notification.isRead)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[13.5px] truncate ${!notification.isRead ? "font-black text-gray-900" : "font-bold text-gray-700"}`}>
                        {notification.title}
                      </p>
                      <p className="text-[10px] text-gray-400 flex-shrink-0 font-bold uppercase tracking-tighter">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-[12.5px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleMarkAsRead(e, notification.id, !notification.isRead)}
                      className={`p-2 rounded-lg hover:bg-white shadow-sm border border-transparent hover:border-gray-100 transition-all ${notification.isRead ? "text-gray-400" : "text-blue-500"}`}
                      title={notification.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-red-100 transition-all"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-50 mt-1 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
          <button
            className="text-[12px] font-black text-blue-600 hover:text-blue-700 transition-colors"
            onClick={async () => {
              const unread = notifications.filter((n) => !n.isRead);
              for (const n of unread) await notificationService.markAsRead(n.id, true);
              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
              toast.success("All notifications marked as read.");
            }}
          >
            Mark all as read
          </button>
          <Link href="/settings" className="text-[12px] font-bold text-gray-400 hover:text-gray-600 transition-colors">
            Settings
          </Link>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-md text-[#6B7280] transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </button>

      {dropdownPanel}
    </>
  );
}
