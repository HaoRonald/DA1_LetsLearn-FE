import axiosInstance from '@/lib/axios';

export interface QuizAnswerRequest {
  topicQuizQuestionId: string;
  answer: string;
  mark?: number;
}

export interface CreateQuizResponseRequest {
  topicId: string;
  status: 'In Progress' | 'Finished';
  startedAt?: string;
  completedAt?: string;
  answers: QuizAnswerRequest[];
}

export interface QuizResponseDTO {
  id: string;
  topicId: string;
  studentId: string;
  data: {
    status: string;
    startedAt?: string;
    completedAt?: string;
    answers: Array<{
      topicQuizQuestionId: string;
      answer: string;
      mark?: number;
    }>;
  };
}

export const quizResponseApi = {
  create: (topicId: string, data: CreateQuizResponseRequest) =>
    axiosInstance.post<QuizResponseDTO>(`/topic/${topicId}/quiz-response`, data),
    
  getByTopic: (topicId: string) =>
    axiosInstance.get<QuizResponseDTO[]>(`/topic/${topicId}/quiz-response`),
    
  getById: (topicId: string, id: string) =>
    axiosInstance.get<QuizResponseDTO>(`/topic/${topicId}/quiz-response/${id}`),

  getByUser: (userId: string) =>
    axiosInstance.get<QuizResponseDTO[]>(`/User/${userId}/quiz-responses`),
};
