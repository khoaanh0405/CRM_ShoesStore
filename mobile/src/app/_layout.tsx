import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

/**
 * "Route guard": dựa vào trạng thái đăng nhập (AuthProvider) để tự động
 * điều hướng giữa nhóm (auth) [login/register] và nhóm (tabs) [app chính].
 * Phải nằm TRONG <AuthProvider> vì cần dùng useAuth().
 */
function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // đang đọc phiên đăng nhập từ SecureStore

    const inAuthGroup = segments[0] === 'auth';

    if (status === 'signedOut' && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (status === 'signedIn' && inAuthGroup) {
      router.replace('/tabs');
    }
  }, [status, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
