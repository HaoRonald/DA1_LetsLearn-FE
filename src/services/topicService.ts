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

export const topicApi = {
  create: (courseId: string, data: CreateTopicRequest) =>
    axiosInstance.post<TopicResponse>(`/course/${courseId}/topic`, data),
    
  delete: (courseId: string, topicId: string) =>
    axiosInstance.delete(`/course/${courseId}/topic/${topicId}`),
};
