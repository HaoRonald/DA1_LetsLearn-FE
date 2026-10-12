import axiosInstance from '@/lib/axios';

// ── DTOs mirrored from BE ────────────────────────────────────────────────────

export interface LearningProgressSummaryDto {
  id: string;
  studentId: string;
  courseId: string;
  completedTopicCount: number;
  totalTopicCount: number;
  progressPercent: number;
  startedAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
  updatedAt: string;
}

export interface CourseStudentProgressDto extends LearningProgressSummaryDto {
  studentName?: string;
  studentEmail?: string;
  studentAvatar?: string;
  joinedAt?: string;
}

export interface TopicProgressDto {
  id: string;
  studentId: string;
  courseId: string;
  topicId: string;
  topicTitle?: string;
  topicType?: string;
  /** "not_started" | "in_progress" | "completed" */
  status: string;
  firstAccessedAt?: string;
  lastAccessedAt?: string;
  completedAt?: string;
  completionSource?: string;
  updatedAt: string;
}

export interface LearningProgressSyncResultDto {
  courseId: string;
  studentCount: number;
  createdTopicProgressCount: number;
  updatedTopicProgressCount: number;
  recalculatedProgressCount: number;
  syncedAt: string;
}

// ── API calls ────────────────────────────────────────────────────────────────

export const learningProgressApi = {
  /** GET courses/{courseId}/progress/me */
  getMyProgress: (courseId: string) =>
    axiosInstance.get<LearningProgressSummaryDto>(`/courses/${courseId}/progress/me`),

  /** GET courses/{courseId}/progress/me/topics */
  getMyTopicProgresses: (courseId: string) =>
    axiosInstance.get<TopicProgressDto[]>(`/courses/${courseId}/progress/me/topics`),

  /** POST topics/{topicId}/progress/view */
  markTopicViewed: (topicId: string) =>
    axiosInstance.post<TopicProgressDto>(`/topics/${topicId}/progress/view`),

  /** POST topics/{topicId}/progress/complete */
  markTopicCompleted: (topicId: string, completionSource = 'manual') =>
    axiosInstance.post<TopicProgressDto>(`/topics/${topicId}/progress/complete`, {
      completionSource,
    }),

  /** GET courses/{courseId}/progress/students  (Admin / Teacher) */
  getCourseStudentProgresses: (courseId: string) =>
    axiosInstance.get<CourseStudentProgressDto[]>(`/courses/${courseId}/progress/students`),

  /** GET courses/{courseId}/progress/students/{studentId}/topics  (Admin / Teacher) */
  getStudentTopicProgresses: (courseId: string, studentId: string) =>
    axiosInstance.get<TopicProgressDto[]>(
      `/courses/${courseId}/progress/students/${studentId}/topics`
    ),

  /** POST courses/{courseId}/progress/sync  (Admin / Teacher) */
  syncCourseProgress: (courseId: string) =>
    axiosInstance.post<LearningProgressSyncResultDto>(`/courses/${courseId}/progress/sync`),
};
