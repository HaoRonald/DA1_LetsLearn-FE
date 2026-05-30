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
  ArrowLeft,
  LogOut,
  UserIcon,
  X,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationDropdown from "./NotificationDropdown";
import { GlobalChatDrawer } from "@/components/chat/GlobalChatDrawer";

interface BoosterTip {
  title: string;
  category: string;
  summary: string;
  benefit: string;
  tip: string;
}

const CURATED_BOOSTERS: BoosterTip[] = [
  {
    title: "Pomodoro Technique",
    category: "Time Management",
    summary: "Study for 25 minutes, then take a 5-minute break. Repeat this 4 times, then take a longer 15-30 minute break.",
    benefit: "Keeps your mind fresh and prevents mental fatigue during intense study sessions.",
    tip: "Study Hack: Put your phone in another room during focus blocks to avoid distractions."
  },
  {
    title: "Active Recall",
    category: "Learning Method",
    summary: "Instead of passively re-reading notes, test your memory by writing down everything you remember, or by doing practice quizzes.",
    benefit: "Forces your brain to retrieve information, building much stronger neural connections for recall.",
    tip: "Study Hack: Turn your lecture slides into questions and try to answer them the next day."
  },
  {
    title: "Feynman Technique",
    category: "Learning Method",
    summary: "Explain a complex concept in simple terms, as if you were teaching it to a 10-year-old. Identify gaps in your own understanding and review the material.",
    benefit: "Helps you instantly identify what you truly understand versus what you have just memorized.",
    tip: "Study Hack: Try explaining the concept aloud to yourself or a friend without using complex jargon."
  },
  {
    title: "Spaced Repetition",
    category: "Memory Retention",
    summary: "Review the learned material at systematic intervals (e.g., after 1 day, 3 days, 7 days, and 30 days) instead of cramming everything in one night.",
    benefit: "Combats the forgetting curve and securely transfers knowledge into your long-term memory.",
    tip: "Study Hack: Use flashcards or set calendar reminders to schedule review sessions in advance."
  },
  {
    title: "Zeigarnik Effect",
    category: "Productivity",
    summary: "Your brain remembers incomplete tasks better than completed ones. Starting a task, even for 5 minutes, makes you much more likely to finish it.",
    benefit: "Overcomes procrastination by reducing the initial friction of starting a large assignment.",
    tip: "Study Hack: Tell yourself you will only work on a task for 5 minutes. Usually, you will keep going."
  }
];

