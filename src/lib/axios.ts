import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  timeout: 10000,
  withCredentials: true, // Quan trọng: Cho phép gửi Cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Không cần gán header thủ công vì BE dùng Cookie
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

// Flag để tránh redirect nhiều lần cùng lúc
let isRedirecting = false;

// Response interceptor: xử lý lỗi toàn cục
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Không redirect nếu đang ở trang login/register hoặc đang gọi auth endpoints
    const isAuthRequest =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/signup") ||
      error.config?.url?.includes("/auth/logout") ||
      error.config?.url?.includes("/User/me");

    const isOnPublicPage =
      typeof window !== "undefined" &&
      (
        window.location.pathname === "/login" ||
        window.location.pathname === "/register"
      );

    // Chỉ redirect về login khi 401, không phải auth request,
    // không phải đang ở trang public, và chưa đang redirect
    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      !isOnPublicPage &&
      !isRedirecting
    ) {
      isRedirecting = true;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
