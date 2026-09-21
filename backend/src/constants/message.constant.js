/**
 * Các thông báo lỗi bị lặp lại ở nhiều Service khác nhau (ví dụ "Không tìm
 * thấy khách hàng." xuất hiện ở customer/customerPreference/feedback/
 * surveyResponse/surveyTarget service). Gom lại 1 chỗ để tránh sai lệch
 * chính tả/nội dung giữa các nơi và dễ đổi ngôn ngữ về sau.
 * Chỉ chứa các message THỰC SỰ bị lặp lại (>=2 nơi) — message chỉ dùng
 * đúng 1 chỗ (ví dụ lỗi validate riêng của từng field) vẫn để inline trong
 * Service tương ứng, không đưa hết vào đây cho "đủ bộ".
 */
export const MESSAGES = {
  NOT_FOUND: {
    ACCOUNT: 'Không tìm thấy tài khoản.',
    ROLE: 'Không tìm thấy vai trò.',
    CUSTOMER: 'Không tìm thấy khách hàng.',
    PREFERENCE: 'Không tìm thấy sở thích.',
    PRODUCT: 'Không tìm thấy sản phẩm.',
    SUPPLIER: 'Không tìm thấy nhà cung cấp.',
    FEEDBACK: 'Không tìm thấy phản hồi.',
    SURVEY: 'Không tìm thấy khảo sát.',
    QUESTION: 'Không tìm thấy câu hỏi.',
    OPTION: 'Không tìm thấy lựa chọn.',
    RESPONSE: 'Không tìm thấy phiếu trả lời khảo sát.',
    NOTIFICATION: 'Không tìm thấy thông báo.',
  },
  SURVEY: {
    ALREADY_SUBMITTED: 'Khách hàng đã nộp khảo sát này rồi.',
    NOT_TARGETED: 'Khách hàng không nằm trong danh sách nhận khảo sát này.',
    ALREADY_TARGETED: 'Khách hàng đã nằm trong danh sách nhận khảo sát này.',
  },
};
