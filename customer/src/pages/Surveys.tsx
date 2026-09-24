import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge } from '@/components/StatusBadge';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { surveyService } from '@/services/survey.service';
import type { SurveyTarget } from '@/types/survey';
import { formatDate } from '@/utils/format';
import { CheckCheck, ChevronRight, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type TabKey = 'todo' | 'done';

/** Tab Khảo sát (mục 4.3.4): "Cần làm" / "Đã hoàn thành" theo SurveyTarget.isCompleted. */
export default function SurveysPage() {
  const navigate = useNavigate();
  const customerId = useCustomerId();
  const [tab, setTab] = useState<TabKey>('todo');

  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const targets = await surveyService.listByCustomer(customerId);
    return targets.sort((a, b) => new Date(b.survey.createdAt).getTime() - new Date(a.survey.createdAt).getTime());
  }, [customerId]);

  const todo = data?.filter((t) => !t.isCompleted) ?? [];
  const done = data?.filter((t) => t.isCompleted) ?? [];
  const items = tab === 'todo' ? todo : done;
  const openSurvey = (target: SurveyTarget) => navigate(`/survey/${target.surveyId}`);

  return (
    <div>
      <ScreenHeader title="Khảo sát" subtitle="Chia sẻ ý kiến để chúng tôi phục vụ bạn tốt hơn" />
      <div style={{ padding: `0 ${SCREEN_PADDING}px 12px` }}>
        <SegmentedControl value={tab} onChange={setTab} options={[
          { key: 'todo', label: 'Cần làm', count: todo.length },
          { key: 'done', label: 'Đã hoàn thành', count: done.length },
        ]} />
      </div>

      {loading && !data ? <LoadingView /> : !data ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: `0 ${SCREEN_PADDING}px 24px` }}>
          {items.length === 0 ? (
            tab === 'todo' ? (
              <EmptyView icon={CheckCheck} title="Không có khảo sát nào cần làm" message="Khi cửa hàng gửi khảo sát mới, nó sẽ xuất hiện ở đây." />
            ) : (
              <EmptyView icon={ClipboardList} title="Chưa hoàn thành khảo sát nào" message="Các khảo sát bạn đã nộp sẽ được lưu ở đây." />
            )
          ) : items.map((item) => <SurveyCard key={item.surveyId} target={item} onClick={() => openSurvey(item)} />)}
        </div>
      )}
    </div>
  );
}

function SurveyCard({ target, onClick }: { target: SurveyTarget; onClick: () => void }) {
  const { survey, isCompleted } = target;
  const closed = !survey.isActive && !isCompleted;
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: AppColors.surface, textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusBadge label={isCompleted ? 'Đã hoàn thành' : closed ? 'Đã đóng' : 'Đang mở'} tone={isCompleted ? 'success' : closed ? 'neutral' : 'warning'} />
        <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>{formatDate(survey.createdAt)}</span>
      </div>
      <span style={{ color: AppColors.textPrimary, fontSize: 17, fontWeight: 800 }}>{survey.title}</span>
      {survey.description ? <span style={{ color: AppColors.textSecondary, fontSize: 13, lineHeight: '19px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{survey.description}</span> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
        <span style={{ color: AppColors.accent, fontSize: 13, fontWeight: 700 }}>{isCompleted ? 'Xem lại' : closed ? 'Xem chi tiết' : 'Làm khảo sát'}</span>
        <ChevronRight size={16} color={AppColors.accent} />
      </div>
    </button>
  );
}
