import { AppColors } from '@/constants/appTheme';
import type { IconName } from '@/types/ui';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

/** [icon khi được chọn, icon khi không chọn] cho từng tab. */
const TAB_ICONS: Record<string, [IconName, IconName]> = {
  index: ['home', 'home-outline'],
  products: ['grid', 'grid-outline'],
  surveys: ['clipboard', 'clipboard-outline'],
  feedbacks: ['chatbubbles', 'chatbubbles-outline'],
  profile: ['person', 'person-outline'],
};

/**
 * Thanh điều hướng 5 tab của khách hàng (mục 4.3):
 * Trang chủ · Sản phẩm · Khảo sát · Đánh giá · Cá nhân.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: AppColors.background },
        tabBarActiveTintColor: AppColors.accent,
        tabBarInactiveTintColor: AppColors.textSecondary,
        tabBarStyle: {
          backgroundColor: AppColors.surface,
          borderTopColor: AppColors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? TAB_ICONS.index;
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="products" options={{ title: 'Sản phẩm' }} />
      <Tabs.Screen name="surveys" options={{ title: 'Khảo sát' }} />
      <Tabs.Screen name="feedbacks" options={{ title: 'Đánh giá' }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân' }} />
    </Tabs>
  );
}
