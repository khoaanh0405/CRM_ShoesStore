import { AppButton } from '@/components/app/app-button';
import { AppScreen } from '@/components/app/app-screen';
import { AppTextField } from '@/components/app/app-text-field';
import { Card } from '@/components/app/card';
import { ScreenHeader } from '@/components/app/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/app/state-views';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { QUESTION_TYPES } from '@/constants/domain';
import { useApi } from '@/hooks/use-api';
import { useCustomerId } from '@/hooks/use-customer-id';
import { getApiErrorMessage } from '@/services/api-client';
import { surveyService } from '@/services/survey.service';
import type { SubmitAnswer, SurveyQuestion } from '@/types/survey';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/** Câu trả lời tạm trong form: TEXT dùng `value`, SINGLE_CHOICE dùng thêm `optionId`. */
type DraftAnswer = { value: string; optionId?: number };

/**
 * Làm khảo sát (mục 4.3.4). Chỉ render 2 loại câu hỏi backend hỗ trợ:
 * TEXT và SINGLE_CHOICE. Backend yêu cầu trả lời ĐỦ mọi câu.
 */
export default function SurveyFormScreen() {
  const router = useRouter();
  const customerId = useCustomerId();
  const { id } = useLocalSearchParams<{ id: string }>();
  const surveyId = Number(id);

  const [answers, setAnswers] = useState<Record<number, DraftAnswer>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [survey, targets] = await Promise.all([
      surveyService.getFull(surveyId),
      surveyService.listByCustomer(customerId),
    ]);
    return { survey, target: targets.find((t) => t.surveyId === surveyId) ?? null };
  }, [surveyId, customerId]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/tabs/surveys'));

  if (loading && !data) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <LoadingView />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <ScreenHeader title="Khảo sát" onBack={goBack} />
        <ErrorView message={error ?? 'Không tìm thấy khảo sát.'} onRetry={reload} />
      </AppScreen>
    );
  }

  const { survey, target } = data;
  const questions = [...survey.questions].sort((a, b) => a.questionId - b.questionId);
  const isDone = target?.isCompleted === true;

  // Các trạng thái không cho làm bài.
  const blocked = !target
    ? {
        icon: 'lock-closed-outline' as const,
        title: 'Bạn không nằm trong danh sách nhận khảo sát này',
        message: 'Hãy liên hệ cửa hàng nếu bạn cho rằng đây là nhầm lẫn.',
      }
    : isDone
      ? {
          icon: 'checkmark-circle-outline' as const,
          title: 'Bạn đã hoàn thành khảo sát này',
          message: 'Cảm ơn bạn đã dành thời gian chia sẻ ý kiến.',
        }
      : !survey.isActive
        ? {
            icon: 'time-outline' as const,
            title: 'Khảo sát đã đóng',
            message: 'Khảo sát này không còn nhận thêm phản hồi.',
          }
        : null;

  if (blocked) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <ScreenHeader title={survey.title} onBack={goBack} />
        <EmptyView
          icon={blocked.icon}
          title={blocked.title}
          message={blocked.message}
          actionLabel="Quay lại"
          onAction={goBack}
        />
      </AppScreen>
    );
  }

  const isAnswered = (q: SurveyQuestion) => !!answers[q.questionId]?.value?.trim();
  const answeredCount = questions.filter(isAnswered).length;
  const progress = questions.length > 0 ? answeredCount / questions.length : 0;

  const setText = (q: SurveyQuestion, value: string) =>
    setAnswers((prev) => ({ ...prev, [q.questionId]: { value } }));

  const setChoice = (q: SurveyQuestion, optionId: number, optionText: string) =>
    setAnswers((prev) => ({ ...prev, [q.questionId]: { value: optionText, optionId } }));

  const doSubmit = async () => {
    if (customerId == null) return;
    const payload: SubmitAnswer[] = questions.map((q) => {
      const a = answers[q.questionId];
      return {
        questionId: q.questionId,
        answerValue: a.value.trim(),
        ...(a.optionId !== undefined && { optionId: a.optionId }),
      };
    });

    setSubmitting(true);
    try {
      await surveyService.submit(surveyId, { customerId, answers: payload });
      Alert.alert(
        'Đã nộp khảo sát',
        'Cảm ơn bạn đã chia sẻ ý kiến!',
        [{ text: 'Đóng', onPress: goBack }],
        { cancelable: false }
      );
    } catch (e) {
      Alert.alert('Không nộp được khảo sát', getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    setShowErrors(true);
    const missing = questions.length - answeredCount;
    if (missing > 0) {
      Alert.alert('Chưa trả lời hết', `Bạn còn ${missing} câu chưa trả lời. Vui lòng hoàn thành tất cả các câu.`);
      return;
    }
    Alert.alert('Nộp khảo sát', 'Sau khi nộp bạn sẽ không thể chỉnh sửa. Tiếp tục?', [
      { text: 'Xem lại', style: 'cancel' },
      { text: 'Nộp bài', onPress: doSubmit },
    ]);
  };

  return (
    <AppScreen edges={['top', 'bottom']}>
      <ScreenHeader title={survey.title} subtitle={`${questions.length} câu hỏi`} onBack={goBack} />

      {/* Thanh tiến độ */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Đã trả lời {answeredCount}/{questions.length}
        </Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {survey.description ? <Text style={styles.description}>{survey.description}</Text> : null}

          {questions.map((q, index) => {
            const answer = answers[q.questionId];
            const unanswered = showErrors && !isAnswered(q);
            return (
              <Card key={q.questionId} style={[styles.question, unanswered && styles.questionError]}>
                <Text style={styles.questionNo}>Câu {index + 1}</Text>
                <Text style={styles.questionText}>{q.questionContent}</Text>

                {q.questionType === QUESTION_TYPES.SINGLE_CHOICE ? (
                  <View style={styles.options}>
                    {[...q.options]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((option) => {
                        const selected = answer?.optionId === option.optionId;
                        return (
                          <Pressable
                            key={option.optionId}
                            onPress={() => setChoice(q, option.optionId, option.optionText)}
                            style={[styles.option, selected && styles.optionSelected]}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}>
                            <View style={[styles.radio, selected && styles.radioSelected]}>
                              {selected ? <Ionicons name="checkmark" size={12} color={AppColors.accentText} /> : null}
                            </View>
                            <Text style={styles.optionText}>{option.optionText}</Text>
                          </Pressable>
                        );
                      })}
                  </View>
                ) : (
                  <AppTextField
                    multiline
                    placeholder="Nhập câu trả lời của bạn"
                    value={answer?.value ?? ''}
                    onChangeText={(text) => setText(q, text)}
                  />
                )}

                {unanswered ? <Text style={styles.errorText}>Vui lòng trả lời câu hỏi này.</Text> : null}
              </Card>
            );
          })}

          <AppButton label="Nộp khảo sát" icon="paper-plane-outline" onPress={handleSubmit} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 32, paddingTop: 4, gap: 14 },
  description: { color: AppColors.textSecondary, fontSize: 14, lineHeight: 20 },

  progressWrap: { gap: 6, paddingHorizontal: SCREEN_PADDING, paddingBottom: 8 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  progressFill: { height: '100%', backgroundColor: AppColors.accent },
  progressText: { color: AppColors.textSecondary, fontSize: 12 },

  question: { gap: 10 },
  questionError: { borderColor: AppColors.danger },
  questionNo: { color: AppColors.accent, fontSize: 12, fontWeight: '700' },
  questionText: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  errorText: { color: AppColors.danger, fontSize: 12 },

  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  optionSelected: { borderColor: AppColors.accent },
  optionText: { flex: 1, color: AppColors.textPrimary, fontSize: 15 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: AppColors.textSecondary,
  },
  radioSelected: { borderColor: AppColors.accent, backgroundColor: AppColors.accent },
});
