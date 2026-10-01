import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge } from '@/components/StatusBadge';
import { SurveyProductBanner } from '@/components/SurveyProductBanner';
import { AppColors, Radius } from '@/constants/appTheme';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { surveyService } from '@/services/survey.service';
import type { SurveyTarget } from '@/types/survey';
import { formatDate } from '@/utils/format';
import { CheckCheck, ChevronRight, ClipboardList, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type TabKey = 'todo' | 'done';

/** Tab Khảo sát (mục 4.3.4): danh sách bên trái, tiến độ + giới thiệu bên phải. */
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
  const total = data?.length ?? 0;
  const percent = total ? Math.round((done.length / total) * 100) : 0;
  const openSurvey = (target: SurveyTarget) => navigate(`/survey/${target.surveyId}`);

  return (
    <div>
      <ScreenHeader title="Khảo sát" subtitle="Chia sẻ ý kiến để chúng tôi phục vụ bạn tốt hơn" />

      {loading && !data ? <LoadingView /> : !data ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
        <div className="page-split">
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ maxWidth: 440 }}>
              <SegmentedControl value={tab} onChange={setTab} options={[
                { key: 'todo', label: 'Cần làm', count: todo.length },
                { key: 'done', label: 'Đã hoàn thành', count: done.length },
              ]} />
            </div>
            <div className="card-grid">
              {items.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', background: '#fff', border: `1px solid ${AppColors.border}`, borderRadius: Radius.lg }}>
                  {tab === 'todo'
                    ? <EmptyView icon={CheckCheck} title="Không có khảo sát nào cần làm" message="Khi cửa hàng gửi khảo sát mới, nó sẽ xuất hiện ở đây." />
                    : <EmptyView icon={ClipboardList} title="Chưa hoàn thành khảo sát nào" message="Các khảo sát bạn đã nộp sẽ được lưu ở đây." />}
                </div>
              ) : items.map((item) => <SurveyCard key={item.surveyId} target={item} onClick={() => openSurvey(item)} />)}
            </div>
          </div>

          <aside className="side-stack">
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 14 }}>Tiến độ của bạn</div>
              <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{percent}%</div>
              <div className="ov-bar" style={{ margin: '12px 0 16px' }}><span style={{ width: `${percent}%` }} /></div>
              <div className="stat-row"><span style={{ color: AppColors.textSecondary, fontSize: 14 }}>Cần làm</span><b>{todo.length}</b></div>
              <div className="stat-row"><span style={{ color: AppColors.textSecondary, fontSize: 14 }}>Đã hoàn thành</span><b>{done.length}</b></div>
              <div className="stat-row"><span style={{ color: AppColors.textSecondary, fontSize: 14 }}>Tổng số khảo sát</span><b>{total}</b></div>
            </div>
            <div className="panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Lightbulb size={20} />
                <div className="panel-title" style={{ fontSize: 16 }}>Vì sao nên tham gia?</div>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: '20px', color: AppColors.textSecondary }}>
                Ý kiến của bạn giúp cửa hàng hoàn thiện sản phẩm trước khi ra mắt và phục vụ đúng nhu cầu của khách hàng. Mỗi khảo sát chỉ mất vài phút.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SurveyCard({ target, onClick }: { target: SurveyTarget; onClick: () => void }) {
  const { survey, isCompleted } = target;
  const closed = !survey.isActive && !isCompleted;
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: AppColors.surface, textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusBadge label={isCompleted ? 'Đã hoàn thành' : closed ? 'Đã đóng' : 'Đang mở'} tone={isCompleted ? 'success' : closed ? 'neutral' : 'warning'} />
        <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>{formatDate(survey.createdAt)}</span>
      </div>
      <span style={{ color: AppColors.textPrimary, fontSize: 17, fontWeight: 800 }}>{survey.title}</span>
      {survey.product ? <SurveyProductBanner product={survey.product} compact /> : null}
      {survey.description ? <span style={{ color: AppColors.textSecondary, fontSize: 13, lineHeight: '19px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{survey.description}</span> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
        <span style={{ color: AppColors.accent, fontSize: 13, fontWeight: 700 }}>{isCompleted ? 'Xem lại' : closed ? 'Xem chi tiết' : 'Làm khảo sát'}</span>
        <ChevronRight size={16} color={AppColors.accent} />
      </div>
    </div>
  );
}
