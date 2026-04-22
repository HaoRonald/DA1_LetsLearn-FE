import axiosInstance from '@/lib/axios';
import type { QuizTopic, StudentResponse, SubmitPayload } from '@/types/quiz-attempt';

// ── Raw API response shapes (before normalisation) ────────────────────────────

interface RawTopicResponse {
  id: string;
  title: string;
  type: string;
  sectionId: string;
  data: unknown; // may be string or object
}

interface RawQuizResponse {
  id: string;
  studentId: string;
  topicId: string;
  data: unknown;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export async function getQuizTopic(courseId: string, topicId: string): Promise<RawTopicResponse> {
  const res = await axiosInstance.get<RawTopicResponse>(`/course/${courseId}/topic/${topicId}`);
  return res.data;
}

export async function getQuizResponse(
  topicId: string,
  quizResponseId: string,
): Promise<RawQuizResponse> {
  const res = await axiosInstance.get<RawQuizResponse>(
    `/topic/${topicId}/quiz-response/${quizResponseId}`,
  );
  return res.data;
}

export async function getQuizResponsesOfTopic(topicId: string): Promise<RawQuizResponse[]> {
  const res = await axiosInstance.get<RawQuizResponse[]>(`/topic/${topicId}/quiz-response`);
  return res.data ?? [];
}

export async function createQuizResponse(
  topicId: string,
  payload: SubmitPayload,
): Promise<StudentResponse> {
  const res = await axiosInstance.post<StudentResponse>(
    `/topic/${topicId}/quiz-response`,
    payload,
  );
  return res.data;
}

// Re-export raw types so mappers can use them
export type { RawTopicResponse, RawQuizResponse };
