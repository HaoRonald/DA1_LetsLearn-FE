import axiosInstance from "@/lib/axios";

export interface CloudinaryMediaResponse {
  name: string;
  displayUrl: string;
  downloadUrl: string;
}

export const mediaApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await axiosInstance.post<{ data: CloudinaryMediaResponse }>("/Media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  },
};
