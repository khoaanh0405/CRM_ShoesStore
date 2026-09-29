import { registerDialogHost, showAlert, type DialogRequest, type DialogTone } from '@/lib/dialog';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ICONS: Record<DialogTone, LucideIcon> = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };

/** Tách "Tiêu đề. Nội dung" / "Tiêu đề: Nội dung" từ chuỗi alert() cũ và đoán tone. */
function parseAlert(text: string) {
  const m = text.match(/^(.+?)(?::\s+|\.\s+)([\s\S]+)$/);
  const title = (m ? m[1] : text).replace(/\.$/, '');
  const message = m ? m[2] : undefined;
  const tone: DialogTone = /^Không/.test(text) ? 'error' : /^(Bạn còn|Vui lòng)/.test(text) ? 'warning' : 'success';
  return { title, message, tone };
}

/** Gắn 1 lần trong App: hiển thị hộp thoại thay cho alert/confirm mặc định của trình duyệt. */
export function DialogHost() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const okRef = useRef<HTMLButtonElement>(null);
  const current = queue[0];

  useEffect(() => registerDialogHost((r) => setQueue((q) => [...q, r])), []);

  // Mọi alert() còn sót trong code (Profile, FeedbackCreate, SurveyForm...) tự dùng giao diện mới.
  useEffect(() => {
    const original = window.alert;
    window.alert = (message?: unknown) => { void showAlert(parseAlert(String(message ?? ''))); };
    return () => { window.alert = original; };
  }, []);

  const close = (ok: boolean) => {
    if (!current) return;
    current.resolve(ok);
    setQueue((q) => q.slice(1));
  };

  useEffect(() => {
    if (!current) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!current) return null;
  const isConfirm = current.kind === 'confirm';
  const tone = current.tone ?? (isConfirm ? 'warning' : 'info');
  const Icon = ICONS[tone];

  return (
    <div className="dlg-overlay" onClick={() => close(false)}>
      <div className="dlg" role="alertdialog" aria-modal="true" aria-label={current.title} onClick={(e) => e.stopPropagation()}>
        <div className={`dlg-icon ${tone}`}><Icon size={32} /></div>
        <h3>{current.title}</h3>
        {current.message ? <p>{current.message}</p> : null}
        <div className="dlg-actions">
          {isConfirm ? <button onClick={() => close(false)}>{current.cancelLabel ?? 'Hủy'}</button> : null}
          <button ref={okRef} className={current.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {current.confirmLabel ?? (isConfirm ? 'Xác nhận' : 'Đã hiểu')}
          </button>
        </div>
      </div>
    </div>
  );
}
