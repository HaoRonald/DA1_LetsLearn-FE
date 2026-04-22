"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  Plus,
  MessageSquare,
  Home as HomeIcon,
  Calendar,
  ChevronDown,
  GraduationCap,
  ListTodo,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Users,
  BookOpen,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function MainLayout({
  children,
  headerTitle,
}: {
  children: React.ReactNode;
  headerTitle?: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isEnrolledOpen, setIsEnrolledOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";

  // Close user menu when navigation occurs
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  const isHomeActive = pathname === "/";
  const isDashboardActive = pathname.startsWith("/dashboard");
  const isCalendarActive = pathname.startsWith("/calendar");
  const isTodoActive = pathname.startsWith("/todo");
  const isCourseActive = pathname.startsWith("/courses");

  const isAdminOrTeacher = user?.role === "Admin" || user?.role === "Teacher";

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-black">
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 bg-white shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          {!isHomeActive && (
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280] transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280] transition-colors md:hidden">
            <Menu className="w-5 h-5" />
          </button>
          {headerTitle || (
            <h1 className="text-[16px] font-semibold text-[#374151]">Home</h1>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {isAdminOrTeacher && (
            <Link
              href="/courses/create"
              className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </Link>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280] transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>

          <div className="relative">
            <div
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#3B82F6] transition-all relative group"
            >
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=3B82F6&color=fff`
                }
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-[14px] font-black text-[#1F2937] truncate">
                      {user?.username || "Guest session"}
                    </p>
                    <p className="text-[12px] font-medium text-gray-400 truncate">
                      {user?.email || "Login to sync progress"}
                    </p>
                    {user?.role && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-[#3B82F6] text-[10px] font-black uppercase rounded-lg">
                        {user.role}
                      </span>
                    )}
                  </div>

                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-[#4B5563] hover:bg-gray-50 hover:text-[#3B82F6] transition-all"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <GraduationCap className="w-4 h-4" /> View Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-[#4B5563] hover:bg-gray-50 hover:text-[#3B82F6] transition-all"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" /> Account Settings
                      </Link>
                      <div className="h-[1px] bg-gray-50 my-1 mx-2"></div>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-[#EF4444] hover:bg-red-50 transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-[#3B82F6] hover:bg-blue-50 transition-all"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <HomeIcon className="w-4 h-4" /> Login / Signup
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT (SIDEBAR + CONTENT) --- */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-[#E5E7EB] bg-white flex-shrink-0 hidden md:flex flex-col py-4 overflow-y-auto">
          {user?.role === "Admin" ? (
            /* ADMIN SIDEBAR */
            <div className="flex flex-col h-full">
              <div className="px-6 mb-8">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[12px] font-black uppercase tracking-wider">Admin Control</span>
                </div>
              </div>

              <nav className="space-y-1 px-3 mb-6">
                <p className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Main Menu</p>
                <Link
                  href="/admin"
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "dashboard" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-[14px] font-bold">System Overview</span>
                </Link>
                <Link
                  href="/admin?tab=users"
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "users" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[14px] font-bold">User Management</span>
                </Link>
                <Link
                  href="/admin?tab=courses"
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "courses" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-[14px] font-bold">Course Control</span>
                </Link>
              </nav>

              <nav className="space-y-1 px-3 mb-6">
                <p className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Analysis</p>
                <Link
                  href="/admin?tab=statistics"
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "statistics" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-[14px] font-bold">Statistics</span>
                </Link>
              </nav>

              <div className="mt-auto px-3">
                <div className="border-t border-[#E5E7EB] pt-4">
                  <Link
                    href="/settings"
                    className="flex items-center gap-4 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-[14px] font-bold">System Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* TEACHER/LEARNER SIDEBAR */
            <>
              {/* Main Links */}
              <nav className="space-y-1 px-3 mb-6">
                <Link
                  href="/"
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${isHomeActive ? "text-[#3B82F6] bg-[#EEF2FF]" : "text-[#6B7280] hover:bg-gray-50"}`}
                >
                  <HomeIcon className="w-5 h-5" />
                  <span className="text-[14px] font-bold">Home</span>
                </Link>
                {isAdminOrTeacher && (
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${isDashboardActive ? "text-[#3B82F6] bg-[#EEF2FF]" : "text-[#6B7280] hover:bg-gray-50"}`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[14px] font-bold">Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/calendar"
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${isCalendarActive ? "text-[#3B82F6] bg-[#EEF2FF]" : "text-[#6B7280] hover:bg-gray-50"}`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-[14px] font-bold">Calendar</span>
                </Link>
              </nav>

              {/* Enrolled Section */}
              <div className="mb-6">
                <button
                  onClick={() => setIsEnrolledOpen(!isEnrolledOpen)}
                  className="w-full flex items-center justify-between px-6 py-2 text-[#6B7280] hover:bg-gray-50 transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${!isEnrolledOpen ? "-rotate-90" : ""}`}
                    />
                    <GraduationCap className="w-5 h-5" />
                    <span className="text-[14px] font-bold text-[#374151]">
                      {isAdminOrTeacher ? "Teaching" : "Enrolled"}
                    </span>
                  </div>
                </button>

                {isEnrolledOpen && (
                  <div className="space-y-1">
                    <Link
                      href="/todo"
                      className={`flex items-center gap-4 px-9 py-2.5 transition-colors ${isTodoActive ? "text-[#3B82F6] bg-[#EEF2FF]" : "text-[#6B7280] hover:bg-gray-50"}`}
                    >
                      <ListTodo className="w-5 h-5" />
                      <span className="text-[14px] font-bold">
                        {isAdminOrTeacher ? "To review" : "To-do"}
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-auto px-3">
                <div className="border-t border-[#E5E7EB] pt-4">
                  <Link
                    href="/settings"
                    className="flex items-center gap-4 px-3 py-2.5 rounded-lg text-[#6B7280] hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-[14px] font-bold">Settings</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-white relative">
          {children}
        </main>
      </div>
    </div>
  );
}
