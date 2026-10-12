'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Eye,
  Loader2,
  Trophy,
  TrendingUp,
  Clock,
  Zap,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  learningProgressApi,
  LearningProgressSummaryDto,
  TopicProgressDto,
} from '@/services/learningProgressService';
import { CourseResponse, TopicResponse } from '@/services/courseService';
import { toast } from 'sonner';

interface ProgressTabProps {
  course: CourseResponse;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Determines navigation route for a topic */
function getTopicHref(topicType?: string, topicId?: string, courseId?: string): string | null {
  if (!topicId) return null;
  const type = (topicType || '').toLowerCase();
  const cParam = courseId ? `?courseId=${courseId}` : '';
  if (type === 'assignment') return `/assignments/${topicId}${cParam}`;
  if (type === 'quiz') return `/quizzes/${topicId}${cParam}`;
  if (type === 'page') return `/pages/${topicId}${cParam}`;
  if (type === 'file') return `/files/${topicId}${cParam}`;
  if (type === 'link') return `/links/${topicId}${cParam}`;
  if (type === 'meeting') return `/meetings/${topicId}${cParam}`;
  return null;
}

interface TopicSchedule {
  openDate: Date | null;
  closeDate: Date | null;
}

function parseTopicSchedule(data: any): TopicSchedule {
  if (!data) return { openDate: null, closeDate: null };
  let parsed = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      return { openDate: null, closeDate: null };
    }
  }
  const openVal = parsed.open ?? parsed.Open ?? null;
  const closeVal = parsed.close ?? parsed.Close ?? parsed.dueDate ?? parsed.DueDate ?? null;

  const openDate = openVal ? new Date(openVal) : null;
  const closeDate = closeVal ? new Date(closeVal) : null;

  return {
    openDate: openDate && !isNaN(openDate.getTime()) ? openDate : null,
    closeDate: closeDate && !isNaN(closeDate.getTime()) ? closeDate : null,
  };
}

// ── Deadline & schedule badge ────────────────────────────────────────────────
function DeadlineBadge({
  schedule,
  isCompleted,
}: {
  schedule: TopicSchedule;
  isCompleted: boolean;
}) {
  const { openDate, closeDate } = schedule;
  if (!openDate && !closeDate) return null;

  const now = new Date();

  // If topic has not opened yet
  if (openDate && openDate > now && !isCompleted) {
    return (
      <span
        title={`Opens on ${formatDateTime(openDate)}`}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
      >
        <Calendar className="w-3 h-3 text-purple-500" />
        Opens {formatDateTime(openDate)}
      </span>
    );
  }

  // If topic has a deadline
  if (closeDate) {
    const isOverdue = closeDate < now;
    const diffHours = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isUrgent = !isOverdue && diffHours <= 24;

    if (isCompleted) {
      return (
        <span
          title={`Deadline was ${formatDateTime(closeDate)}`}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200"
        >
          <Clock className="w-3 h-3 text-gray-400" />
          Due: {formatDateTime(closeDate)}
        </span>
      );
    }

    if (isOverdue) {
      return (
        <span
          title={`Expired on ${formatDateTime(closeDate)}`}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200"
        >
          <AlertTriangle className="w-3 h-3 text-red-500" />
          Overdue: {formatDateTime(closeDate)}
        </span>
      );
    }

    if (isUrgent) {
      const hoursLeft = Math.max(1, Math.ceil(diffHours));
      return (
        <span
          title={`Deadline: ${formatDateTime(closeDate)}`}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300"
        >
          <Clock className="w-3 h-3 text-amber-600" />
          Due in {hoursLeft}h ({formatDateTime(closeDate)})
        </span>
      );
    }

    return (
      <span
        title={`Deadline: ${formatDateTime(closeDate)}`}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200"
      >
        <Clock className="w-3 h-3 text-slate-400" />
        Due: {formatDateTime(closeDate)}
      </span>
    );
  }

  return null;
}

