import { AppScreen } from '@/components/app/app-screen';
import { ScreenHeader } from '@/components/app/screen-header';
import { SegmentedControl } from '@/components/app/segmented-control';
import { EmptyView, ErrorView, LoadingView } from '@/components/app/state-views';
import { StatusBadge } from '@/components/app/status-badge';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useApi } from '@/hooks/use-api';
import { useCustomerId } from '@/hooks/use-customer-id';
import { surveyService } from '@/services/survey.service';
import type { SurveyTarget } from '@/types/survey';
import { formatDate } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

type TabKey = 'todo' | 'done';

/**
 * Tab Khảo sát (mục 4.3.4): danh sách khảo sát Admin đã gửi tới khách hàng,
 * tách "Cần làm" / "Đã hoàn thành" theo SurveyTarget.isCompleted.
 */
export default function SurveysScreen() {
  const router = useRouter();
  const customerId = useCustomerId();
  const [tab, setTab] = useState<TabKey>('todo');

  const { data, loading, refreshing, error, refresh, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const targets = await surveyService.listByCustomer(customerId);
    return targets.sort(
      (a, b) => new Date(b.survey.createdAt).getTime() - new Date(a.survey.createdAt).getTime()
    );
  }, [customerId]);

  const todo = data?.filter((t) => !t.isCompleted) ?? [];
  const done = data?.filter((t) => t.isCompleted) ?? [];
  const items = tab === 'todo' ? todo : done;

  const openSurvey = (target: SurveyTarget) =>
    router.push({ pathname: '/survey/[id]', params: { id: String(target.surveyId) } });

  return (
    <AppScreen>
      <ScreenHeader title="Khảo sát" subtitle="Chia sẻ ý kiến để chúng tôi phục vụ bạn tốt hơn" />

      <View style={styles.segmentWrap}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { key: 'todo', label: 'Cần làm', count: todo.length },
            { key: 'done', label: 'Đã hoàn thành', count: done.length },
          ]}
        />
      </View>

      {loading && !data ? (
        <LoadingView />
      ) : !data ? (
        <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => String(t.surveyId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.accent} />
          }
          renderItem={({ item }) => <SurveyCard target={item} onPress={() => openSurvey(item)} />}
          ListEmptyComponent={
            tab === 'todo' ? (
              <EmptyView
                icon="checkmark-done-outline"
                title="Không có khảo sát nào cần làm"
                message="Khi cửa hàng gửi khảo sát mới, nó sẽ xuất hiện ở đây."
              />
            ) : (
              <EmptyView
                icon="clipboard-outline"
                title="Chưa hoàn thành khảo sát nào"
                message="Các khảo sát bạn đã nộp sẽ được lưu ở đây."
              />
            )
          }
        />
      )}
    </AppScreen>
  );
}

function SurveyCard({ target, onPress }: { target: SurveyTarget; onPress: () => void }) {
  const { survey, isCompleted } = target;
  const closed = !survey.isActive && !isCompleted;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHead}>
        <StatusBadge
          label={isCompleted ? 'Đã hoàn thành' : closed ? 'Đã đóng' : 'Đang mở'}
          tone={isCompleted ? 'success' : closed ? 'neutral' : 'warning'}
        />
        <Text style={styles.date}>{formatDate(survey.createdAt)}</Text>
      </View>
      <Text style={styles.title}>{survey.title}</Text>
      {survey.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {survey.description}
        </Text>
      ) : null}
      <View style={styles.cardFoot}>
        <Text style={styles.cta}>{isCompleted ? 'Xem lại' : closed ? 'Xem chi tiết' : 'Làm khảo sát'}</Text>
        <Ionicons name="chevron-forward" size={16} color={AppColors.accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmentWrap: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 12 },
  listContent: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 24, gap: 12, flexGrow: 1 },
  card: {
    gap: 8,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  pressed: { opacity: 0.85 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { color: AppColors.textSecondary, fontSize: 12 },
  title: { color: AppColors.textPrimary, fontSize: 17, fontWeight: '800' },
  description: { color: AppColors.textSecondary, fontSize: 13, lineHeight: 19 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  cta: { color: AppColors.accent, fontSize: 13, fontWeight: '700' },
});
