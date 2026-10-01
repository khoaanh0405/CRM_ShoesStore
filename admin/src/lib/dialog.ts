export type DialogTone = 'success' | 'error' | 'warning' | 'info';

export type DialogOptions = {
  title: string;
  message?: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Nút xác nhận màu đỏ (hành động nguy hiểm như xóa). */
  danger?: boolean;
};

export type DialogRequest = DialogOptions & { kind: 'alert' | 'confirm'; resolve: (ok: boolean) => void };

type Handler = (request: DialogRequest) => void;

let handler: Handler | null = null;
const pending: DialogRequest[] = [];

/** <DialogHost/> đăng ký ở đây; yêu cầu đến sớm sẽ được xếp hàng chờ. */
export function registerDialogHost(h: Handler) {
  handler = h;
  pending.splice(0).forEach(h);
  return () => { if (handler === h) handler = null; };
}

function open(kind: DialogRequest['kind'], options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const request: DialogRequest = { ...options, kind, resolve };
    if (handler) handler(request); else pending.push(request);
  });
}

/** Hộp thoại thông báo (1 nút). */
export const showAlert = (options: DialogOptions): Promise<void> => open('alert', options).then(() => undefined);

/** Hộp thoại xác nhận — trả về true nếu bấm xác nhận. */
export const showConfirm = (options: DialogOptions): Promise<boolean> => open('confirm', options);
