import axiosInstance from '@/lib/axios';

export interface UserWorkTopic {
  id: string;
  title: string;
  type: string;
  sectionId: string;
  data: any;
  course?: {
    id: string;
    title: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar?: string;
}

export const userService = {
  getUserWork: (params: { type?: string; courseId?: string; start?: string; end?: string }) =>
    axiosInstance.get<UserWorkTopic[]>('/user/work', { params }),
  
  getMe: () => axiosInstance.get<UserProfile>('/user/me'),

  updateMe: (data: { username?: string; avatar?: string }) =>
    axiosInstance.put<UserProfile>('/user/me', data),
};
