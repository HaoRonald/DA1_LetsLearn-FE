import axiosInstance from "@/lib/axios";
import { Lesson, Vocabulary, PaginatedResponse } from "../types/index";

export const lessonApi = {
  getAll: (page = 1, limit = 10) =>
    axiosInstance.get<{ data: PaginatedResponse<Lesson> }>("/lessons", {
      params: { page, limit },
    }),

  getById: (id: string) =>
    axiosInstance.get<{ data: Lesson }>(`/lessons/${id}`),

  create: (payload: Omit<Lesson, "id" | "createdAt">) =>
    axiosInstance.post<{ data: Lesson }>("/lessons", payload),

  update: (id: string, payload: Partial<Lesson>) =>
    axiosInstance.put<{ data: Lesson }>(`/lessons/${id}`, payload),

  delete: (id: string) => axiosInstance.delete(`/lessons/${id}`),
};

export const vocabularyApi = {
  getByLesson: (lessonId: string) =>
    axiosInstance.get<{ data: Vocabulary[] }>(
      `/lessons/${lessonId}/vocabulary`,
    ),

  create: (lessonId: string, payload: Omit<Vocabulary, "id" | "lessonId">) =>
    axiosInstance.post<{ data: Vocabulary }>(
      `/lessons/${lessonId}/vocabulary`,
      payload,
    ),

  update: (id: string, payload: Partial<Vocabulary>) =>
    axiosInstance.put<{ data: Vocabulary }>(`/vocabulary/${id}`, payload),

  delete: (id: string) => axiosInstance.delete(`/vocabulary/${id}`),
};
