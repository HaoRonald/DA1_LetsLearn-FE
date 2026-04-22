import axiosInstance from "@/lib/axios";

export interface CloudinaryFile {
  name: string;
  displayUrl: string;
  downloadUrl: string;
}

export interface AssignmentResponseData {
  submittedAt?: string;
  files: CloudinaryFile[];
  mark?: number;
  note?: string;
}

export interface AssignmentResponseDTO {
  id: string;
  topicId: string;
  studentId: string;
  data: AssignmentResponseData;
}

export interface CreateAssignmentResponseRequest {
  topicId: string;
  submittedAt?: string;
  cloudinaryFiles: CloudinaryFile[];
  mark?: number;
  note?: string;
}

export const assignmentResponseApi = {
  getByTopic: (topicId: string) =>
    axiosInstance.get<AssignmentResponseDTO[]>(`/topic/${topicId}/assignment-response`),
  
  getById: (topicId: string, id: string) =>
    axiosInstance.get<AssignmentResponseDTO>(`/topic/${topicId}/assignment-response/${id}`),
  
  create: (topicId: string, data: CreateAssignmentResponseRequest) =>
    axiosInstance.post<AssignmentResponseDTO>(`/topic/${topicId}/assignment-response`, data),
    
  update: (topicId: string, id: string, data: Partial<AssignmentResponseDTO>) =>
    axiosInstance.put<AssignmentResponseDTO>(`/topic/${topicId}/assignment-response/${id}`, data),
};
