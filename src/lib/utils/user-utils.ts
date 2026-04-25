import { User } from "@/types";

export const normalizeUser = (user: any): User => {
  if (!user) return null as any;
  return {
    id: user.id || user.Id,
    username: user.username || user.Username,
    email: user.email || user.Email,
    role: user.role || user.Role,
    avatar: user.avatar || user.Avatar,
    enrollments: user.enrollments || user.Enrollments || [],
  };
};
