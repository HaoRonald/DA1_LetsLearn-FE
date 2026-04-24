import axiosInstance from "@/lib/axios";

export const paymentApi = {
  /**
   * POST /api/Payment/create-url?courseId=...
   * Generates a VNPay payment URL for a course
   */
  createPaymentUrl: (courseId: string) =>
    axiosInstance.get<{ url: string }>(`/payments/create-url`, {
      params: { courseId },
    }),
};
