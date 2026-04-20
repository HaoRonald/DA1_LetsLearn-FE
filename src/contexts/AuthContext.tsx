"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthState } from "@/types";
import axiosInstance from "@/lib/axios";
import { authApi } from "@/services/authService";

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper to normalize user object from PascalCase to camelCase if necessary
const normalizeUser = (user: any): User => {
  return {
    id: user.id || user.Id,
    username: user.username || user.Username,
    email: user.email || user.Email,
    role: user.role || user.Role,
    avatar: user.avatar || user.Avatar,
    enrollments: user.enrollments || user.Enrollments || [],
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Khởi tạo: lấy thông tin user (Cookie được tự động gửi nhờ withCredentials)
  useEffect(() => {
    const initAuth = async () => {
      // Không cần check session khi đang ở trang login
      if (typeof window !== "undefined" && window.location.pathname === "/login") {
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      try {
        const res = await authApi.getMe();
        const user = normalizeUser(res.data);
        setState({
          user,
          token: "COOKIE_MANAGED", // Token giờ do Cookie quản lý
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("No active session or failed to fetch user:", error);
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    // BE sẽ set Cookie 'ACCESS_TOKEN' trong response này
    await authApi.login(email, password);

    // Gọi API lấy thông tin cá nhân (Cookie sẽ tự động được gửi kèm)
    const profileRes = await authApi.getMe();
    const user = normalizeUser(profileRes.data);

    setState({
      user,
      token: "COOKIE_MANAGED",
      isLoading: false,
      isAuthenticated: true,
    });

    return user;
  };

  const logout = () => {
    authApi.logout().catch(console.error);
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
