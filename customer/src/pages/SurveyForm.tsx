import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { QUESTION_TYPES } from '@/constants/domain';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { getApiErrorMessage } from '@/services/api-client';
import { surveyService } from '@/services/survey.service';
import type { SubmitAnswer, SurveyQuestion } from '@/types/survey';
import { Check, Lock, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';



type DraftAnswer = { value: string; optionId?: number };

/** Làm khảo sát (mục 4.3.4). Chỉ render TEXT và SINGLE_CHOICE. Backend yêu cầu trả lời đủ mọi câu. */
export default function SurveyFormPage() {
  const navigate = useNavigate();
  const customerId = useCustomerId();
  const { id } = useParams<{ id: string }>();
  const surveyId = Number(id);

  const [answers, setAnswers] = useState<Record<number, DraftAnswer>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lockRef = useRef(false);

  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [survey, targets] = await Promise.all([surveyService.getFull(surveyId), surveyService.listByCustomer(customerId)]);
    return { survey, target: targets.find((t) => t.surveyId === surveyId) ?? null };
  }, [surveyId, customerId]);

  const goBack = () => navigate(-1);

  if (loading && !data) return <LoadingView />;
  if (!data) return (<div><ScreenHeader title="Khảo sát" onBack={goBack} /><ErrorView message={error ?? 'Không tìm thấy khảo sát.'} onRetry={reload} /></div>);

  const { survey, target } = data;
  const questions = [...survey.questions].sort((a, b) => a.questionId - b.questionId);
  const isDone = target?.isCompleted === true;

  const blocked = !target
    ? { icon: Lock, title: 'Bạn không nằm trong danh sách nhận khảo sát này', message: 'Hãy liên hệ cửa hàng nếu bạn cho rằng đây là nhầm lẫn.' }
    : isDone
      ? { icon: Check, title: 'Bạn đã hoàn thành khảo sát này', message: 'Cảm ơn bạn đã dành thời gian chia sẻ ý kiến.' }
      : !survey.isActive
        ? { icon: Lock, title: 'Khảo sát đã đóng', message: 'Khảo sát này không còn nhận thêm phản hồi.' }
        : null;

  if (blocked) {
    return (
      <div>
        <ScreenHeader title={survey.title} onBack={goBack} />
        <EmptyView icon={blocked.icon} title={blocked.title} message={blocked.message} actionLabel="Quay lại" onAction={goBack} />
      </div>
    );
  }

  const isAnswered = (q: SurveyQuestion) => !!answers[q.questionId]?.value?.trim();
  const answeredCount = questions.filter(isAnswered).length;
  const progress = questions.length > 0 ? answeredCount / questions.length : 0;

  const setText = (q: SurveyQuestion, value: string) => setAnswers((prev) => ({ ...prev, [q.questionId]: { value } }));
  const setChoice = (q: SurveyQuestion, optionId: number, optionText: string) => setAnswers((prev) => ({ ...prev, [q.questionId]: { value: optionText, optionId } }));

  const doSubmit = async () => {
  if (customerId == null || lockRef.current) return;
  lockRef.current = true;
  const payload: SubmitAnswer[] = questions.map((q) => {
    const a = answers[q.questionId];
    return { questionId: q.questionId, answerValue: a.value.trim(), ...(a.optionId !== undefined && { optionId: a.optionId }) };
  });
  setSubmitting(true);
  try {
    await surveyService.submit(surveyId, { customerId, answers: payload });
    alert('Đã nộp khảo sát. Cảm ơn bạn đã chia sẻ ý kiến!');
    goBack();
  } catch (e) {
    alert('Không nộp được khảo sát: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
  } finally {
    setSubmitting(false);
    lockRef.current = false;
  }
};

  const handleSubmit = () => {
    setShowErrors(true);
    const missing = questions.length - answeredCount;
    if (missing > 0) {
      alert(`Bạn còn ${missing} câu chưa trả lời. Vui lòng hoàn thành tất cả các câu.`);
      return;
    }
    if (confirm('Sau khi nộp bạn sẽ không thể chỉnh sửa. Tiếp tục?')) doSubmit();
  };

  return (
    <div>
      <ScreenHeader title={survey.title} subtitle={`${questions.length} câu hỏi`} onBack={goBack} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: `0 ${SCREEN_PADDING}px 8px` }}>
        <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: AppColors.surface, border: `1px solid ${AppColors.border}` }}>
          <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: AppColors.accent }} />
        </div>
        <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>Đã trả lời {answeredCount}/{questions.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: `4px ${SCREEN_PADDING}px 32px` }}>
        {survey.description ? <span style={{ color: AppColors.textSecondary, fontSize: 14, lineHeight: '20px' }}>{survey.description}</span> : null}

        {questions.map((q, index) => {
          const answer = answers[q.questionId];
          const unanswered = showErrors && !isAnswered(q);
          return (
            <Card key={q.questionId} style={{ display: 'flex', flexDirection: 'column', gap: 10, border: unanswered ? `1px solid ${AppColors.danger}` : undefined }}>
              <span style={{ color: AppColors.accent, fontSize: 12, fontWeight: 700 }}>Câu {index + 1}</span>
              <span style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: 700, lineHeight: '22px' }}>{q.questionContent}</span>

              {q.questionType === QUESTION_TYPES.SINGLE_CHOICE ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...q.options].sort((a, b) => a.sortOrder - b.sortOrder).map((option) => {
                    const isSelected = answer?.optionId === option.optionId;
                    return (
                      <button key={option.optionId} onClick={() => setChoice(q, option.optionId, option.optionText)} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: Radius.md,
                        border: `1px solid ${isSelected ? AppColors.accent : AppColors.border}`, background: AppColors.background, textAlign: 'left',
                      }}>
                        <span style={{ width: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${isSelected ? AppColors.accent : AppColors.textSecondary}`, background: isSelected ? AppColors.accent : 'transparent' }}>
                          {isSelected ? <Check size={12} color={AppColors.accentText} /> : null}
                        </span>
                        <span style={{ flex: 1, color: AppColors.textPrimary, fontSize: 15 }}>{option.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <AppTextField multiline placeholder="Nhập câu trả lời của bạn" value={answer?.value ?? ''} onChangeText={(text) => setText(q, text)} />
              )}

              {unanswered ? <span style={{ color: AppColors.danger, fontSize: 12 }}>Vui lòng trả lời câu hỏi này.</span> : null}
            </Card>
          );
        })}

        <AppButton label="Nộp khảo sát" icon={Send} onClick={handleSubmit} loading={submitting} />
      </div>
    </div>
  );
}
