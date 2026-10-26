import axiosInstance from '@/lib/axios';
import axios from 'axios';

export function getAiGradingError(error: unknown): { status?: number; code?: string; message?: string } | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const body = error.response?.data as { code?: string; message?: string } | undefined;
  return { status: error.response?.status, code: body?.code, message: body?.message };
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  sortOrder: number;
}

export interface AssignmentRubric {
  id: string;
  topicId: string;
  version: number;
  maxScore: number;
  teacherGuidance?: string | null;
  createdAt: string;
  criteria: RubricCriterion[];
}

export interface AiGradingCriterionResult {
  criterionId: string;
  score?: number | null;
  feedback?: string | null;
  evidence?: Array<{ quote?: string | null; page?: number | null }>;
}

export interface AiGradingDraft {
  draftId: string;
  suggestedScore: number;
  criterionResults: AiGradingCriterionResult[];
  summaryFeedback: string;
  strengths: string[];
  improvements: string[];
  studySuggestions: string[];
  reviewStatus: string;
  reviewVersion: number;
  finalScore?: number | null;
  finalFeedback?: string | null;
  reviewComment?: string | null;
}

export interface AiGradingJob {
  jobId: string;
  assignmentResponseId: string;
  status: string;
  rubricVersion: number;
  attempt: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  draft?: AiGradingDraft | null;
}

export interface PublishedAssignmentGrade {
  assignmentResponseId: string;
  score: number;
  feedback?: string | null;
  gradedAt?: string | null;
}

export const aiAssignmentGradingApi = {
  getRubric: (topicId: string) => axiosInstance.get<AssignmentRubric>(`/topics/${topicId}/grading-rubric`),
  saveRubric: (topicId: string, data: { maxScore: number; teacherGuidance?: string; criteria: Array<Omit<RubricCriterion, 'id'>> }) =>
    axiosInstance.put<AssignmentRubric>(`/topics/${topicId}/grading-rubric`, data),
  requestJob: (responseId: string) => axiosInstance.post<{ jobId: string; status: string; statusUrl: string; createdAt: string }>(`/assignment-responses/${responseId}/ai-grading/jobs`),
  getJob: (jobId: string) => axiosInstance.get<AiGradingJob>(`/ai-grading/jobs/${jobId}`),
  getHistory: (responseId: string, page = 1, pageSize = 10) =>
    axiosInstance.get<{ page: number; pageSize: number; totalCount: number; items: AiGradingJob[] }>(`/assignment-responses/${responseId}/ai-grading/history`, { params: { page, pageSize } }),
  publish: (draftId: string, data: { finalScore: number; finalFeedback: string; expectedReviewVersion: number }) =>
    axiosInstance.post<PublishedAssignmentGrade>(`/ai-grading/drafts/${draftId}/publish`, data),
  reject: (draftId: string, data: { reason: string; expectedReviewVersion: number }) =>
    axiosInstance.post(`/ai-grading/drafts/${draftId}/reject`, data),
  getPublishedGrade: (responseId: string) => axiosInstance.get<PublishedAssignmentGrade>(`/assignment-responses/${responseId}/grade`),
};
