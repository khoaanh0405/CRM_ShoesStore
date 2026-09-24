import { getApiErrorMessage } from '@/services/api-client';
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

/**
 * Tải dữ liệu cho 1 trang: gọi lại khi `deps` đổi hoặc khi tab được focus
 * lại (thay cho useFocusEffect của expo-router ở bản mobile — web dùng sự
 * kiện 'visibilitychange' + 'focus' của trình duyệt). Bỏ qua kết quả của
 * request cũ nếu đã có request mới hơn.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetching, setFetching] = useState(false);
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

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);
  const reload = useCallback(() => load(false), [load]);

  return { data, loading, refreshing, fetching, error, refresh, reload };
}
