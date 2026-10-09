import { useEffect, useRef, useState } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { registerDialogHost, type DialogRequest, type DialogTone } from '../lib/dialog';
import './DialogHost.css';

const ICONS: Record<DialogTone, LucideIcon> = {
  success: CircleCheck, error: CircleX, warning: TriangleAlert, info: Info,
};

/** Gắn 1 lần trong App.tsx: hiển thị bảng thông báo/xác nhận thay cho toast và confirm() của trình duyệt. */
const DialogHost = () => {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const okRef = useRef<HTMLButtonElement>(null);
  const current = queue[0];

  useEffect(() => registerDialogHost((r) => setQueue((q) => [...q, r])), []);

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
    <div className="adlg-overlay" onClick={() => close(false)}>
      <div className="adlg" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={`adlg-icon ${tone}`}><Icon size={32} /></div>
        <h3>{current.title}</h3>
        {current.message ? <p>{current.message}</p> : null}
        <div className="adlg-actions">
          {isConfirm ? <button onClick={() => close(false)}>{current.cancelLabel ?? 'Hủy'}</button> : null}
          <button ref={okRef} className={current.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {current.confirmLabel ?? (isConfirm ? 'Xác nhận' : 'Đã hiểu')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogHost;
