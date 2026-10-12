'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users,
  ChevronRight,
  X,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  BarChart3,
  Loader2,
  DatabaseZap,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  learningProgressApi,
  CourseStudentProgressDto,
  TopicProgressDto,
} from '@/services/learningProgressService';
import { CourseResponse } from '@/services/courseService';
import { toast } from 'sonner';

interface StudentProgressTabProps {
  course: CourseResponse;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Circular progress ring for Class Average ─────────────────────────────────
function CircularProgress({ percent }: { percent: number }) {
  const radius = 68;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 100 ? '#4ADE80' : '#FFFFFF';

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="14"
      />
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

// ── Thin linear progress bar ─────────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
      <div
        className="h-2.5 rounded-full bg-white transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ── Mini progress bar in student row ─────────────────────────────────────────
function MiniBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'from-[#22C55E] to-[#16A34A]'
    : pct >= 50 ? 'from-[#3B82F6] to-[#2563EB]'
    : pct >= 20 ? 'from-[#F97316] to-[#EA580C]'
    : 'from-[#E5E7EB] to-[#D1D5DB]';

  return (
    <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

const TOPIC_TYPE_ICON: Record<string, string> = {
  quiz: '📝',
  assignment: '📋',
  meeting: '🎥',
  page: '📄',
  file: '📎',
  link: '🔗',
};

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
    in_progress: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    not_started: 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        styles[status] ?? styles.not_started
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Topic drill-down modal ──────────────────────────────────────────────────
function TopicDetailModal({
  courseId,
  student,
  onClose,
}: {
  courseId: string;
  student: CourseStudentProgressDto;
  onClose: () => void;
}) {
  const [topics, setTopics] = useState<TopicProgressDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learningProgressApi
      .getStudentTopicProgresses(courseId, student.studentId)
      .then((r) => setTopics(r.data))
      .catch(() => toast.error('Failed to load topic details'))
      .finally(() => setLoading(false));
  }, [courseId, student.studentId]);

  const completed = topics.filter((t) => t.status === 'completed').length;
  const inProgress = topics.filter((t) => t.status === 'in_progress').length;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-4">
            <img
              src={
                student.studentAvatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(student.studentName ?? 'S')}&background=3B82F6&color=fff`
              }
              alt={student.studentName ?? ''}
              className="w-13 h-13 rounded-2xl object-cover border-2 border-[#3B82F6]/20 shadow-sm"
            />
            <div>
              <h3 className="font-black text-[#1F2937] text-[18px]">
                {student.studentName ?? 'Learner'}
              </h3>
              <p className="text-[13px] text-gray-400 font-medium">{student.studentEmail}</p>
            </div>
          </div>
          <button
            id="btn-close-topic-modal"
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-2 px-8 py-3.5 bg-[#F9FAFB] border-b border-[#F3F4F6] text-center">
          <div>
            <div className="text-lg font-black text-[#1F2937]">
              {Math.round(Number(student.progressPercent))}%
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Overall</div>
          </div>
          <div className="border-l border-[#E5E7EB]">
            <div className="text-lg font-black text-[#22C55E]">{completed}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Done</div>
          </div>
          <div className="border-l border-[#E5E7EB]">
            <div className="text-lg font-black text-[#3B82F6]">{inProgress}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">In Progress</div>
          </div>
          <div className="border-l border-[#E5E7EB]">
            <div className="text-lg font-black text-[#1F2937]">{topics.length}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Topics</div>
          </div>
        </div>

        {/* Topic list in 2-column grid */}
        <div className="flex-1 overflow-y-auto px-8 py-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-[18px] animate-pulse" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-base text-gray-400">No topic activity recorded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {topics.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-start gap-3.5 p-3.5 rounded-[18px] border transition-all ${
                    t.status === 'completed'
                      ? 'border-[#BBF7D0] bg-gradient-to-r from-white to-[#F0FDF4]/70 shadow-xs'
                      : t.status === 'in_progress'
                      ? 'border-[#BFDBFE] bg-gradient-to-r from-white to-[#EFF6FF]/50'
                      : 'border-[#F3F4F6] bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shrink-0 mt-0.5">
                    {TOPIC_TYPE_ICON[t.topicType ?? ''] ?? '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 justify-between mb-1">
                      <span className="font-bold text-[14px] text-[#1F2937] truncate" title={t.topicTitle ?? t.topicId}>
                        {t.topicTitle ?? t.topicId}
                      </span>
                      <StatusPill status={t.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-400">
                      {t.firstAccessedAt && <span>Viewed: {fmt(t.firstAccessedAt)}</span>}
                      {t.completedAt && (
                        <span className="text-[#16A34A] font-semibold">Done: {fmt(t.completedAt)}</span>
                      )}
                      {t.completionSource === 'submit_quiz' && (
                        <span className="text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full text-[10px]">
                          📝 Quiz Submit
                        </span>
                      )}
                      {t.completionSource === 'submit_assignment' && (
                        <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full text-[10px]">
                          📋 Assignment
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function StudentProgressTab({ course }: StudentProgressTabProps) {
  const [students, setStudents] = useState<CourseStudentProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [selected, setSelected] = useState<CourseStudentProgressDto | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await learningProgressApi.getCourseStudentProgresses(course.id);
      setStudents(res.data);
    } catch (err: any) {
      console.error('Failed to fetch students progress:', err);
      const msg =
        err?.response?.status === 403
          ? 'Only course creators, teachers or admins can view student progress.'
          : 'Could not load student progress data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await learningProgressApi.syncCourseProgress(course.id);
      const { studentCount, recalculatedProgressCount } = res.data;
      toast.success(
        `Synced progress for ${studentCount} students (${recalculatedProgressCount} updated)`
      );
      await fetchStudents();
    } catch (err: any) {
      console.error('Failed to sync progress:', err);
      toast.error('Sync failed: ' + (err?.response?.data?.message || err?.message));
    } finally {
      setSyncing(false);
    }
  };

  // ── Summary numbers ────────────────────────────────────────────────────────
  const totalStudents = students.length;
  const completedAll = students.filter((s) => Number(s.progressPercent) >= 100).length;
  const inProgressStudents = students.filter(
    (s) => Number(s.progressPercent) > 0 && Number(s.progressPercent) < 100
  ).length;
  const notStartedStudents = students.filter((s) => Number(s.progressPercent) === 0).length;

  const avgPct =
    totalStudents === 0
      ? 0
      : Math.round(
          students.reduce((acc, s) => acc + Number(s.progressPercent), 0) / totalStudents
        );

  // ── Filtered students ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return students.filter((s) => {
      // Filter by status tab
      const pct = Number(s.progressPercent);
      if (filter === 'completed' && pct < 100) return false;
      if (filter === 'in_progress' && (pct === 0 || pct >= 100)) return false;
      if (filter === 'not_started' && pct > 0) return false;

      // Filter by search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (s.studentName ?? '').toLowerCase().includes(q) ||
        (s.studentEmail ?? '').toLowerCase().includes(q)
      );
    });
  }, [students, search, filter]);

  // ── Error state ────────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <p className="font-black text-2xl text-[#1F2937]">{error}</p>
          <p className="text-base text-gray-400 mt-1">Please verify your role permissions for this course.</p>
        </div>
        <button
          onClick={fetchStudents}
          className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-md transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full py-10 space-y-8">

      {/* ── Hero summary card ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-600 via-[#2563EB] to-indigo-600 rounded-[36px] p-10 overflow-hidden shadow-xl shadow-blue-500/20 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-10">
          {/* Ring */}
          <div className="relative shrink-0">
            <CircularProgress percent={avgPct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{avgPct}%</span>
              <span className="text-[13px] font-bold text-blue-100 mt-1">Class Avg</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-[12px] font-bold backdrop-blur-sm">
                <BarChart3 className="w-3.5 h-3.5 text-blue-200" />
                Teacher & Admin Overview
              </div>

              {/* Action buttons embedded in Hero */}
              <div className="flex items-center gap-2.5">
                <button
                  id="btn-sync-progress"
                  onClick={handleSync}
                  disabled={syncing || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl font-bold text-[13px] transition-all backdrop-blur-sm disabled:opacity-60"
                  title="Backfill learning progress from existing quiz & assignment submissions"
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <DatabaseZap className="w-4 h-4 text-cyan-200" />
                  )}
                  Sync Progress
                </button>
                <button
                  id="btn-refresh-progress"
                  onClick={fetchStudents}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl font-bold text-[13px] transition-all backdrop-blur-sm disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <h2 className="text-white text-3xl font-black mb-1 leading-tight">
              {course.title}
            </h2>
            <p className="text-blue-100 text-base mb-7 font-medium">
              Student Progress Report • {totalStudents} enrolled learner{totalStudents === 1 ? '' : 's'}
            </p>

            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-blue-100 font-medium">Class completion rate</span>
                <span className="text-white font-black text-lg">
                  {completedAll} of {totalStudents} learners completed
                </span>
              </div>
              <ProgressBar value={completedAll} max={totalStudents} />
            </div>

            <div className="flex flex-wrap gap-4 mt-7">
              <div className="flex items-center gap-2 text-[13px] text-blue-100 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-sm">
                <Users className="w-4 h-4 text-blue-200" />
                {totalStudents} Learners Enrolled
              </div>
              <div className="flex items-center gap-2 text-[13px] text-emerald-200 bg-emerald-500/20 px-3.5 py-1.5 rounded-xl border border-emerald-400/20 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {completedAll} Fully Completed
              </div>
              <div className="flex items-center gap-2 text-[13px] text-amber-200 bg-amber-500/20 px-3.5 py-1.5 rounded-xl border border-amber-400/20 backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 text-amber-300" />
                {inProgressStudents} In Progress
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat chips ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">
        {[
          {
            label: 'Enrolled Learners',
            value: totalStudents,
            icon: Users,
            color: 'text-[#3B82F6]',
            bg: 'bg-[#EFF6FF]',
          },
          {
            label: 'Fully Completed',
            value: completedAll,
            icon: CheckCircle2,
            color: 'text-[#22C55E]',
            bg: 'bg-[#F0FDF4]',
          },
          {
            label: 'Average Progress',
            value: `${avgPct}%`,
            icon: BarChart3,
            color: 'text-[#8B5CF6]',
            bg: 'bg-[#F5F3FF]',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white border border-[#F3F4F6] rounded-[24px] p-7 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className={`p-3.5 rounded-2xl ${bg}`}>
              <Icon className={`w-7 h-7 ${color}`} />
            </div>
            <span className="text-4xl font-black text-[#1F2937]">{value}</span>
            <span className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Row ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="input-student-search"
            type="text"
            placeholder="Search learner by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#F3F4F6] rounded-[20px] text-[14px] font-medium text-[#1F2937] placeholder-gray-400 outline-none shadow-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 transition-all"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All', count: totalStudents },
            { id: 'completed', label: 'Completed', count: completedAll },
            { id: 'in_progress', label: 'In Progress', count: inProgressStudents },
            { id: 'not_started', label: 'Not Started', count: notStartedStudents },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setFilter(id as any)}
              className={`px-4 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${
                filter === id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-[#F3F4F6] text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* ── Student list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-[22px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[28px] border-2 border-dashed border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-lg">
            {search ? `No learners found for "${search}"` : 'No learner progress data recorded yet'}
          </p>
          {!search && (
            <p className="text-sm text-gray-400 mt-1">
              Click <strong>Sync Progress</strong> to backfill from existing quiz & assignment submissions.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((student) => {
            const pct = Math.round(Number(student.progressPercent));
            const is100 = pct >= 100;
            const pctColor =
              pct >= 80
                ? 'text-[#16A34A]'
                : pct >= 50
                ? 'text-[#2563EB]'
                : pct >= 20
                ? 'text-[#EA580C]'
                : 'text-[#9CA3AF]';

            return (
              <button
                key={student.studentId}
                id={`btn-student-${student.studentId}`}
                onClick={() => setSelected(student)}
                className={`w-full text-left flex items-center gap-5 p-5 bg-white border rounded-[22px] transition-all hover:shadow-md hover:border-blue-200 group ${
                  is100
                    ? 'border-[#BBF7D0] bg-gradient-to-r from-white to-[#F0FDF4]/60'
                    : 'border-[#F3F4F6]'
                }`}
              >
                {/* Avatar */}
                <img
                  src={
                    student.studentAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(student.studentName ?? 'S')}&background=3B82F6&color=fff`
                  }
                  alt={student.studentName ?? ''}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-100 group-hover:scale-105 transition-transform shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-[16px] text-[#1F2937] group-hover:text-[#3B82F6] transition-colors truncate">
                      {student.studentName ?? 'Unknown'}
                    </span>
                    {is100 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    ) : pct > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB]">
                        Not Started
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-gray-400 font-medium truncate mb-2">
                    {student.studentEmail}
                  </div>
                  <MiniBar pct={pct} />
                </div>

                {/* Right side stats */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-2xl font-black ${pctColor}`}>{pct}%</span>
                  <div className="flex items-center gap-1 text-[12px] font-bold text-gray-400">
                    <span>{student.completedTopicCount} / {student.totalTopicCount}</span>
                    <span>topics</span>
                  </div>
                  {student.lastActivityAt && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Active {fmt(student.lastActivityAt)}</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Topic detail modal ───────────────────────────────────────────────── */}
      {selected && (
        <TopicDetailModal
          courseId={course.id}
          student={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
