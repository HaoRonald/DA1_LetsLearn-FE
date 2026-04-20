import axiosInstance from '@/lib/axios';

// ── Basic types ──────────────────────────────────────────────────────────────
export interface UserBasicInfo {
  id: string; // Guid from BE serialized as string
  username: string;
  avatar?: string;
}

export interface TopicResponse {
  id: string;         // Guid
  title: string;
  type: 'quiz' | 'assignment' | 'meeting' | 'page' | 'file' | 'link';
  data?: any;
  sectionId: string;  // Guid
}

export interface SectionResponse {
  id: string;         // Guid
  courseId: string;
  position: number;
  title: string;
  description?: string;
  topics: TopicResponse[];
}

// Matches BE GetCourseResponse DTO exactly
export interface CourseResponse {
  id: string;
  creatorId: string;   // Guid as string
  title: string;
  description: string;
  totalJoined: number;
  imageUrl?: string;
  price?: number;
  category?: string;
  level?: string;
  isPublished: boolean;
  sections?: SectionResponse[];
  creator?: UserBasicInfo;
  students?: UserBasicInfo[];
}

// Matches BE CreateCourseRequest / UpdateCourseRequest
export interface CoursePayload {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  level?: string;
  price?: number;
  isPublished?: boolean;
}

export const courseApi = {
  /**
   * GET /Course
   * - No userId  → returns all published courses (learner/anonymous view)
   * - With userId → returns courses created by that user (teacher view)
   */
  getAll: (userId?: string) =>
    axiosInstance.get<CourseResponse[]>('/Course', {
      params: userId ? { userId } : undefined,
    }),

  getById: (id: string) =>
    axiosInstance.get<CourseResponse>(`/Course/${id}`),

  /** POST /Course — requires [Authorize]; BE extracts creatorId from JWT */
  create: (data: CoursePayload) =>
    axiosInstance.post<CourseResponse>('/Course', data),

  /** PUT /Course/{id} — body.id must match route id */
  update: (id: string, data: CoursePayload) =>
    axiosInstance.put<CourseResponse>(`/Course/${id}`, { ...data, id }),

  /** PATCH /Course/{id}/join — authenticated user joins the course */
  join: (id: string) =>
    axiosInstance.patch(`/Course/${id}/join`),

  /** POST /Course/{id}/student — Teacher adds a specific student */
  addStudent: (courseId: string, studentId: string) =>
    axiosInstance.post(`/Course/${courseId}/student`, { studentId }),

  /** DELETE-style: user leaves a course (endpoint on UserController) */
  leave: (courseId: string) =>
    axiosInstance.delete('/User/leave', { params: { courseId } }),

  /** GET /Course/{id}/work — works (assignments/quizzes) for this user in this course */
  getWorks: (
    id: string,
    params?: { type?: string; start?: string; end?: string }
  ) => axiosInstance.get(`/Course/${id}/work`, { params }),

  /** GET /Course/{id}/join-status */
  getJoinStatus: (id: string | number) =>
    axiosInstance.get(`/Course/${id}/join-status`),

  getTopicById: (courseId: string, topicId: string) =>
    axiosInstance.get<TopicResponse>(`/course/${courseId}/topic/${topicId}`),

  /** GET /Course/{id}/assignment-report */
  getAssignmentReport: (
    id: string,
    params?: { start?: string; end?: string }
  ) => axiosInstance.get(`/Course/${id}/assignment-report`, { params }),

  /** GET /Course/{id}/quiz-report */
  getQuizReport: (
    id: string,
    params?: { start?: string; end?: string }
  ) => axiosInstance.get(`/Course/${id}/quiz-report`, { params }),

  /** POST /Course/{id}/clone */
  clone: (
    sourceCourseId: string,
    data: {
      newCourseId: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      category?: string;
      level?: string;
      price?: number;
      isPublished?: boolean;
    }
  ) => axiosInstance.post(`/Course/${sourceCourseId}/clone`, data),
};
