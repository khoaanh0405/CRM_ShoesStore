/**
 * Helper thuần tính tuổi từ ngày sinh — trước đây định nghĩa cục bộ trong
 * customer.service.js (hàm calcAge). Đây là logic tính toán ngày tháng
 * thuần túy, không phải nghiệp vụ riêng của Customer, nên tách ra utils.
 */
export function calculateAge(dateOfBirth) {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthdayThisYear =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthdayThisYear) age -= 1;
  return age;
}
