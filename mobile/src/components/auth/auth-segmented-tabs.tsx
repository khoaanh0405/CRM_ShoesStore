import { AuthColors } from '@/constants/authTheme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Thanh chuyển "Đăng nhập" / "Tạo tài khoản" trên cùng form (đúng mock: Sign In / Create Account). */
export function AuthSegmentedTabs({ active }: { active: 'login' | 'register' }) {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      {/* Tab Đăng nhập */}
      <Pressable 
        onPress={() => router.replace('/auth/login')}
        style={[styles.item, active === 'login' && styles.itemActive]}
      >
        <Text style={[styles.label, active === 'login' && styles.labelActive]}>
          Đăng nhập
        </Text>
      </Pressable>

      {/* Tab Tạo tài khoản / Đăng ký */}
      <Pressable 
        onPress={() => router.replace('/auth/register')}
        style={[styles.item, active === 'register' && styles.itemActive]}
      >
        <Text style={[styles.label, active === 'register' && styles.labelActive]}>
          Tạo tài khoản
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: AuthColors.surface,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  itemActive: { backgroundColor: AuthColors.accent },
  label: {
    color: AuthColors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  labelActive: { color: AuthColors.accentText },
});