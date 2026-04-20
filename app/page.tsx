'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, Users, Star, Plus, Search, Filter,
  Globe, Lock, MoreVertical, Edit3, Eye, TrendingUp,
  GraduationCap, Loader2, ChevronRight, BarChart2,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { courseApi, CourseResponse } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
            'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=800&auto=format&fit=crop'
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
          {course.description || 'No description provided.'}
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
            {course.price ? `$${course.price}` : 'FREE'}
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

  const handleEnrollClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card from redirecting
    setIsJoining(true);
    try {
      await courseApi.join(course.id);
      toast.success("Enrolled successfully!");
      window.location.reload(); // Refresh the page to update enrollment state across the UI
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to enroll");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[24px] border border-[#F3F4F6] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_14px_30px_-5px_rgba(0,0,0,0.12)] transition-all cursor-pointer group flex flex-col"
    >
      <div className="h-44 w-full relative overflow-hidden">
        <img
          src={
            course.imageUrl ||
            'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=800&auto=format&fit=crop'
          }
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#3B82F6] text-[12px] font-bold rounded-full shadow-sm">
            {course.category || 'General'}
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
            <span className="text-[12px] font-medium">{course.totalJoined || 0} students</span>
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
          {course.description || 'No description available for this course.'}
        </p>

        <div className="mt-auto pt-4 border-t border-[#F3F4F6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={
                course.creator?.avatar ||
                `https://ui-avatars.com/api/?name=${course.creator?.username || 'U'}&background=random`
              }
              className="w-7 h-7 rounded-full object-cover border border-gray-200"
              alt="Creator"
            />
            <span className="text-[13px] font-semibold text-[#4B5563]">
              {course.creator?.username || 'Instructor'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-[15px] font-black text-[#1F2937]">
              {course.price ? `$${course.price}` : 'FREE'}
            </div>
            {!isEnrolled && (
              <button 
                onClick={handleEnrollClick}
                disabled={isJoining}
                className="px-3 py-1.5 bg-[#F97316] text-white text-[12px] font-bold rounded-lg shadow-sm hover:bg-[#EA580C] hover:shadow transition-all disabled:opacity-50"
              >
                {isJoining ? "..." : "Enroll Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const isTeacher = user?.role === 'Teacher';
  const isAdmin = user?.role === 'Admin';
  const isAdminOrTeacher = isTeacher || isAdmin;

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

  // ── Redirect if not authenticated (wait for auth to finish first) ──────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Fetch courses based on role ───────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let res;
      if (isAdminOrTeacher) {
        // GET /Course?userId={id} → courses created by this teacher
        res = await courseApi.getAll(user.id);
      } else {
        // GET /Course → all published courses (learner view)
        res = await courseApi.getAll();
      }
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdminOrTeacher]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCourses();
    }
  }, [isAuthenticated, user, fetchCourses]);

  // ── Enrolled course IDs (for learner badge) ───────────────────────────────
  // Get the enrolled courses from the user's profile
  const enrolledCourseIds = new Set(
    user?.enrollments?.map((e) => e.courseId) || []
  );

  // ── Filter + search ───────────────────────────────────────────────────────
  const filtered = courses.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchFilter =
      filterPublished === 'all' ||
      (filterPublished === 'published' && c.isPublished) ||
      (filterPublished === 'draft' && !c.isPublished);

    return matchSearch && matchFilter;
  });

  // ── Stats for teacher ─────────────────────────────────────────────────────
  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.filter((c) => !c.isPublished).length;
  const totalStudents = courses.reduce((acc, c) => acc + (c.totalJoined || 0), 0);

  // ── Loading / unauthenticated guard ──────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <MainLayout>
      <div className="p-6 lg:p-10 bg-[#F9FAFB] min-h-full">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[28px] font-black text-[#111827]">
                {isAdminOrTeacher ? 'My Teaching Courses' : 'Explore Courses'}
              </h1>
              <p className="text-[#6B7280] text-[15px] mt-1">
                {isAdminOrTeacher
                  ? 'Manage and monitor all courses you created'
                  : 'Discover and join courses to start learning'}
              </p>
            </div>

            {isAdminOrTeacher && (
              <button
                onClick={() => router.push('/courses/create')}
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
                { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
                { label: 'Published', value: publishedCount, icon: Globe, color: 'text-green-600 bg-green-50' },
                { label: 'Draft', value: draftCount, icon: Lock, color: 'text-gray-600 bg-gray-100' },
                { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-orange-600 bg-orange-50' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#F3F4F6] p-4 shadow-sm flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${s.color.split(' ')[1]}`}>
                    <s.icon className={`w-5 h-5 ${s.color.split(' ')[0]}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">{s.label}</p>
                    <p className="text-[22px] font-black text-[#1F2937] leading-none mt-0.5">{s.value}</p>
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
                  <GraduationCap className="w-5 h-5 text-[#3B82F6]" /> Continue Learning
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
                placeholder={isAdminOrTeacher ? 'Search your courses…' : 'Search courses…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
              />
            </div>
            {isAdminOrTeacher && (
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-1 py-1 w-full sm:w-auto">
                {(['all', 'published', 'draft'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterPublished(f)}
                    className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all capitalize ${
                      filterPublished === f
                        ? 'bg-[#3B82F6] text-white shadow-sm'
                        : 'text-[#6B7280] hover:bg-gray-50'
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
              <h2 className="text-[18px] font-black text-[#374151]">All Courses</h2>
              <span className="ml-1 px-2 py-0.5 bg-blue-50 text-[#3B82F6] text-[12px] font-black rounded-full">
                {filtered.length}
              </span>
            </div>
          )}

          {/* ── Grid ─────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-blue-50 p-6 rounded-full mb-4">
                <BookOpen className="w-12 h-12 text-[#3B82F6]" />
              </div>
              <h3 className="text-[20px] font-black text-[#374151]">
                {isAdminOrTeacher ? 'No courses yet' : 'No courses found'}
              </h3>
              <p className="text-[#9CA3AF] mt-2 mb-6 text-center max-w-xs">
                {isAdminOrTeacher
                  ? 'Create your first course and start teaching!'
                  : 'Try a different search or check back later.'}
              </p>
              {isAdminOrTeacher && (
                <button
                  onClick={() => router.push('/courses/create')}
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
                  onEdit={() => router.push(`/courses/${course.id}?tab=content`)}
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
