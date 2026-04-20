import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook tiện ích để gọi API với Axios.
 * Tự động quản lý loading, data, error.
 *
 * @example
 * const { data, loading, error, execute } = useApi(lessonApi.getAll);
 * useEffect(() => { execute(1, 10); }, []);
 */
export function useApi<T, Args extends unknown[]>(
  apiFn: (...args: Args) => Promise<{ data: { data: T } }>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const res = await apiFn(...args);
        setState({ data: res.data.data, loading: false, error: null });
        return res.data.data;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        const message = axiosErr.response?.data?.message || 'Có lỗi xảy ra';
        setState({ data: null, loading: false, error: message });
        throw err;
      }
    },
    [apiFn]
  );

  return { ...state, execute };
}
