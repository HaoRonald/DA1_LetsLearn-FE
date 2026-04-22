import axiosInstance from '@/lib/axios';

// DTOs
export interface AdminDashboardDTO {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalCourses: number;
  activeCourses: number;
  recentUsers: GetUserResponse[];
  recentCourses: GetCourseResponse[];
}

export interface GetUserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface GetCourseResponse {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  creatorId: string;
  imageUrl?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface TogglePublishRequest {
  isPublished: boolean;
}

export interface UserStatisticsDTO {
  totalUsers: number;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
}

export interface CourseStatisticsDTO {
  totalCourses: number;
  publishedCourses: number;
  unpublishedCourses: number;
  newCoursesThisMonth: number;
  courseGrowthRate: number;
}

export const adminApi = {
  // ========== DASHBOARD ==========
  getDashboard: () =>
    axiosInstance.get<AdminDashboardDTO>('/Admin/dashboard'),

  // ========== USER MANAGEMENT ==========
  getAllUsers: (role?: string, search?: string) =>
    axiosInstance.get<GetUserResponse[]>('/Admin/users', {
      params: { role, search }
    }),

  getUserById: (id: string) =>
    axiosInstance.get<GetUserResponse>(`/Admin/users/${id}`),

  updateUserRole: (id: string, role: string) =>
    axiosInstance.put(`/Admin/users/${id}/role`, { role }),

  deleteUser: (id: string) =>
    axiosInstance.delete(`/Admin/users/${id}`),

  // ========== COURSE MANAGEMENT ==========
  getAllCourses: (isPublished?: boolean, search?: string) =>
    axiosInstance.get<GetCourseResponse[]>('/Admin/courses', {
      params: { isPublished, search }
    }),

  deleteCourse: (id: string) =>
    axiosInstance.delete(`/Admin/courses/${id}`),

  toggleCoursePublish: (id: string, isPublished: boolean) =>
    axiosInstance.put<GetCourseResponse>(`/Course/${id}`, { id, isPublished }),

  // ========== STATISTICS ==========
  getUserStatistics: (startDate?: string, endDate?: string) =>
    axiosInstance.get<UserStatisticsDTO>('/Admin/statistics/users', {
      params: { startDate, endDate }
    }),

  getCourseStatistics: (startDate?: string, endDate?: string) =>
    axiosInstance.get<CourseStatisticsDTO>('/Admin/statistics/courses', {
      params: { startDate, endDate }
    }),
};
