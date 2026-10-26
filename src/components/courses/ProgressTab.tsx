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
  Target,
  ArrowUpRight,
} from 'lucide-react';
import {
  learningProgressApi,
  LearningProgressSummaryDto,
  TopicProgressDto,
} from '@/services/learningProgressService';
import { CourseResponse, TopicResponse } from '@/services/courseService';
import { toast } from 'sonner';
import {
  learningRecommendationApi,
  LearningRecommendationsResponseDto,
} from '@/services/learningRecommendationService';

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

function progressStatusLabel(status?: string | null) {
  switch (status?.toLowerCase()) {
    case 'completed': return 'Đã hoàn thành';
    case 'in_progress': return 'Đang học';
    case 'not_started': return 'Chưa bắt đầu';
    default: return status || 'Chưa có dữ liệu';
  }
}

function topicTypeLabel(type?: string | null) {
  switch (type?.toLowerCase()) {
    case 'quiz': return 'Bài kiểm tra';
    case 'assignment': return 'Bài tập';
    case 'page': return 'Bài đọc';
    case 'file': return 'Tài liệu';
    case 'link': return 'Liên kết';
    case 'meeting': return 'Buổi học';
    default: return type || 'Nội dung học';
  }
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
    <svg width="140" height="140" viewBox="0 0 180 180" className="rotate-[-90deg]">
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
  const [recommendations, setRecommendations] = useState<LearningRecommendationsResponseDto | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsFailed, setRecommendationsFailed] = useState(false);

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

  const fetchRecommendations = useCallback(async () => {
    setRecommendationsLoading(true);
    try {
      const response = await learningRecommendationApi.getMyRecommendations(course.id, 3);
      setRecommendations(response.data);
      setRecommendationsFailed(false);
    } catch (err) {
      console.error('Failed to fetch learning recommendations:', err);
      setRecommendations(null);
      setRecommendationsFailed(true);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Navigate directly into topic detail when clicked
  const handleNavigateToTopic = (topic: TopicProgressDto) => {
    const matched = courseTopicsMap.get(topic.topicId.toLowerCase());
    const type = topic.topicType || matched?.type;
    const href = getTopicHref(type, topic.topicId, course.id);
    if (!href) return;

    // If topic is not started, mark viewed silently in background so user's view is recorded
    const tracksOnOpen = ['page', 'file', 'link'].includes((type || '').toLowerCase());
    if (topic.status === 'not_started' && !tracksOnOpen) {
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

    if (href && ['page', 'file', 'link'].includes((type || '').toLowerCase())) {
      router.push(href);
      return;
    }

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
      await fetchRecommendations();
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
  const visibleRecommendations = recommendations?.items.filter((item, index, items) =>
    items.findIndex((candidate) =>
      candidate.topicId === item.topicId
      || (candidate.topicType.toLowerCase() === item.topicType.toLowerCase()
        && candidate.title.trim().toLocaleLowerCase() === item.title.trim().toLocaleLowerCase())
    ) === index
  ) ?? [];

  return (
    <div className="w-full py-10 space-y-8">

      {/* ── Hero summary card ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-600 via-[#2563EB] to-indigo-600 rounded-[28px] p-5 sm:p-7 overflow-hidden shadow-lg shadow-blue-500/15">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Ring */}
          <div className="relative shrink-0">
            <CircularProgress percent={pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{Math.round(pct)}%</span>
              <span className="text-xs font-bold text-blue-100 mt-1">Complete</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-white text-2xl font-bold mb-1 leading-tight">
              {course.title}
            </h2>
            <p className="text-blue-100 text-sm mb-5 font-medium">Your learning journey</p>

            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-blue-100 font-medium">Topics completed</span>
                <span className="text-white font-black text-lg">{completed} / {total}</span>
              </div>
              <ProgressBar value={completed} max={total} />
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">Kết quả phân tích học tập</h3>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Hệ thống đã xem tiến độ và kết quả gần đây để gợi ý nội dung phù hợp cho bạn.
                </p>
              </div>
            </div>
            {visibleRecommendations.length ? (
              <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Target className="h-4 w-4 text-indigo-600" />
                <span><strong className="font-semibold text-slate-900">{visibleRecommendations.length}</strong> gợi ý</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-slate-50/70 p-4 sm:p-6">
          {!recommendationsLoading && recommendations?.analysis && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hệ thống đã xem xét</p>
              {recommendations?.analysis ? (
                <>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
                    <span><strong className="font-semibold text-slate-900">{recommendations.analysis.topicsInCourse}</strong> nội dung trong khóa học</span>
                    <span><strong className="font-semibold text-slate-900">{recommendations.analysis.completedTopics}</strong> nội dung bạn đã hoàn thành</span>
                    <span><strong className="font-semibold text-slate-900">{recommendations.analysis.quizAttemptsReviewed}/{recommendations.analysis.quizAttemptsFound}</strong> lần làm bài kiểm tra được dùng</span>
                    <span><strong className="font-semibold text-slate-900">{recommendations.analysis.gradedAssignmentsReviewed}/{recommendations.analysis.assignmentSubmissionsFound}</strong> bài tập đã được chấm</span>
                    <span><strong className="font-semibold text-slate-900">{recommendations.analysis.weakTopicsFound}</strong> nội dung được đề xuất ôn tập</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{recommendations.analysis.method}</p>
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">Chưa có thêm thông tin chi tiết cho các gợi ý lần này.</p>
              )}
            </div>
          )}
          {recommendationsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl border border-white bg-white/80" />
              ))}
            </div>
          ) : visibleRecommendations.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleRecommendations.map((item) => {
                const href = getTopicHref(item.topicType, item.topicId, course.id);
                const hasScore = item.scorePercent != null;
                return (
                  <article
                    key={`${item.topicId}-${item.evidenceLabel}`}
                    className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{item.title}</h4>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{topicTypeLabel(item.topicType)}</span>
                          {item.priority === 'high' && (
                            <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Cần ôn tập</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.reason}</p>
                        {hasScore && (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold">
                              <span className="text-slate-600">Điểm tổng hợp gần đây</span>
                              <span className="text-rose-600">{Math.round(Number(item.scorePercent))}%</span>
                            </div>
                            <div className="relative h-2 overflow-visible rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${Number(item.scorePercent) < Number(item.passThresholdPercent ?? 60) ? 'bg-rose-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.max(2, Math.min(100, Number(item.scorePercent)))}%` }}
                              />
                              {item.passThresholdPercent != null && (
                                <span
                                  className="absolute -top-0.5 h-3 w-0.5 bg-slate-700"
                                  style={{ left: `${Math.min(100, Number(item.passThresholdPercent))}%` }}
                                  title={`Ngưỡng đạt ${item.passThresholdPercent}%`}
                                />
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                              {item.attemptCount != null && <span>{item.attemptCount} lần làm được dùng</span>}
                              {item.passThresholdPercent != null && <span>Mốc cần đạt: {item.passThresholdPercent}%</span>}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2.5">
                          <p className="text-xs font-semibold text-slate-700">Vì sao nội dung này được gợi ý</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.analysisBasis || item.evidenceLabel}</p>
                          {item.sectionTitle && <p className="mt-1 text-[11px] text-slate-500">Phần: {item.sectionTitle}</p>}
                          {item.lastAccessedAtUtc && <p className="mt-1 text-[11px] text-slate-500">Truy cập gần nhất: {fmt(item.lastAccessedAtUtc)}</p>}
                          {item.recentResults && item.recentResults.length > 0 && (
                            <div className="mt-2 border-t border-slate-100 pt-2">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Các lần làm được dùng</p>
                              <div className="space-y-1">
                                {item.recentResults.map((result, resultIndex) => (
                                  <div key={`${item.topicId}-result-${resultIndex}`} className="flex items-center justify-between gap-3 text-[11px] text-slate-600">
                                    <span>{result.recordedAtUtc ? fmt(result.recordedAtUtc) : `Lần ${resultIndex + 1}`}</span>
                                    <span className="font-medium text-slate-800">{result.scorePercent}%{result.earnedMark != null && result.maximumMark != null ? ` · ${result.earnedMark}/${result.maximumMark} điểm` : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {!item.recentResults?.length && item.observedProgressStatus && (
                            <p className="mt-1 text-[11px] text-slate-500">Tiến độ hiện tại: {progressStatusLabel(item.observedProgressStatus)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="truncate text-[11px] text-slate-500">{item.scorePercent != null ? 'Đề xuất theo kết quả' : 'Đề xuất theo tiến độ'}</span>
                      {href ? (
                        <button
                          type="button"
                          onClick={() => router.push(href)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        >
                          {item.actionLabel}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Chưa có liên kết</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${recommendationsFailed ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {recommendationsFailed ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                {recommendations?.summary ?? 'Chưa tải được gợi ý lúc này. Hãy thử làm mới trang.'}
              </p>
            </div>
          )}
        </div>
      </section>

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
            onClick={() => {
              fetchData();
              fetchRecommendations();
            }}
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
