import axiosInstance from '@/lib/axios';

export interface LearningScoreEvidenceDto {
  recordedAtUtc?: string | null;
  scorePercent: number;
  earnedMark?: number | null;
  maximumMark?: number | null;
}

export interface SectionHealthDto {
  sectionId: string;
  sectionTitle: string;
  position: number;
  totalTopics: number;
  completedTopics: number;
  completionPercent: number;
  avgQuizScore?: number | null;
  avgAssignmentScore?: number | null;
  /** Điểm sức khỏe 0–100 */
  healthScore: number;
  /** "healthy" | "at_risk" | "critical" | "not_started" */
  healthStatus: 'healthy' | 'at_risk' | 'critical' | 'not_started';
}

export interface LearningRecommendationDto {
  topicId: string;
  title: string;
  topicType: string;
  reason: string;
  evidenceLabel: string;
  scorePercent?: number | null;
  passThresholdPercent?: number | null;
  attemptCount?: number | null;
  analysisBasis?: string;
  sectionTitle?: string | null;
  observedProgressStatus?: string | null;
  lastAccessedAtUtc?: string | null;
  recentResults?: LearningScoreEvidenceDto[];
  priority: 'high' | 'normal' | string;
  actionLabel: string;

  // ── Trend Analysis ──────────────────────────────────────────────────────
  /** "improving" | "declining" | "stable" | null */
  trend?: 'improving' | 'declining' | 'stable' | null;
  /** Thay đổi điểm từ lần đầu đến lần cuối (%) */
  trendDelta?: number | null;

  // ── Time Decay ──────────────────────────────────────────────────────────
  daysSinceLastAccess?: number | null;
  /** Hệ số suy giảm 0.0–1.0 */
  decayFactor?: number | null;
  /** Điểm sau khi hiệu chỉnh decay (dùng để ranking) */
  decayAdjustedScore?: number | null;

  // ── Stuck Detection ─────────────────────────────────────────────────────
  isStuck?: boolean;
}

export interface LearningAnalysisEvidenceDto {
  topicsInCourse: number;
  completedTopics: number;
  quizAttemptsFound: number;
  quizAttemptsReviewed: number;
  assignmentSubmissionsFound: number;
  gradedAssignmentsReviewed: number;
  weakTopicsFound: number;
  method: string;

  // ── Nâng cấp ────────────────────────────────────────────────────────────
  /** Điểm sức khỏe học tập tổng thể 0–100 */
  overallHealthScore: number;
  /** Số topic đang bị stuck */
  stuckTopicsCount: number;
  /** Số ngày không hoạt động (-1 nếu chưa bắt đầu) */
  inactiveDays: number;
  /** Các điểm nhấn về tình trạng học tập */
  keyInsights: string[];
  /** Sức khỏe từng section */
  sectionHealthItems: SectionHealthDto[];
}

export interface LearningRecommendationsResponseDto {
  courseId: string;
  generatedAtUtc: string;
  summary: string;
  analysis: LearningAnalysisEvidenceDto;
  items: LearningRecommendationDto[];
}

export const learningRecommendationApi = {
  getMyRecommendations: (courseId: string, limit = 3) =>
    axiosInstance.get<LearningRecommendationsResponseDto>(
      `/courses/${courseId}/recommendations/me`,
      { params: { limit } },
    ),
};
