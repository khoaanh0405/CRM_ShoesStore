import { AppButton } from '@/components/AppButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { notificationService } from '@/services/notification.service';
import type { AppNotification, NotificationRefType } from '@/types/notification';
import { formatDate } from '@/utils/format';
import { BellOff, CheckCircle, XCircle, ClipboardList, Bell as BellIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ICON_BY_TYPE: Record<AppNotification['type'], typeof ClipboardList> = {
  SURVEY_ASSIGNED: ClipboardList,
  FEEDBACK_APPROVED: CheckCircle,
  FEEDBACK_REJECTED: XCircle,
};

/** Danh sách thông báo của khách hàng. Mở từ chuông thông báo ở Trang chủ. */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const customerId = useCustomerId();
  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    return notificationService.listByCustomer(customerId);
  }, [customerId]);

  const openNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      try { await notificationService.markRead(item.notificationId); } catch { /* không chặn điều hướng */ }
    }
    if (item.refType === 'SURVEY' && item.refId) navigate(`/survey/${item.refId}`);
    else if (item.refType === ('FEEDBACK' as NotificationRefType)) navigate('/tabs/feedbacks');
    reload();
  };

  const markAllRead = async () => {
    if (customerId == null) return;
    await notificationService.markAllRead(customerId);
    reload();
  };

  return (
    <div>
      <ScreenHeader title="Thông báo" onBack={() => navigate(-1)}
        right={data?.some((n) => !n.isRead) ? <AppButton label="Đánh dấu đã đọc" variant="secondary" compact onClick={markAllRead} /> : undefined} />

      {loading && !data ? <LoadingView /> : !data ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: `0 ${SCREEN_PADDING}px 24px` }}>
          {data.length === 0 ? (
            <EmptyView icon={BellOff} title="Chưa có thông báo nào" message="Thông báo về khảo sát mới hoặc kết quả duyệt phản hồi sẽ xuất hiện tại đây." />
          ) : data.map((item) => {
            const Icon = ICON_BY_TYPE[item.type] ?? BellIcon;
            return (
              <button key={item.notificationId} onClick={() => openNotification(item)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: Radius.lg,
                border: `1px solid ${!item.isRead ? AppColors.accent : AppColors.border}`, background: AppColors.surface, textAlign: 'left',
              }}>
                <span style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.accent, flexShrink: 0 }}>
                  <Icon size={20} color={AppColors.accentText} />
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                  <span style={{ color: AppColors.textSecondary, fontSize: 13, lineHeight: '18px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{item.message}</span>
                  <span style={{ color: AppColors.textSecondary, fontSize: 11, marginTop: 2 }}>{formatDate(item.createdAt)}</span>
                </div>
                {!item.isRead ? <span style={{ width: 8, height: 8, borderRadius: 4, background: AppColors.accent, marginTop: 4, flexShrink: 0 }} /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
