import axiosInstance from "@/lib/axios";
import { AppNotification } from "@/types";

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const response = await axiosInstance.get<AppNotification[]>("/notification");
    return response.data;
  },

  markAsRead: async (id: string, isRead: boolean): Promise<AppNotification> => {
    const response = await axiosInstance.patch<AppNotification>(
      `/notification/${id}/read`,
      { isRead }
    );
    return response.data;
  },

  deleteNotification: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/notification/${id}`);
  },
};
