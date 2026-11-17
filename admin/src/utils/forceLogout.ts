import { useAuthStore } from '../store/useAuthStore';

let ending = false; // chống alert lặp khi nhiều request/hook cùng phát hiện

/** Hiện alert, xóa phiên rồi về trang đăng nhập (tải lại trang nên cờ `ending` tự reset). */
export function forceLogout(message: string) {
  if (ending) return;
  ending = true;
  window.alert(message);
  useAuthStore.getState().clear();
  window.location.replace('/login');
}
