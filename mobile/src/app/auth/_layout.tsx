import { AuthColors } from '@/constants/authTheme';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: AuthColors.background },
        animation: 'fade',
      }}
    />
  );
}
