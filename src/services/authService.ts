import axiosInstance from '@/lib/axios';
import { User, ApiResponse } from '@/types';

// Matching backend AuthController and DTOs
export interface LoginResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    axiosInstance.post<LoginResponse>('/auth/login', { email, password }),

  register: (username: string, email: string, password: string, role: string = 'Learner') =>
    axiosInstance.post<{ message: string }>('/auth/signup', { username, email, password, role }),

  getMe: () =>
    axiosInstance.get<User>('/User/me'),

  logout: () =>
    axiosInstance.post<{ message: string }>('/auth/logout'),
  
  refresh: () =>
    axiosInstance.post<{ message: string }>('/auth/refresh'),
};
