import axiosInstance from '@/lib/axios';

export interface CreateTopicRequest {
  title?: string;
  type: string;
  sectionId: string;
  data?: string;
}

export interface TopicResponse {
  id: string;
  title?: string;
  type?: string;
  data?: any;
  sectionId: string;
}

export interface UpdateTopicRequest {
  id: string;
  title?: string;
  type?: string;
  data?: any;
}

export interface SaveMeetingHistoryRequest {
  startTime: string;
  endTime: string | null;
  attendeeCount: number;
  attendanceCsvUrl?: string;
}

// Re-export quiz-specific types for convenience
export type { TopicQuizData, TopicQuizQuestion, QuestionChoice } from './questionService';

// ── Types mirrored from BE DTOs ─────────────────────────────────────────────

export interface QuizReportStudentInfo {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface QuizReportStudentMark {
  student: QuizReportStudentInfo;
  submitted: boolean;
  mark?: number;
  responseId?: string;
}

export interface AssignmentReportStudent {
  student: QuizReportStudentInfo;
  submitted: boolean;
  mark?: number;
  responseId?: string;
}

export interface SingleAssignmentReportDTO {
  name: string;
  studentMarks: AssignmentReportStudent[];
  studentWithMarkOver8: AssignmentReportStudent[];
  studentWithMarkOver5: AssignmentReportStudent[];
  studentWithMarkOver2: AssignmentReportStudent[];
  studentWithMarkOver0: AssignmentReportStudent[];
  studentWithNoResponse: AssignmentReportStudent[];
  markDistributionCount: Record<number, number>;
  submissionCount: number;
  gradedSubmissionCount: number;
  fileCount: number;
  avgMark: number;
  maxMark: number;
  minMark: number;
  completionRate: number;
  students: QuizReportStudentInfo[];
  fileTypeCount: Record<string, number>;
}

export interface SingleQuizReportDTO {
  name: string;
  studentWithMark: QuizReportStudentMark[];
  studentWithMarkOver8: QuizReportStudentMark[];
  studentWithMarkOver5: QuizReportStudentMark[];
  studentWithMarkOver2: QuizReportStudentMark[];
  studentWithMarkOver0: QuizReportStudentMark[];
  studentWithNoResponse: QuizReportStudentMark[];
  maxDefaultMark: number;
  questionCount: number;
  avgStudentMarkBase10: number;
  maxStudentMarkBase10: number;
  minStudentMarkBase10: number;
  attemptCount: number;
  avgTimeSpend: number; // seconds
  completionRate: number;
  students: QuizReportStudentInfo[];
  trueFalseQuestionCount: number;
  multipleChoiceQuestionCount: number;
  shortAnswerQuestionCount: number;
}

export const topicApi = {
  create: (courseId: string, data: CreateTopicRequest) =>
    axiosInstance.post<TopicResponse>(`/course/${courseId}/topic`, data),

  update: (courseId: string, id: string, data: UpdateTopicRequest) => {
    const payload = {
      ...data,
      data: typeof data.data === 'object' ? JSON.stringify(data.data) : data.data
    };
    return axiosInstance.put<TopicResponse>(`/course/${courseId}/topic/${id}`, payload);
  },
    
  delete: (courseId: string, topicId: string) =>
    axiosInstance.delete(`/course/${courseId}/topic/${topicId}`),

  getAssignmentReport: (courseId: string, topicId: string) =>
    axiosInstance.get<SingleAssignmentReportDTO>(`/course/${courseId}/topic/${topicId}/assignment-report`),

  getQuizReport: (courseId: string, topicId: string) =>
    axiosInstance.get<SingleQuizReportDTO>(`/course/${courseId}/topic/${topicId}/quiz-report`),

  saveMeetingHistory: (courseId: string, topicId: string, data: SaveMeetingHistoryRequest) =>
    axiosInstance.post(`/course/${courseId}/topic/${topicId}/meeting-history`, data),

  getMeetingToken: (courseId: string, topicId: string) =>
    axiosInstance.get<{
      token: string;
      roomName: string;
      wsUrl: string;
      role: string;
      avatarUrl: string;
      name: string;
    }>(`/Course/${courseId}/meeting/${topicId}/token`),
};