function AiDailyBooster() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % CURATED_BOOSTERS.length);
      setIsGenerating(false);
    }, 600);
  };

  const currentBooster = CURATED_BOOSTERS[currentIndex];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-md transition-all duration-300 relative group cursor-pointer ${
          isOpen 
            ? "bg-gradient-to-r from-cyan-500/10 to-orange-500/10 text-cyan-600 ring-2 ring-cyan-500/30" 
            : "hover:bg-gray-155 text-[#6B7280] hover:text-cyan-500"
        }`}
        title="AI Study Booster"
      >
        <Sparkles className={`w-5 h-5 ${isOpen ? "animate-pulse" : "group-hover:scale-110 transition-transform"}`} />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-orange-400 rounded-full border border-white"></span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_45px_-10px_rgba(0,0,0,0.25)] border border-gray-100 p-5 z-20 animate-in fade-in slide-in-from-top-3 duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-gradient-to-r from-cyan-500 to-orange-500 rounded-lg text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-gray-800 tracking-tight leading-none">AI Study Booster</h4>
                  <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-1 inline-block">Smart study hacks</span>
                </div>
              </div>
              <button 
                onClick={handleNext}
                disabled={isGenerating}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-cyan-500 transition-colors disabled:opacity-50"
                title="Generate new recommendation"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin text-cyan-500" : ""}`} />
              </button>
            </div>

            {/* Main Content */}
            {isGenerating ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
                <p className="text-xs font-semibold text-gray-400 animate-pulse">AI is thinking...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Topic & Category */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[16px] font-black text-gray-900 tracking-tight">{currentBooster.title}</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-cyan-50 text-cyan-600 rounded-full uppercase tracking-wider whitespace-nowrap">
                      {currentBooster.category}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">Method Summary</p>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    {currentBooster.summary}
                  </p>
                </div>

                {/* Benefit */}
                <div className="pl-3 border-l-2 border-orange-400/70">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Key Benefit</p>
                  <p className="text-xs text-gray-800 leading-relaxed mt-0.5 font-medium">
                    {currentBooster.benefit}
                  </p>
                </div>

                {/* AI Hack Badge */}
                <div className="bg-gradient-to-r from-cyan-50 to-orange-50 p-3 rounded-xl border border-cyan-100/50">
                  <p className="text-[11px] text-gray-700 leading-relaxed font-semibold">
                    {currentBooster.tip}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";

  // Close user menu and mobile sidebar when navigation occurs
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const renderSidebarContent = () => {
    const handleLinkClick = () => {
      setIsMobileSidebarOpen(false);
    };

    return user?.role === "Admin" ? (
      /* ADMIN SIDEBAR */
      <div className="flex flex-col h-full">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[12px] font-black uppercase tracking-wider">
              Admin Control
            </span>
          </div>
        </div>

        <nav className="space-y-1 px-3 mb-6">
          <p className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Main Menu
          </p>
          <Link
            href="/admin"
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "dashboard" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={handleLinkClick}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[14px] font-bold">System Overview</span>
          </Link>
          <Link
            href="/admin?tab=users"
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "users" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={handleLinkClick}
          >
            <Users className="w-5 h-5" />
            <span className="text-[14px] font-bold">User Management</span>
          </Link>
          <Link
            href="/admin?tab=courses"
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "courses" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={handleLinkClick}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[14px] font-bold">Course Control</span>
          </Link>
        </nav>

        <nav className="space-y-1 px-3 mb-6">
          <p className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Analysis
          </p>
          <Link
            href="/admin?tab=statistics"
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/admin" && activeTab === "statistics" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={handleLinkClick}
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
              onClick={handleLinkClick}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[14px] font-bold">
                System Settings
              </span>
            </Link>
          </div>
        </div>
      </div>
    ) : (
      /* TEACHER/LEARNER SIDEBAR */
      <div className="flex flex-col h-full">
        {/* Main Links */}
        <nav className="space-y-1 px-3 mb-6">
          <Link
            href="/"
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${isHomeActive ? "text-[#3B82F6] bg-[#EEF2FF]" : "text-[#6B7280] hover:bg-gray-50"}`}
            onClick={handleLinkClick}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[14px] font-bold">Home</span>
          </Link>
          <Link
            href="/calendar"
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${isCalendarActive ? "text-[#3B82F6] bg-[#EEF2FF]" : "text-[#6B7280] hover:bg-gray-50"}`}
            onClick={handleLinkClick}
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
                onClick={handleLinkClick}
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
              onClick={handleLinkClick}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[14px] font-bold">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const isHomeActive = pathname === "/";
  const isDashboardActive = pathname.startsWith("/dashboard");
  const isCalendarActive = pathname.startsWith("/calendar");
  const isTodoActive = pathname.startsWith("/todo");
  const isCourseActive = pathname.startsWith("/courses");

  const isAdminOrTeacher = user?.role === "Admin" || user?.role === "Teacher";

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-black">
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 bg-white shrink-0 z-20 relative">
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
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280] transition-colors md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {headerTitle || (
            <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
              <img
                src="/logo.jpg"
                alt="Let's learn Logo"
                className="h-10 w-auto object-contain rounded-lg shadow-sm border border-gray-150"
              />
            </Link>
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
          <GlobalChatDrawer />
          
          <NotificationDropdown />
          
          <AiDailyBooster />

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
                        <UserIcon className="w-4 h-4" /> View Profile
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
                        <LogOut className="w-4 h-4" /> Logout
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
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] relative">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-[#E5E7EB] bg-white flex-shrink-0 hidden md:flex flex-col py-4 overflow-y-auto">
          {renderSidebarContent()}
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-white relative">
          {children}
        </main>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-50 flex md:hidden transition-opacity duration-300 ${
            isMobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <aside
            className={`relative w-64 max-w-xs bg-white h-full flex flex-col py-4 shadow-xl border-r border-[#E5E7EB] z-10 transition-transform duration-300 ${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Header / close button for mobile drawer */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100 mb-4">
              <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">
                Menu
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md text-[#6B7280]"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderSidebarContent()}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
