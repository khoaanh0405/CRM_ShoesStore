import { Image, StyleSheet, View } from 'react-native';
import { AuthColors } from '@/constants/authTheme';

/**
 * Banner trên cùng của màn Login/Register — thay cho ảnh đôi giày trong
 * bản mock gốc (Login-Register_UI.png) bằng banner khuyến mãi
 * (banner_Login-Register_UI.jpg) theo yêu cầu.
 * File ảnh: mobile/assets/images/banner-login.jpg
 */
export function AuthBanner() {
  return (
    <View style={styles.wrapper}>
      <Image
        source={require('@/assets/images/banner-login.jpg')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: AuthColors.background,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
