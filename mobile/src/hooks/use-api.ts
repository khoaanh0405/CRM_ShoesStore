import { getApiErrorMessage } from '@/services/api-client';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type DependencyList } from 'react';

/**
 * Tải dữ liệu cho 1 màn hình: tự gọi lại khi màn hình được focus (đổi tab,
 * quay lại từ màn con) hoặc khi `deps` đổi. Bỏ qua kết quả của request cũ nếu
 * đã có request mới hơn (tránh lệch kết quả khi gõ tìm kiếm liên tục).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true); // lần tải đầu tiên
  const [refreshing, setRefreshing] = useState(false); // kéo để làm mới
  const [fetching, setFetching] = useState(false); // bất kỳ request nào đang chạy
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (pull = false) => {
      const id = ++requestId.current;
      if (pull) setRefreshing(true);
      setFetching(true);
      try {
        const result = await fetcher();
        if (id !== requestId.current) return;
        setData(result);
        setError(null);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(getApiErrorMessage(e, 'Không thể tải dữ liệu. Vui lòng thử lại.'));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setFetching(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = useCallback(() => load(true), [load]);
  const reload = useCallback(() => load(false), [load]);

  return { data, loading, refreshing, fetching, error, refresh, reload };
}
