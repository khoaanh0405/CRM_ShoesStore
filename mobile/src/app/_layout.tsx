import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppColors } from '@/constants/appTheme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

/**
 * "Route guard": dựa vào trạng thái đăng nhập (AuthProvider) để tự động
 * điều hướng giữa nhóm auth [login/register] và app chính [tabs + màn con].
 * Phải nằm TRONG <AuthProvider> vì cần dùng useAuth().
 *
 * Dùng <Stack> (thay cho <Slot>) để các màn con như product/[id],
 * survey/[id], feedback/create có nút quay lại và lịch sử điều hướng.
 */
function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // đang đọc phiên đăng nhập từ SecureStore

    const first = (segments as string[])[0];
    const inAuthGroup = first === 'auth';
    const atRoot = first === undefined || first === 'index';

    if (status === 'signedOut' && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (status === 'signedIn' && (inAuthGroup || atRoot)) {
      router.replace('/tabs');
    }
  }, [status, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: AppColors.background },
      }}
    />
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <StatusBar style="light" />
        <AnimatedSplashOverlay />
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
