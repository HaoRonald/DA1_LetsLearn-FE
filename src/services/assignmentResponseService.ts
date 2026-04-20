import axiosInstance from '@/lib/axios';

export interface CloudinaryFileRequest {
  name?: string;
  displayUrl?: string;
  downloadUrl?: string;
}

export interface CreateAssignmentResponseRequest {
  topicId: string;
  submittedAt?: string;
  cloudinaryFiles: CloudinaryFileRequest[];
  note?: string;
}

export interface AssignmentResponseDTO {
  id: string;
  topicId: string;
  studentId: string;
  data: {
    submittedAt?: string;
    files: any[];
    mark?: number;
    note?: string;
  };
}

export const assignmentResponseApi = {
  create: (topicId: string, data: CreateAssignmentResponseRequest) =>
    axiosInstance.post<AssignmentResponseDTO>(`/topic/${topicId}/assignment-response`, data),
    
  getByTopic: (topicId: string) =>
    axiosInstance.get<AssignmentResponseDTO[]>(`/topic/${topicId}/assignment-response`),
    
  getById: (topicId: string, id: string) =>
    axiosInstance.get<AssignmentResponseDTO>(`/topic/${topicId}/assignment-response/${id}`),
};
