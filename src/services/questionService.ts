import axiosInstance from '@/lib/axios';

// ── Question Bank Types ────────────────────────────────────────────────────────

export interface QuestionChoice {
  id?: string;
  text: string;
  gradePercent?: number;
  feedback?: string;
}

export interface CreateQuestionRequest {
  courseId: string;
  questionName?: string;
  questionText: string;
  status?: string;
  type: 'Choices Answer' | 'True/False' | 'Short Answer';
  defaultMark?: number;
  usage?: number;
  feedbackOfTrue?: string;
  feedbackOfFalse?: string;
  correctAnswer?: boolean;
  multiple?: boolean;
  choices?: QuestionChoice[];
}

export interface GetQuestionResponse {
  id: string;
  createdById: string;
  modifiedById?: string;
  courseId: string;
  courseName?: string;
  questionName?: string;
  questionText: string;
  status?: string;
  type: string;
  defaultMark?: number;
  usage?: number;
  feedbackOfTrue?: string;
  feedbackOfFalse?: string;
  correctAnswer?: boolean;
  multiple?: boolean;
  choices?: QuestionChoice[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Quiz Topic Types ────────────────────────────────────────────────────────────

export interface TopicQuizQuestion {
  id?: string;
  questionName?: string;
  questionText: string;
  type: 'Multiple Choice' | 'True/False' | 'Short Answer';
  defaultMark?: number;
  feedbackOfTrue?: string;
  feedbackOfFalse?: string;
  correctAnswer?: boolean;
  multiple?: boolean;
  choices?: QuestionChoice[];
}

export interface TopicQuizData {
  description?: string;
  open?: string | null;
  close?: string | null;
  timeLimit?: number | null;
  timeLimitUnit?: 'minutes' | 'hours' | null;
  gradeToPass?: number;
  gradingMethod?: 'Highest Grade' | 'Average Grade' | 'First Grade' | 'Last Grade';
  attemptAllowed?: string | number;
  questions?: TopicQuizQuestion[];
}

// ── Question Service ───────────────────────────────────────────────────────────

export const questionService = {
  /**
   * GET /question?courseId=... — get all questions for a course
   */
  getByCourse: (courseId: string) =>
    axiosInstance.get<GetQuestionResponse[]>(`/question`, { params: { courseId } }),

  /**
   * GET /question/{id}
   */
  getById: (id: string) =>
    axiosInstance.get<GetQuestionResponse>(`/question/${id}`),

  /**
   * POST /question — create a question in the question bank
   */
  create: (data: CreateQuestionRequest) =>
    axiosInstance.post<GetQuestionResponse>('/question', data),

  /**
   * PUT /question/{id}
   */
  update: (id: string, data: Partial<CreateQuestionRequest>) =>
    axiosInstance.put<GetQuestionResponse>(`/question/${id}`, data),

  /**
   * DELETE /question/{id}
   */
  delete: (id: string) =>
    axiosInstance.delete(`/question/${id}`),
};
