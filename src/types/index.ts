// ========== Auth ==========
export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  avatar?: string;
  enrollments?: Array<{ courseId: string; joinDate: string }>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ========== API Response ==========
export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== Course / Section / Topic ==========
export interface Topic {
  id: string;
  title: string;
  type: string;
  data?: any;
  sectionId: string;
}

export interface Section {
  id: string;
  courseId: string;
  position: number;
  title: string;
  description?: string;
  topics: Topic[];
}

export interface Course {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  totalJoined: number;
  imageUrl?: string;
  price?: number;
  category?: string;
  level?: string;
  isPublished: boolean;
  sections?: Section[];
  creator?: UserBasicInfo;
  students?: UserBasicInfo[];
}

export interface UserBasicInfo {
  id: string;
  username: string;
  avatar?: string;
}
