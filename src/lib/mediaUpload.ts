import axios from 'axios';
import axiosInstance from '@/lib/axios';
import type { CloudinaryFile } from '@/services/assignmentResponseService';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const isArchive = (name: string) => /\.(zip|rar|7z)$/i.test(name);
export const formatFileSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.ceil(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export function validateUpload(file: File): string | null {
  if (file.size === 0) return `${file.name}: file đang trống.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name}: vượt quá 50 MB mỗi file.`;
  return null;
}

export function uploadError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 413) return 'File vượt quá giới hạn dung lượng của máy chủ.';
    return error.response?.data?.message || 'Không tải được file. Vui lòng kiểm tra kết nối và thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể tải file lên.';
}

export async function uploadMedia(file: File, onProgress?: (percent: number) => void): Promise<CloudinaryFile> {
  const error = validateUpload(file);
  if (error) throw new Error(error);
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post<{ data: CloudinaryFile }>('/Media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
    onUploadProgress: ({ loaded, total }) => {
      if (total) onProgress?.(Math.min(100, Math.round(loaded / total * 100)));
    },
  });
  return response.data.data;
}
