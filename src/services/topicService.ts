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
    axiosInstance.get<any>(`/course/${courseId}/topic/${topicId}/assignment-report`),

  getQuizReport: (courseId: string, topicId: string) =>
    axiosInstance.get<any>(`/course/${courseId}/topic/${topicId}/quiz-report`),
};
