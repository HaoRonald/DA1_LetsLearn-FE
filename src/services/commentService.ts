import axiosInstance from "@/lib/axios";

export interface CommentUserInfo {
  id: string;
  username: string;
  avatar: string;
}

export interface GetCommentResponse {
  id: string;
  text: string;
  user: CommentUserInfo;
  topicId: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  topicId: string;
  text: string;
}

export const commentApi = {
  getByTopic: (courseId: string, topicId: string) =>
    axiosInstance.get<GetCommentResponse[]>(
      `/course/${courseId}/topic/${topicId}/comments`,
    ),

  add: (courseId: string, topicId: string, request: CreateCommentRequest) =>
    axiosInstance.post<GetCommentResponse>(
      `/course/${courseId}/topic/${topicId}/comments`,
      request,
    ),

  delete: (courseId: string, topicId: string, commentId: string) =>
    axiosInstance.delete(
      `/course/${courseId}/topic/${topicId}/comments/${commentId}`,
    ),
};
