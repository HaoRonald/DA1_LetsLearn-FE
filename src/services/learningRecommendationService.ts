import axiosInstance from '@/lib/axios';

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
  recentResults?: Array<{
    recordedAtUtc?: string | null;
    scorePercent: number;
    earnedMark?: number | null;
    maximumMark?: number | null;
  }>;
  priority: 'high' | 'normal' | string;
  actionLabel: string;
}

export interface LearningRecommendationsResponseDto {
  courseId: string;
  generatedAtUtc: string;
  summary: string;
  analysis: {
    topicsInCourse: number;
    completedTopics: number;
    quizAttemptsFound: number;
    quizAttemptsReviewed: number;
    assignmentSubmissionsFound: number;
    gradedAssignmentsReviewed: number;
    weakTopicsFound: number;
    method: string;
  };
  items: LearningRecommendationDto[];
}

export const learningRecommendationApi = {
  getMyRecommendations: (courseId: string, limit = 3) =>
    axiosInstance.get<LearningRecommendationsResponseDto>(
      `/courses/${courseId}/recommendations/me`,
      { params: { limit } },
    ),
};
