"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Users,
  Star,
  Plus,
  Search,
  Filter,
  Globe,
  Lock,
  MoreVertical,
  Edit3,
  Eye,
  TrendingUp,
  GraduationCap,
  Loader2,
  ChevronRight,
  BarChart2,
  X,
  CreditCard,
  Check,
  CheckCircle2,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useRouter } from "next/navigation";
import { courseApi, CourseResponse } from "@/services/courseService";
import { paymentApi } from "@/services/paymentService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

// ── Teacher view: courses they created ──────────────────────────────────────
function TeacherCourseCard({
  course,
  onClick,
  onEdit,
}: {
  course: CourseResponse;
  onClick: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[24px] border border-[#F3F4F6] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_14px_30px_-5px_rgba(0,0,0,0.12)] transition-all cursor-pointer group flex flex-col"
    >
      {/* Thumbnail */}
      <div className="h-44 w-full relative overflow-hidden">
        <img
          src={
            course.imageUrl ||
            "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=800&auto=format&fit=crop"
          }
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Published / Draft badge */}
        <div className="absolute top-4 left-4">
          {course.isPublished ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-[11px] font-black rounded-full shadow-sm">
              <Globe className="w-3 h-3" /> Published
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 bg-gray-700/80 backdrop-blur-sm text-white text-[11px] font-black rounded-full shadow-sm">
              <Lock className="w-3 h-3" /> Draft
            </span>
          )}
        </div>

        {/* Student count */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="text-[12px] font-semibold">
              {course.totalJoined || 0} students
            </span>
          </div>
          {course.category && (
            <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold rounded-full">
              {course.category}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[16px] font-black text-[#1F2937] group-hover:text-[#3B82F6] transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 -mr-2 text-[#9CA3AF] hover:text-[#374151] rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[13px] text-[#6B7280] line-clamp-2 mb-4 flex-1">
          {course.description || "No description provided."}
        </p>

        {/* Quick-action bar */}
        <div className="mt-auto pt-3 border-t border-[#F3F4F6] flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-[#3B82F6] bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-[#6B7280] bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
          >
            <BarChart2 className="w-3.5 h-3.5" /> Stats
          </button>
          <div className="ml-auto text-[14px] font-black text-[#1F2937]">
            {course.price ? `$${course.price}` : "FREE"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Learner view: all published courses ──────────────────────────────────────
function LearnerCourseCard({
  course,
  isEnrolled,
  onClick,
}: {
  course: CourseResponse;
  isEnrolled: boolean;
  onClick: () => void;
}) {
  const [isJoining, setIsJoining] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isPaidCourse = course.price && course.price > 0;

  const handleEnrollClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaidCourse) {
      setShowPaymentModal(true);
    } else {
      setIsJoining(true);
      try {
        await courseApi.join(course.id);
        toast.success("Enrolled successfully!");
        window.location.reload();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to enroll");
      } finally {
        setIsJoining(false);
      }
    }
  };

  const handlePayment = async (paymentMethod: string) => {
    if (paymentMethod !== "vnpay") {
      toast.info(
        "This payment method is currently unavailable. Please use VNPay.",
      );
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await paymentApi.createPaymentUrl(course.id);
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("Failed to generate payment URL");
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      toast.error(
        err.response?.data?.message || "Payment failed. Please try again.",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-[24px] border border-[#F3F4F6] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_14px_30px_-5px_rgba(0,0,0,0.12)] transition-all cursor-pointer group flex flex-col"
      >
        <div className="h-44 w-full relative overflow-hidden">
          <img
            src={
              course.imageUrl ||
              "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=800&auto=format&fit=crop"
            }
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#3B82F6] text-[12px] font-bold rounded-full shadow-sm">
              {course.category || "General"}
            </span>
          </div>

          {isEnrolled && (
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/90 backdrop-blur-sm text-white text-[11px] font-black rounded-full">
                <GraduationCap className="w-3 h-3" /> Enrolled
              </span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="text-[12px] font-medium">
                {course.totalJoined || 0} students
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-[12px] font-bold">4.8</span>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-[17px] font-bold text-[#1F2937] group-hover:text-[#3B82F6] transition-colors line-clamp-2 leading-snug">
              {course.title}
            </h3>
          </div>

          <p className="text-[14px] text-[#6B7280] line-clamp-2 mb-4 flex-1">
            {course.description || "No description available for this course."}
          </p>

          <div className="mt-auto pt-4 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 shrink">
              <img
                src={
                  course.creator?.avatar ||
                  `https://ui-avatars.com/api/?name=${course.creator?.username || "U"}&background=random`
                }
                className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                alt="Creator"
              />
              <span className="text-[13px] font-semibold text-[#4B5563] truncate">
                {course.creator?.username || "Instructor"}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-[15px] font-black text-[#1F2937] whitespace-nowrap">
                {course.price ? `$${course.price}` : "FREE"}
              </div>
              {!isEnrolled && (
                <button
                  onClick={handleEnrollClick}
                  disabled={isJoining}
                  className="px-2 sm:px-3 py-1.5 bg-[#F97316] text-white text-[11px] sm:text-[12px] font-bold rounded-lg shadow-sm hover:bg-[#EA580C] hover:shadow transition-all disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                >
                  {isJoining ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isPaidCourse ? (
                    <>
                      <CreditCard className="w-3 h-3" /> Buy
                    </>
                  ) : (
                    "Enroll"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Checkout Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* High-end Backdrop */}
          <div
            className="absolute inset-0 bg-[#020617]/60 backdrop-blur-[12px] animate-in fade-in duration-700"
            onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
          ></div>

          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 overflow-hidden border border-white/40 relative z-10 flex flex-col md:flex-row h-auto max-h-[90vh]">
            {/* Left Side: Course Preview (Hidden on small mobile) */}
            <div className="hidden md:flex md:w-[40%] bg-[#F8FAFC] p-8 flex-col border-r border-[#F1F5F9]">
              <div className="mb-6 rounded-3xl overflow-hidden aspect-video shadow-md border-4 border-white">
                <img
                  src={
                    course.imageUrl ||
                    "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=800"
                  }
                  className="w-full h-full object-cover"
                  alt={course.title}
                />
              </div>
              <h4 className="text-[#0F172A] font-black text-xl leading-tight mb-3">
                {course.title}
              </h4>
              <p className="text-[#64748B] text-sm line-clamp-4 leading-relaxed mb-6 font-medium">
                {course.description}
              </p>

              <div className="mt-auto space-y-4">
                <div className="flex items-center gap-3 text-[#334155]">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tight">
                    Lifetime Access
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[#334155]">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tight">
                    Certificate of Completion
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Payment Logic */}
            <div className="flex-1 p-8 md:p-10 flex flex-col bg-white">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2 block">
                    Premium Enrollment
                  </span>
                  <h2 className="text-[#0F172A] font-black text-3xl tracking-tight">
                    Secure Payment
                  </h2>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessingPayment}
                  className="text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] p-2 rounded-2xl transition-all disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Order Summary Card */}
              <div className="mb-8 p-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[32px] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-blue-300 font-bold text-xs uppercase tracking-widest">
                      Grand Total
                    </span>
                    <div className="px-2 py-0.5 bg-green-500/20 backdrop-blur-md rounded-full border border-green-500/30 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      <span className="text-[9px] font-black uppercase text-green-400">
                        SECURE
                      </span>
                    </div>
                  </div>
                  <div className="text-4xl font-black tracking-tighter">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(course.price || 0)}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 mb-8">
                <p className="text-[#64748B] text-[11px] font-black uppercase tracking-widest ml-1">
                  Select Gateway
                </p>

                <button
                  onClick={() => handlePayment("vnpay")}
                  disabled={isProcessingPayment}
                  className="group relative w-full flex items-center gap-5 p-5 bg-white border-2 border-[#F1F5F9] hover:border-blue-600 rounded-[28px] transition-all hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] disabled:opacity-50 active:scale-[0.98]"
                >
                  <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-500">
                    <img
                      src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo-vnpay.png"
                      alt="VNPay"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-[#0F172A] text-lg">
                      VNPay Gateway
                    </p>
                    <p className="text-[#64748B] text-[11px] font-semibold">
                      Banking, QR, Cards
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-[#E2E8F0] group-hover:border-blue-600 flex items-center justify-center transition-colors">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  </div>
                </button>
              </div>

              {/* Trust & Policy */}
              <div className="mt-auto pt-6 border-t border-[#F1F5F9] flex flex-col items-center gap-4">
                <div className="flex items-center gap-8 text-[#94A3B8]">
                  <div className="flex flex-col items-center gap-1">
                    <Lock className="w-4 h-4" />
                    <span className="text-[8px] font-black uppercase">
                      AES-256
                    </span>
                  </div>
                  <div className="w-px h-6 bg-[#E2E8F0]"></div>
                  <div className="flex flex-col items-center gap-1 text-[#3B82F6]">
                    <Globe className="w-4 h-4" />
                    <span className="text-[8px] font-black uppercase">
                      GLOBAL
                    </span>
                  </div>
                </div>
                <p className="text-[#94A3B8] text-[10px] text-center font-medium leading-relaxed">
                  By completing this purchase, you agree to our Terms. <br />
                  Transaction is securely processed by VNPay.
                </p>
              </div>

              {/* Loading State Overlay */}
              {isProcessingPayment && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-blue-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 absolute inset-0 m-auto" />
                  </div>
                  <h3 className="text-[#0F172A] font-black text-2xl mb-2">
                    Connecting...
                  </h3>
                  <p className="text-[#64748B] text-sm font-medium leading-relaxed">
                    Please keep this window open while we connect you to the
                    secure payment gateway.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="h-10 bg-gray-50 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === "Teacher";
  const isAdmin = user?.role === "Admin";
  const isAdminOrTeacher = isTeacher || isAdmin;

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPublished, setFilterPublished] = useState<
    "all" | "published" | "draft"
  >("all");

  // ── Redirect if not authenticated or if Admin ──────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "Admin") {
        router.push("/admin");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // ── Fetch courses based on role ───────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let res;
      if (isAdminOrTeacher) {
        res = await courseApi.getAll(user.id);
      } else {
        res = await axiosInstance.get<CourseResponse[]>("/Course", {
          params: { _t: Date.now() },
        });
      }
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdminOrTeacher]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCourses();
    }
  }, [isAuthenticated, user, fetchCourses]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
        </div>
      }
    >
      <HomeContent
        user={user}
        isAuthenticated={isAuthenticated}
        courses={courses}
        loading={loading}
        fetchCourses={fetchCourses}
        isAdminOrTeacher={isAdminOrTeacher}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterPublished={filterPublished}
        setFilterPublished={setFilterPublished}
      />
    </Suspense>
  );
}

function HomeContent({
  user,
  isAuthenticated,
  courses,
  loading,
  fetchCourses,
  isAdminOrTeacher,
  searchQuery,
  setSearchQuery,
  filterPublished,
  setFilterPublished,
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  // ── Handle Payment Status Notification ────────────────────────────────────
  useEffect(() => {
    const paymentStatus = searchParams.get("paymentStatus");
    if (!paymentStatus || processedRef.current) return;

    if (paymentStatus === "Success") {
      processedRef.current = true;
      toast.success("Học ngay thôi! 🚀", {
        description: "Thanh toán thành công. Khóa học đã được mở khóa cho bạn.",
        duration: 6000,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchCourses();
    } else if (paymentStatus === "Failed") {
      processedRef.current = true;
      toast.error("Thanh toán thất bại ❌", {
        description:
          "Đã có lỗi xảy ra trong quá trình giao dịch. Vui lòng thử lại.",
        duration: 6000,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, fetchCourses]);

  // ── Filter + search ───────────────────────────────────────────────────────
  const filtered = courses.filter((c: any) => {
    const matchSearch =
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchFilter =
      filterPublished === "all" ||
      (filterPublished === "published" && c.isPublished) ||
      (filterPublished === "draft" && !c.isPublished);

    return matchSearch && matchFilter;
  });

  // ── Stats for teacher ─────────────────────────────────────────────────────
  const publishedCount = courses.filter((c: any) => c.isPublished).length;
  const draftCount = courses.filter((c: any) => !c.isPublished).length;
  const totalStudents = courses.reduce(
    (acc: number, c: any) => acc + (c.totalJoined || 0),
    0,
  );
  const enrolledCourseIds = new Set(
    user?.enrollments?.map((e: any) => e.courseId) || [],
  );

  if (!isAuthenticated) return null;

  return (
    <MainLayout>
      <div className="p-6 lg:p-10 bg-[#F9FAFB] min-h-full">
        <div className="max-w-7xl mx-auto">
          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[28px] font-black text-[#111827]">
                {isAdminOrTeacher ? "My Teaching Courses" : "Explore Courses"}
              </h1>
              <p className="text-[#6B7280] text-[15px] mt-1">
                {isAdminOrTeacher
                  ? "Manage and monitor all courses you created"
                  : "Discover and join courses to start learning"}
              </p>
            </div>

            {isAdminOrTeacher && (
              <button
                onClick={() => router.push("/courses/create")}
                className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" /> Create Course
              </button>
            )}
          </div>

          {/* ── Teacher Stats Bar ─────────────────────────────────────────── */}
          {isAdminOrTeacher && !loading && courses.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Total Courses",
                  value: courses.length,
                  icon: BookOpen,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  label: "Published",
                  value: publishedCount,
                  icon: Globe,
                  color: "text-green-600 bg-green-50",
                },
                {
                  label: "Draft",
                  value: draftCount,
                  icon: Lock,
                  color: "text-gray-600 bg-gray-100",
                },
                {
                  label: "Total Students",
                  value: totalStudents,
                  icon: Users,
                  color: "text-orange-600 bg-orange-50",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-[#F3F4F6] p-4 shadow-sm flex items-center gap-4"
                >
                  <div className={`p-2.5 rounded-xl ${s.color.split(" ")[1]}`}>
                    <s.icon className={`w-5 h-5 ${s.color.split(" ")[0]}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      {s.label}
                    </p>
                    <p className="text-[22px] font-black text-[#1F2937] leading-none mt-0.5">
                      {s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Learner: My Enrolled + Explore ────────────────────────────── */}
          {!isAdminOrTeacher && !loading && enrolledCourseIds.size > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-black text-[#374151] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#3B82F6]" /> Continue
                  Learning
                </h2>
                <button className="text-[13px] font-bold text-[#3B82F6] flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses
                  .filter((c) => enrolledCourseIds.has(c.id))
                  .slice(0, 4)
                  .map((course) => (
                    <LearnerCourseCard
                      key={course.id}
                      course={course}
                      isEnrolled
                      onClick={() => router.push(`/courses/${course.id}`)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* ── Search + Filter bar ────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder={
                  isAdminOrTeacher ? "Search your courses…" : "Search courses…"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
              />
            </div>
            {isAdminOrTeacher && (
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-1 py-1 w-full sm:w-auto">
                {(["all", "published", "draft"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterPublished(f)}
                    className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all capitalize ${
                      filterPublished === f
                        ? "bg-[#3B82F6] text-white shadow-sm"
                        : "text-[#6B7280] hover:bg-gray-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Section title for explore (learner) ───────────────────────── */}
          {!isAdminOrTeacher && (
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
              <h2 className="text-[18px] font-black text-[#374151]">
                All Courses
              </h2>
              <span className="ml-1 px-2 py-0.5 bg-blue-50 text-[#3B82F6] text-[12px] font-black rounded-full">
                {filtered.length}
              </span>
            </div>
          )}

          {/* ── Grid ─────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-blue-50 p-6 rounded-full mb-4">
                <BookOpen className="w-12 h-12 text-[#3B82F6]" />
              </div>
              <h3 className="text-[20px] font-black text-[#374151]">
                {isAdminOrTeacher ? "No courses yet" : "No courses found"}
              </h3>
              <p className="text-[#9CA3AF] mt-2 mb-6 text-center max-w-xs">
                {isAdminOrTeacher
                  ? "Create your first course and start teaching!"
                  : "Try a different search or check back later."}
              </p>
              {isAdminOrTeacher && (
                <button
                  onClick={() => router.push("/courses/create")}
                  className="flex items-center gap-2 bg-[#3B82F6] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#2563EB] transition-all shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" /> Create First Course
                </button>
              )}
            </div>
          ) : isAdminOrTeacher ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((course) => (
                <TeacherCourseCard
                  key={course.id}
                  course={course}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  onEdit={() =>
                    router.push(`/courses/${course.id}?tab=content`)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((course) => (
                <LearnerCourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                  onClick={() => router.push(`/courses/${course.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
