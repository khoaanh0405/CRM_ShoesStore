import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  // File này chỉ cần làm điểm đón cho route "/"
  // Mọi việc điều hướng sẽ do AuthGate trong _layout.tsx tự xử lý!
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}