// ── Circular progress ring ──────────────────────────────────────────────────
function CircularProgress({ percent }: { percent: number }) {
  const radius = 68;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;

  // On the project brand blue gradient card, use crisp white or emerald when completed
  const color = percent >= 100 ? '#4ADE80' : '#FFFFFF';

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="14"
      />
      {/* Fill */}
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
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
    in_progress: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    not_started: 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
        styles[status] ?? styles.not_started
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source?: string }) {
  // Only show badges for auto-completion sources — hide manual, view_topic, unknown
  const map: Record<string, { label: string; cls: string }> = {
    submit_quiz: { label: '📝 Quiz Submit', cls: 'bg-pink-50 text-pink-600' },
    submit_assignment: { label: '📋 Assignment', cls: 'bg-purple-50 text-purple-600' },
  };
  if (!source || !(source in map)) return null;
  const info = map[source];
  return (
    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${info.cls}`}>
      {info.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ProgressTab({ course }: ProgressTabProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<LearningProgressSummaryDto | null>(null);
  const [topics, setTopics] = useState<TopicProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Fast map to find topic metadata (type, open/close schedule)
  const courseTopicsMap = useMemo(() => {
    const map = new Map<string, TopicResponse>();
    if (course.sections) {
      for (const sec of course.sections) {
        if (sec.topics) {
          for (const t of sec.topics) {
            if (t?.id) {
              map.set(t.id.toLowerCase(), t);
            }
          }
        }
      }
    }
    return map;
  }, [course.sections]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, topicsRes] = await Promise.all([
        learningProgressApi.getMyProgress(course.id),
        learningProgressApi.getMyTopicProgresses(course.id),
      ]);
      setSummary(summaryRes.data);
      setTopics(topicsRes.data);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      toast.error('Could not load progress data');
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate directly into topic detail when clicked
  const handleNavigateToTopic = (topic: TopicProgressDto) => {
    const matched = courseTopicsMap.get(topic.topicId.toLowerCase());
    const type = topic.topicType || matched?.type;
    const href = getTopicHref(type, topic.topicId, course.id);
    if (!href) return;

    // If topic is not started, mark viewed silently in background so user's view is recorded
    if (topic.status === 'not_started') {
      learningProgressApi.markTopicViewed(topic.topicId).catch(() => {});
    }
    router.push(href);
  };

  // Click View: marks as viewed and immediately navigates to task
  const handleViewAndNavigate = async (e: React.MouseEvent, topic: TopicProgressDto) => {
    e.stopPropagation();
    if (markingId) return;

    const matched = courseTopicsMap.get(topic.topicId.toLowerCase());
    const type = topic.topicType || matched?.type;
    const href = getTopicHref(type, topic.topicId, course.id);

    setMarkingId(topic.topicId);
    try {
      const res = await learningProgressApi.markTopicViewed(topic.topicId);
      setTopics((prev) =>
        prev.map((t) => (t.topicId === topic.topicId ? res.data : t))
      );
      toast.success('Topic marked as viewed');
      const s = await learningProgressApi.getMyProgress(course.id);
      setSummary(s.data);
    } catch {
      toast.error('Failed to mark topic as viewed');
    } finally {
      setMarkingId(null);
      if (href) {
        router.push(href);
      }
    }
  };

  // Click Done: manually marks topic completed
  const handleMarkCompleted = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    if (markingId) return;
    setMarkingId(topicId);
    try {
      const res = await learningProgressApi.markTopicCompleted(topicId, 'manual');
      setTopics((prev) =>
        prev.map((t) => (t.topicId === topicId ? res.data : t))
      );
      toast.success('Topic marked as completed!');
      const s = await learningProgressApi.getMyProgress(course.id);
      setSummary(s.data);
    } catch {
      toast.error('Failed to mark topic as completed');
    } finally {
      setMarkingId(null);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full py-10 space-y-6">
        <div className="h-64 bg-gray-100 rounded-[32px] animate-pulse" />
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-[24px] animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-[20px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const pct = summary ? Number(summary.progressPercent) : 0;
  const completed = summary?.completedTopicCount ?? 0;
  const total = summary?.totalTopicCount ?? 0;

  return (
    <div className="w-full py-10 space-y-8">

      {/* ── Hero summary card ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-600 via-[#2563EB] to-indigo-600 rounded-[36px] p-10 overflow-hidden shadow-xl shadow-blue-500/20">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-10">
          {/* Ring */}
          <div className="relative shrink-0">
            <CircularProgress percent={pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{Math.round(pct)}%</span>
              <span className="text-[13px] font-bold text-blue-100 mt-1">Complete</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-white text-3xl font-black mb-1 leading-tight">
              {course.title}
            </h2>
            <p className="text-blue-100 text-base mb-7 font-medium">Your learning journey</p>

            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-blue-100 font-medium">Topics completed</span>
                <span className="text-white font-black text-lg">{completed} / {total}</span>
              </div>
              <ProgressBar value={completed} max={total} />
            </div>

            <div className="flex flex-wrap gap-4 mt-7">
              {summary?.startedAt && (
                <div className="flex items-center gap-2 text-[13px] text-blue-100 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-blue-200" />
                  Started {fmt(summary.startedAt)}
                </div>
              )}
              {summary?.lastActivityAt && (
                <div className="flex items-center gap-2 text-[13px] text-blue-100 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-sm">
                  <Zap className="w-4 h-4 text-blue-200" />
                  Last active {fmt(summary.lastActivityAt)}
                </div>
              )}
              {summary?.completedAt && (
                <div className="flex items-center gap-2 text-[13px] text-emerald-200 bg-emerald-500/20 px-3.5 py-1.5 rounded-xl border border-emerald-400/20 backdrop-blur-sm">
                  <Trophy className="w-4 h-4 text-emerald-300" />
                  Completed {fmt(summary.completedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat chips ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">
        {[
          {
            label: 'Completed',
            value: completed,
            icon: CheckCircle2,
            color: 'text-[#22C55E]',
            bg: 'bg-[#F0FDF4]',
          },
          {
            label: 'Remaining',
            value: total - completed,
            icon: Circle,
            color: 'text-[#9CA3AF]',
            bg: 'bg-[#F9FAFB]',
          },
          {
            label: 'Total Topics',
            value: total,
            icon: BookOpen,
            color: 'text-[#3B82F6]',
            bg: 'bg-[#EFF6FF]',
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

      {/* ── Topic list ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[20px] font-black text-[#1F2937] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
            Topic Progress
          </h3>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-[13px] font-bold text-gray-400 hover:text-[#3B82F6] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[28px] border-2 border-dashed border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No topics tracked yet.</p>
            <p className="text-gray-300 mt-1">Open a topic to start tracking progress.</p>
          </div>
        ) : (
          topics.map((topic) => {
            const isCompleted = topic.status === 'completed';
            const isInProgress = topic.status === 'in_progress';
            const isMarking = markingId === topic.topicId;

            const matched = courseTopicsMap.get(topic.topicId.toLowerCase());
            const topicType = topic.topicType || matched?.type;
            const schedule = parseTopicSchedule(matched?.data);
            const href = getTopicHref(topicType, topic.topicId, course.id);
            const isClickable = !!href;

            return (
              <div
                key={topic.id}
                onClick={() => isClickable && handleNavigateToTopic(topic)}
                className={`group flex items-center gap-5 p-5 bg-white border rounded-[22px] transition-all ${
                  isClickable ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''
                } ${
                  isCompleted
                    ? 'border-[#BBF7D0] bg-gradient-to-r from-white to-[#F0FDF4]/60'
                    : 'border-[#F3F4F6]'
                }`}
              >
                {/* Type icon */}
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shrink-0 border border-[#F3F4F6] group-hover:scale-105 transition-transform">
                  {TOPIC_TYPE_ICON[topicType ?? ''] ?? '📌'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[16px] text-[#1F2937] group-hover:text-[#3B82F6] transition-colors truncate">
                      {topic.topicTitle ?? matched?.title ?? topic.topicId}
                    </span>
                    <StatusPill status={topic.status} />
                    {topic.completionSource && topic.completionSource !== 'manual' && (
                      <SourceBadge source={topic.completionSource} />
                    )}
                    <DeadlineBadge schedule={schedule} isCompleted={isCompleted} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[13px] text-gray-400">
                    {topic.firstAccessedAt && (
                      <span>First viewed: {fmt(topic.firstAccessedAt)}</span>
                    )}
                    {topic.completedAt && (
                      <span className="text-[#16A34A] font-medium">Done: {fmt(topic.completedAt)}</span>
                    )}
                    {isClickable && (
                      <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium hidden sm:inline-flex items-center gap-1">
                        Click to open <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isCompleted && (
                  <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isInProgress && (
                      <button
                        id={`btn-view-${topic.topicId}`}
                        onClick={(e) => handleViewAndNavigate(e, topic)}
                        disabled={isMarking}
                        title="Mark as viewed & open"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white transition-all text-[13px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isMarking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        View
                      </button>
                    )}
                    <button
                      id={`btn-complete-${topic.topicId}`}
                      onClick={(e) => handleMarkCompleted(e, topic.topicId)}
                      disabled={isMarking}
                      title="Mark as completed"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 text-[#16A34A] hover:bg-[#16A34A] hover:text-white transition-all text-[13px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMarking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Done
                    </button>
                  </div>
                )}

                {isCompleted && (
                  <CheckCircle2 className="w-7 h-7 text-[#22C55E] shrink-0" />
                )}

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
