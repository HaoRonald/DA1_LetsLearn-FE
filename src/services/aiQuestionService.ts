import axiosInstance from "@/lib/axios";
import type {
  AiDocumentUploadResponse,
  AiGeneratedQuestion,
  AiQuestionApproveResponse,
  AiQuestionGenerationPayload,
  AiQuestionJobResponse,
} from "@/types/ai-questions";

export function uploadAiDocument(
  courseId: string,
  file: File,
): Promise<AiDocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return axiosInstance
    .post<AiDocumentUploadResponse>("/ai/questions/documents", formData, {
      params: { courseId },
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    })
    .then((r) => r.data);
}

export function createAiQuestionJob(
  payload: AiQuestionGenerationPayload,
): Promise<AiQuestionJobResponse> {
  return axiosInstance
    .post<AiQuestionJobResponse>("/ai/questions/generate", payload)
    .then((r) => r.data);
}

export function getAiQuestionJob(jobId: string): Promise<AiQuestionJobResponse> {
  return axiosInstance
    .get<AiQuestionJobResponse>(`/ai/questions/jobs/${jobId}`)
    .then((r) => r.data);
}

export function getAiGeneratedQuestions(
  jobId: string,
): Promise<AiGeneratedQuestion[]> {
  return axiosInstance
    .get<AiGeneratedQuestion[]>(`/ai/questions/jobs/${jobId}/questions`)
    .then((r) => r.data ?? []);
}

export function approveAiGeneratedQuestions(
  generatedQuestionIds: string[],
): Promise<AiQuestionApproveResponse> {
  return axiosInstance
    .post<AiQuestionApproveResponse>("/ai/questions/approve", {
      generatedQuestionIds,
    })
    .then((r) => r.data);
}
