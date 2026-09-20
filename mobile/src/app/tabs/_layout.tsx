import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

/**
 * Layout tạm thời cho vùng đã đăng nhập. Hiện chỉ có 1 màn Home (index.tsx)
 * để xác nhận luồng đăng nhập/đăng ký hoạt động đầu-cuối; 4 tab còn lại
 * (Sản phẩm, Khảo sát, Đánh giá, Cá nhân) sẽ được bổ sung theo đúng
 * MOBILE_APP_UI_DESIGN.md ở bước tiếp theo, dùng lại components/app-tabs.tsx.
 */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
