export type DialogTone = 'success' | 'error' | 'warning' | 'info';

export type DialogOptions = {
  title: string;
  message?: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Nút xác nhận màu đỏ (dùng cho hành động nguy hiểm như đăng xuất/xóa). */
  danger?: boolean;
};

export type DialogRequest = DialogOptions & { kind: 'alert' | 'confirm'; resolve: (ok: boolean) => void };

type Handler = (request: DialogRequest) => void;

let handler: Handler | null = null;
const pending: DialogRequest[] = [];

/** <DialogHost/> đăng ký ở đây; yêu cầu đến sớm hơn sẽ được xếp hàng chờ. */
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

/** Thay cho alert(): hiện hộp thoại theo giao diện web. */
export const showAlert = (options: DialogOptions): Promise<void> => open('alert', options).then(() => undefined);

/** Thay cho confirm(): trả về true nếu người dùng bấm xác nhận. */
export const showConfirm = (options: DialogOptions): Promise<boolean> => open('confirm', options);
