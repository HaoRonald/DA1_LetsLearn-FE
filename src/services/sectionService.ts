import axiosInstance from '@/lib/axios';

export interface CreateSectionRequest {
  courseId: string;
  position?: number;
  title: string;
  description?: string;
}

export interface UpdateSectionRequest {
  id: string;
  position?: number;
  title?: string;
  description?: string;
  topics?: any[];
}

export const sectionApi = {
  create: (data: CreateSectionRequest) =>
    axiosInstance.post('/Section', data),

  getById: (id: string) =>
    axiosInstance.get(`/Section/${id}`),

  update: (id: string, data: UpdateSectionRequest) =>
    axiosInstance.put(`/Section/${id}`, data),
};
