import { AppColors } from '@/constants/appTheme';
import { CloudOff, Loader2, type LucideIcon, Inbox } from 'lucide-react';
import { AppButton } from './AppButton';

export function LoadingView() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Loader2 size={32} color={AppColors.accent} className="spin" />
    </div>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 32, textAlign: 'center' }}>
      <CloudOff size={40} color={AppColors.textSecondary} />
      <div style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: 700 }}>Không tải được dữ liệu</div>
      <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>{message}</div>
      {onRetry ? <AppButton label="Thử lại" variant="secondary" compact onClick={onRetry} /> : null}
    </div>
  );
}

type EmptyProps = { icon?: LucideIcon; title: string; message?: string; actionLabel?: string; onAction?: () => void; };

export function EmptyView({ icon: Icon = Inbox, title, message, actionLabel, onAction }: EmptyProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 32, textAlign: 'center' }}>
      <Icon size={40} color={AppColors.textSecondary} />
      <div style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: 700 }}>{title}</div>
      {message ? <div style={{ color: AppColors.textSecondary, fontSize: 13, lineHeight: '19px' }}>{message}</div> : null}
      {actionLabel && onAction ? <AppButton label={actionLabel} compact onClick={onAction} /> : null}
    </div>
  );
}
