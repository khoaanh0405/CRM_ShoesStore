import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/* ---------- tiện ích ---------- */
// Random có seed cố định -> mỗi lần seed cho ra đúng cùng một bộ dữ liệu demo.
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const pickWeighted = (weights) => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
  return weights.length - 1;
};
const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];
const daysAgo = (n, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(rand() * 60), 0, 0);
  return d;
};

// Ngày tạo tài khoản ngẫu nhiên (RNG riêng để không làm đổi dữ liệu demo khác).
const randAcc = mulberry32(7);
const randomPast = (minDays, maxDays) => {
  const d = new Date();
  d.setDate(d.getDate() - (minDays + Math.floor(randAcc() * (maxDays - minDays + 1))));
  d.setHours(Math.floor(randAcc() * 24), Math.floor(randAcc() * 60), Math.floor(randAcc() * 60), 0);
  return d;
};

/* ---------- email khách hàng ---------- */
// Mỗi khách hàng có 1 email duy nhất (chữ thường). Mặc định: <username>@example.com.
// Tài khoản 'nguyenvana' dùng email THẬT của bạn để test luồng Quên mật khẩu (OTP gửi qua email).
// Muốn test bằng email khác: sửa giá trị bên dưới rồi chạy lại seed.
const EMAIL_OVERRIDES = {
  nguyenvana: 'nguyenhuudai104@gmail.com',
};
const emailOf = (username) => EMAIL_OVERRIDES[username] ?? `${username}@example.com`;

/* ---------- dữ liệu nguồn ---------- */
const SUPPLIER = {
  supplierName: 'Công ty TNHH Phân Phối Giày Sài Gòn',
  phone: '0283999888',
  email: 'lienhe@giaysaigon.vn',
  address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
};

// 12 sản phẩm KHÁC NHAU hoàn toàn, danh mục khớp với utils/category.ts phía customer.
const PRODUCTS = [
  { productName: 'Giày Sneaker Air Classic', category: 'Sneaker', brand: 'Nike', size: '37/38/39/40/41/42', color: 'Trắng/Đen', material: 'Da tổng hợp', price: 850000, stockQuantity: 100 },
  { productName: 'Giày Sneaker Urban Street', category: 'Sneaker', brand: 'Adidas', size: '38/39/40/41', color: 'Xám', material: 'Vải canvas', price: 1250000, stockQuantity: 80 },
  { productName: 'Giày Sneaker Aero Lite 2027', category: 'Sneaker', brand: 'Puma', size: '40/41/42', color: 'Xanh pastel', material: 'Vải dệt siêu nhẹ', price: 1590000, stockQuantity: 20 },
  { productName: 'Giày Chạy Bộ Pegasus Pro', category: 'Running', brand: 'Nike', size: '41/42', color: 'Cam', material: 'Vải lưới thoáng khí', price: 1850000, stockQuantity: 60 },
  { productName: 'Giày Chạy Bộ Ultraboost Light', category: 'Running', brand: 'Adidas', size: '41/42', color: 'Xanh dương', material: 'Primeknit', price: 2450000, stockQuantity: 45 },
  { productName: 'Giày Chạy Bộ Fresh Foam Road', category: 'Running', brand: 'New Balance', size: '41/42/43', color: 'Đen/Vàng', material: 'Mesh', price: 1650000, stockQuantity: 70 },
  { productName: 'Giày Bóng Rổ Air Zoom Court', category: 'Basketball', brand: 'Nike', size: '40/41/41/42/43', color: 'Đỏ/Đen', material: 'Da lộn', price: 2100000, stockQuantity: 40 },
  { productName: 'Giày Bóng Rổ Curry Elite', category: 'Basketball', brand: 'Under Armour', size: '42/43/44', color: 'Trắng/Vàng', material: 'Vải dệt cao cấp', price: 2350000, stockQuantity: 35 },
  { productName: 'Giày Cao Gót Elegance Nude', category: 'Heels', brand: 'Juno', size: '36/37/38/39/40', color: 'Be', material: 'Da bò', price: 990000, stockQuantity: 30 },
  { productName: 'Giày Cao Gót Royal Đỏ', category: 'Heels', brand: 'Vascara', size: '37/38/39', color: 'Đỏ đô', material: 'Da lộn', price: 1150000, stockQuantity: 25 },
  { productName: 'Sandal Quai Mùa Hè', category: 'Sandal', brand: "Biti's", size: '38/39', color: 'Trắng', material: 'Nhựa dẻo', price: 350000, stockQuantity: 120 },
  { productName: 'Sandal Thể Thao Đi Biển', category: 'Sandal', brand: 'Bata', size: '40/41', color: 'Xanh rêu', material: 'Cao su EVA', price: 490000, stockQuantity: 90 },
];

// [username, họ tên, ngày sinh, giới tính, sđt, địa chỉ, [sở thích], isLocked, isDeleted]
// Email sinh tự động bằng emailOf(username).
// 0-20: đang hoạt động | 21-22: bị khóa | 23-25: đã xóa mềm. Độ tuổi & giới tính đa dạng để báo cáo CRM có số liệu.
const CUSTOMERS = [
  ['nguyenvana', 'Nguyễn Văn An', '2008-04-12', 'Nam', '0901000001', 'Q.1, TP.HCM', ['Giày Sneaker'], false, false],
  ['tranthib', 'Trần Thị Bích', '2007-09-30', 'Nữ', '0901000002', 'Q.3, TP.HCM', ['Giày Sneaker', 'Giày Sandal'], false, false],
  ['levanc', 'Lê Văn Cường', '2002-01-15', 'Nam', '0901000003', 'Q.5, TP.HCM', ['Giày Chạy Bộ'], false, false],
  ['phamthid', 'Phạm Thị Dung', '2001-03-25', 'Nữ', '0901000004', 'Q.10, TP.HCM', ['Giày Cao Gót'], false, false],
  ['hoangvane', 'Hoàng Văn Em', '2003-11-08', 'Nam', '0901000005', 'Q.Tân Bình, TP.HCM', ['Giày Bóng Rổ', 'Giày Thể Thao'], false, false],
  ['vothif', 'Võ Thị Phương', '2000-06-19', 'Nữ', '0901000006', 'Q.7, TP.HCM', ['Giày Sandal'], false, false],
  ['dangvang', 'Đặng Văn Giang', '1998-07-22', 'Nam', '0901000007', 'Q.Bình Thạnh, TP.HCM', ['Giày Bóng Rổ'], false, false],
  ['buithih', 'Bùi Thị Hoa', '1999-02-18', 'Nữ', '0901000008', 'Q.Gò Vấp, TP.HCM', ['Giày Sneaker', 'Giày Thể Thao'], false, false],
  ['ngophii', 'Ngô Phi Hùng', '1996-11-05', 'Nam', '0901000009', 'Q.4, TP.HCM', ['Giày Da'], false, false],
  ['lythik', 'Lý Thị Kim', '1997-09-09', 'Nữ', '0901000010', 'Q.2, TP.HCM', ['Giày Chạy Bộ', 'Giày Thể Thao'], false, false],
  ['truongvanl', 'Trương Văn Lâm', '1994-04-30', 'Nam', '0901000011', 'Q.11, TP.HCM', ['Giày Thể Thao', 'Giày Chạy Bộ'], false, false],
  ['dothim', 'Đỗ Thị Mai', '1993-06-14', 'Nữ', '0901000012', 'Q.Phú Nhuận, TP.HCM', ['Giày Cao Gót', 'Giày Sandal'], false, false],
  ['nguyenvann', 'Nguyễn Văn Nam', '1990-12-01', 'Nam', '0901000013', 'Q.12, TP.HCM', ['Giày Da', 'Giày Sneaker'], false, false],
  ['tranthio', 'Trần Thị Oanh', '1989-05-27', 'Nữ', '0901000014', 'Q.Thủ Đức, TP.HCM', ['Giày Cao Gót', 'Giày Da'], false, false],
  ['phamvanp', 'Phạm Văn Phúc', '1987-08-16', 'Nam', '0901000015', 'Q.6, TP.HCM', ['Giày Da'], false, false],
  ['lethiq', 'Lê Thị Quyên', '1985-10-03', 'Nữ', '0901000016', 'Q.8, TP.HCM', ['Giày Sandal', 'Giày Cao Gót'], false, false],
  ['vovanr', 'Võ Văn Rạng', '1982-01-21', 'Nam', '0901000017', 'Q.9, TP.HCM', ['Giày Chạy Bộ', 'Giày Da'], false, false],
  ['hothis', 'Hồ Thị Sương', '1979-03-11', 'Nữ', '0901000018', 'Q.Tân Phú, TP.HCM', ['Giày Sandal'], false, false],
  ['dinhvant', 'Đinh Văn Tài', '1975-12-24', 'Nam', '0901000019', 'Huyện Bình Chánh, TP.HCM', ['Giày Da'], false, false],
  ['maithiu', 'Mai Thị Uyên', '1970-07-07', 'Nữ', '0901000020', 'Q.Bình Tân, TP.HCM', ['Giày Sandal', 'Giày Da'], false, false],
  ['caovanv', 'Cao Văn Vinh', '2004-05-05', 'Khác', '0901000021', 'Q.1, TP.HCM', ['Giày Sneaker', 'Giày Bóng Rổ'], false, false],
  // bị khóa
  ['luuthix', 'Lưu Thị Xuân', '1995-02-02', 'Nữ', '0901000022', 'Q.5, TP.HCM', ['Giày Cao Gót'], true, false],
  ['tavany', 'Tạ Văn Yên', '1992-09-19', 'Nam', '0901000023', 'Q.Tân Bình, TP.HCM', ['Giày Thể Thao'], true, false],
  // đã xóa mềm (vẫn giữ lịch sử phản hồi)
  ['phanvann', 'Phan Văn Nghĩa', '1992-03-03', 'Nam', '0901000024', 'Q.6, TP.HCM', ['Giày Da'], false, true],
  ['huynhthio', 'Huỳnh Thị Ơn', '1997-08-28', 'Nữ', '0901000025', 'Q.8, TP.HCM', ['Giày Cao Gót'], false, true],
  ['vuvanp', 'Vũ Văn Quân', '1991-12-19', 'Nam', '0901000026', 'Q.9, TP.HCM', ['Giày Bóng Rổ'], false, true],
];

// [chỉ số khách hàng, chỉ số sản phẩm, tiêu đề, nội dung, rating, trạng thái, số ngày trước]
const FEEDBACKS = [
  [0, 0, 'Đôi giày rất đẹp', 'Form giày gọn, phối đồ đi học rất hợp. Đi cả ngày vẫn êm chân.', 5, 'Approved', 40],
  [1, 0, 'Chất lượng tốt so với giá', 'Da mềm, đường may chắc chắn. Sẽ giới thiệu cho bạn bè.', 4, 'Approved', 38],
  [2, 3, 'Chạy 10km rất êm', 'Đế phản hồi tốt, thoáng chân, chạy buổi sáng không bị nóng.', 5, 'Approved', 36],
  [3, 8, 'Đi rất vừa chân', 'Form chuẩn, gót không bị cấn, đi cả ngày ở văn phòng vẫn thoải mái.', 5, 'Approved', 35],
  [4, 6, 'Bám sân tốt', 'Chơi bóng rổ trong nhà thấy độ bám rất ổn, cổ giày ôm chắc.', 4, 'Approved', 33],
  [5, 10, 'Sandal nhẹ và mát', 'Đi mùa hè rất dễ chịu, quai mềm không bị cấn.', 4, 'Approved', 30],
  [6, 7, 'Đế hơi cứng lúc mới mang', 'Chất lượng ổn nhưng phải mang vài buổi mới quen. Mong cải thiện độ êm.', 3, 'Approved', 28],
  [7, 1, 'Màu đẹp ngoài đời', 'Màu xám thanh lịch, vải canvas dày dặn. Hơi chật một chút ở mũi giày.', 4, 'Approved', 26],
  [9, 4, 'Nhẹ như không', 'Ôm chân tốt, chạy đường dài không bị phồng rộp.', 5, 'Approved', 24],
  [10, 5, 'Giá hợp lý', 'Fresh Foam rất êm, dùng tập gym lẫn chạy bộ đều ổn.', 4, 'Approved', 22],
  [11, 9, 'Màu đỏ đô sang trọng', 'Gót vừa phải, đi tiệc không mỏi chân. Rất hài lòng.', 5, 'Approved', 20],
  [19, 11, 'Bền, chống trượt tốt', 'Mình dùng đi biển, chống trượt khá tốt, nhanh khô.', 4, 'Approved', 18],
  [23, 0, 'Từng dùng khá ổn', 'Trước khi ngừng sử dụng dịch vụ, sản phẩm này khá ổn.', 4, 'Approved', 55],
  // chờ duyệt — để manager demo duyệt/từ chối
  [12, 0, 'Giao hàng hơi chậm', 'Chất lượng giày tốt nhưng đơn vị vận chuyển giao hơi lâu.', 4, 'Pending', 3],
  [13, 8, 'Mũi giày hơi hẹp', 'Đi 1 tiếng đầu thấy chật ngón cái, mong có thêm size rộng.', 3, 'Pending', 2],
  [14, 6, 'Đế hơi trơn trên sân xi măng', 'Trong nhà thì tốt, ngoài trời hơi trơn. Mong cải thiện độ bám.', 2, 'Pending', 2],
  [15, 10, 'Màu ngoài đời nhạt hơn ảnh', 'Chất lượng ok nhưng màu trắng hơi ngả xám so với hình.', 3, 'Pending', 1],
  [16, 3, 'Chạy trail hơi trơn', 'Dùng chạy đường phố rất tốt, đường đất ẩm thì đế hơi trơn.', 4, 'Pending', 1],
  [20, 2, 'Rất mong ngày ra mắt', 'Thấy mẫu Aero Lite 2027 giới thiệu rất đẹp, mong sớm có size 40.', 5, 'Pending', 1],
  [17, 11, 'Quai hơi cứng', 'Quai chưa đủ mềm, mang lâu bị hằn chân.', 3, 'Pending', 0],
  [8, 1, 'Phối đồ công sở được', 'Thiết kế trẻ trung nhưng vẫn lịch sự, hợp đi làm.', 4, 'Pending', 0],
  // bị từ chối (spam/không liên quan)
  [18, 4, 'quảng cáo linkkkk', 'Xem sản phẩm giá rẻ tại website abc.xyz, ưu đãi lớn.', 1, 'Rejected', 15],
  [21, 8, 'aaaaaaaa', 'Nội dung không liên quan, lặp ký tự vô nghĩa.', 1, 'Rejected', 12],
  [15, 5, 'Bình luận không đúng sản phẩm', 'Nội dung nói về dịch vụ khác, không phải sản phẩm này.', 2, 'Rejected', 10],
];

// Khảo sát: q = [nội dung, loại, [lựa chọn], [trọng số ngẫu nhiên]]
const SURVEYS = [
  {
    key: 'satisfaction',
    title: 'Khảo sát mức độ hài lòng khách hàng 2026',
    description: 'Giúp chúng tôi đo lường mức độ hài lòng và cải thiện chất lượng phục vụ.',
    isActive: true, productIdx: null, daysAgo: 30,
    questions: [
      ['Mức độ hài lòng chung của bạn về cửa hàng?', 'SINGLE_CHOICE', ['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Chưa hài lòng', 'Rất không hài lòng'], [5, 6, 3, 1, 0.5]],
      ['Bạn biết đến cửa hàng qua kênh nào?', 'SINGLE_CHOICE', ['Mạng xã hội', 'Bạn bè giới thiệu', 'Quảng cáo trực tuyến', 'Tự tìm kiếm'], [5, 4, 2, 2]],
      ['Bạn mua giày với tần suất nào?', 'SINGLE_CHOICE', ['Mỗi tháng', 'Mỗi 3 tháng', 'Mỗi 6 tháng', 'Mỗi năm một lần'], [1, 4, 5, 3]],
      ['Yếu tố quan trọng nhất khi chọn giày?', 'SINGLE_CHOICE', ['Giá cả', 'Chất lượng', 'Kiểu dáng', 'Thương hiệu', 'Độ êm chân'], [3, 5, 4, 2, 4]],
      ['Bạn đánh giá thái độ tư vấn của nhân viên?', 'SINGLE_CHOICE', ['Rất tốt', 'Tốt', 'Bình thường', 'Chưa tốt'], [5, 5, 2, 0.5]],
      ['Khả năng bạn giới thiệu cửa hàng cho người quen?', 'SINGLE_CHOICE', ['Chắc chắn sẽ giới thiệu', 'Có thể giới thiệu', 'Chưa chắc', 'Sẽ không giới thiệu'], [5, 5, 2, 0.5]],
      ['Điều bạn hài lòng nhất ở cửa hàng là gì?', 'TEXT', [], [], [
        'Mẫu mã đa dạng, giá hợp lý.', 'Nhân viên tư vấn nhiệt tình.', 'Chất lượng giày đúng như mô tả.', 'Giao hàng nhanh, đóng gói cẩn thận.', 'Đi rất êm chân.']],
      ['Điều gì cửa hàng cần cải thiện?', 'TEXT', [], [], [
        'Nên có thêm nhiều size lớn.', 'Cập nhật mẫu mới thường xuyên hơn.', 'Chính sách đổi trả cần rõ ràng hơn.', 'Chưa có góp ý thêm, mọi thứ ổn.', 'Nên có thêm ưu đãi cho khách thân thiết.']],
    ],
  },
  {
    key: 'launch',
    title: 'Thăm dò ra mắt Giày Sneaker Aero Lite 2027',
    description: 'Lắng nghe ý kiến của bạn trước khi chúng tôi ra mắt mẫu sneaker mới.',
    isActive: true, productIdx: 2, daysAgo: 14,
    questions: [
      ['Bạn có quan tâm đến mẫu sneaker mới này không?', 'SINGLE_CHOICE', ['Rất quan tâm', 'Quan tâm', 'Bình thường', 'Không quan tâm'], [5, 5, 2, 1]],
      ['Mức giá bạn sẵn sàng chi trả?', 'SINGLE_CHOICE', ['Dưới 1.000.000đ', '1.000.000đ - 1.500.000đ', '1.500.000đ - 2.000.000đ', 'Trên 2.000.000đ'], [2, 4, 5, 1]],
      ['Màu sắc bạn yêu thích nhất?', 'SINGLE_CHOICE', ['Xanh pastel', 'Trắng', 'Đen', 'Be/Kem'], [4, 5, 4, 2]],
      ['Bạn có mua ngay khi sản phẩm ra mắt?', 'SINGLE_CHOICE', ['Chắc chắn mua', 'Có thể mua', 'Cần xem thêm đánh giá', 'Không mua'], [3, 5, 4, 1]],
      ['Bạn mong muốn tính năng nào ở mẫu giày mới?', 'TEXT', [], [], [
        'Đế êm và nhẹ hơn.', 'Thêm nhiều màu pastel.', 'Chất liệu thoáng khí, dễ vệ sinh.', 'Mũi giày rộng hơn cho người chân bè.', 'Chống trượt tốt hơn.']],
    ],
    targetsBy: (c) => c.prefs.some((p) => ['Giày Sneaker', 'Giày Thể Thao'].includes(p)),
    responseRate: 0.65,
  },
  {
    key: 'experience',
    title: 'Khảo sát trải nghiệm mua sắm quý 2/2026',
    description: 'Khảo sát đã đóng — dùng để tham khảo số liệu thống kê.',
    isActive: false, productIdx: null, daysAgo: 75,
    questions: [
      ['Bạn hài lòng với dịch vụ chăm sóc khách hàng không?', 'SINGLE_CHOICE', ['Rất hài lòng', 'Hài lòng', 'Chưa hài lòng'], [5, 5, 1]],
      ['Thời gian giao hàng có đáp ứng mong đợi?', 'SINGLE_CHOICE', ['Nhanh hơn dự kiến', 'Đúng hẹn', 'Chậm hơn dự kiến'], [3, 6, 2]],
      ['Bạn có gặp khó khăn khi chọn size?', 'SINGLE_CHOICE', ['Không', 'Thỉnh thoảng', 'Thường xuyên'], [6, 3, 1]],
      ['Góp ý thêm cho cửa hàng:', 'TEXT', [], [], ['Nhân viên tư vấn nhiệt tình.', 'Nên có thêm bảng size chi tiết.', 'Mọi thứ đều ổn.']],
    ],
    targetIdxs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], respondCount: 8,
  },
  {
    key: 'running',
    title: 'Khảo sát nhu cầu giày chạy bộ',
    description: 'Dành cho khách yêu thích chạy bộ. Khảo sát vừa gửi, chưa có ai trả lời nên vẫn có thể chỉnh sửa câu hỏi.',
    isActive: true, productIdx: null, daysAgo: 2,
    questions: [
      ['Bạn chạy bộ với tần suất nào?', 'SINGLE_CHOICE', ['1-2 buổi/tuần', '3-4 buổi/tuần', '5 buổi/tuần trở lên'], [1, 1, 1]],
      ['Bạn ưu tiên yếu tố nào ở giày chạy bộ?', 'SINGLE_CHOICE', ['Độ êm', 'Độ nhẹ', 'Độ bám', 'Độ bền'], [1, 1, 1, 1]],
      ['Bạn mong muốn điều gì ở dòng giày chạy bộ mới?', 'TEXT', [], [], ['']],
    ],
    targetsBy: (c) => c.prefs.includes('Giày Chạy Bộ'),
    responseRate: 0,
  },
  {
    key: 'warranty',
    title: 'Đánh giá dịch vụ bảo hành & đổi trả',
    description: 'Khảo sát nháp — chưa gửi cho ai. Dùng để demo nút "Gửi tất cả".',
    isActive: true, productIdx: null, daysAgo: 0,
    questions: [
      ['Bạn đã từng sử dụng dịch vụ bảo hành hoặc đổi trả chưa?', 'SINGLE_CHOICE', ['Đã từng', 'Chưa từng'], [1, 1]],
      ['Bạn đánh giá quy trình đổi trả như thế nào?', 'SINGLE_CHOICE', ['Rất dễ dàng', 'Dễ dàng', 'Hơi phức tạp', 'Rất phức tạp'], [1, 1, 1, 1]],
      ['Bạn mong muốn cải thiện điều gì ở dịch vụ bảo hành?', 'TEXT', [], [], ['']],
    ],
    targetsBy: () => false,
    responseRate: 0,
  },
];

async function main() {
  console.log('Đang reset và seed dữ liệu CRM...');

  // 0. Xóa sạch dữ liệu cũ (seed chạy lại bao nhiêu lần cũng không bị trùng)
    await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "audit_logs", "review_replies", "password_reset_otps", "notifications", "survey_answers", "survey_responses", "survey_targets",
      "survey_question_options", "survey_questions", "surveys", "feedbacks",
      "customer_preferences", "customers", "products", "categories", "suppliers", "accounts", "roles"
    RESTART IDENTITY CASCADE
  `);

  // 1. Vai trò + tài khoản nội bộ (Admin & Manager lưu email ngay trong bảng accounts, không có hồ sơ Customer)
  const [adminRole, managerRole, customerRole] = await Promise.all([
    prisma.role.create({ data: { roleName: 'Admin', description: 'Quản trị viên hệ thống' } }),
    prisma.role.create({ data: { roleName: 'Manager', description: 'Quản lý CRM (khách hàng, phản hồi, khảo sát)' } }),
    prisma.role.create({ data: { roleName: 'Customer', description: 'Khách hàng' } }),
  ]);
  const passwordHash = await bcrypt.hash('123456', 10);

  const adminAccount = await prisma.account.create({
    data: {
      username: 'admin', email: 'admin@ouran.com', passwordHash,
      roleId: adminRole.roleId, createdAt: randomPast(300, 420),
    },
  });

  const managerAccount = await prisma.account.create({
    data: {
      username: 'manager', email: 'manager@ouran.com', passwordHash,
      roleId: managerRole.roleId, createdAt: randomPast(200, 299),
    },
  });

  // 2. Nhà cung cấp duy nhất + sản phẩm
   const supplier = await prisma.supplier.create({ data: SUPPLIER });

  const CATEGORY_DESC = {
    Sneaker: 'Giày sneaker thời trang', Running: 'Giày chạy bộ', Basketball: 'Giày bóng rổ',
    Heels: 'Giày cao gót', Sandal: 'Sandal & dép',
  };
  const categoryMap = {};
  for (const name of [...new Set(PRODUCTS.map((p) => p.category))]) {
    const c = await prisma.category.create({ data: { categoryName: name, description: CATEGORY_DESC[name] ?? null } });
    categoryMap[name] = c.categoryId;
  }

  const products = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    const { category, ...rest } = PRODUCTS[i];
    products.push(await prisma.product.create({
      data: {
        supplierId: supplier.supplierId, categoryId: categoryMap[category], isActive: true, ...rest,
        imageUrl: `https://picsum.photos/seed/shoe-crm-${i + 1}/600/600`,
      },
    }));
  }

  // 3. Khách hàng (tài khoản + hồ sơ + email + sở thích trong 1 lần tạo)
  const customers = [];
  for (const [username, fullName, dob, gender, phone, address, prefs, isLocked, isDeleted] of CUSTOMERS) {
    const acc = await prisma.account.create({
      data: {
        username, passwordHash, roleId: customerRole.roleId, isLocked,
        email: emailOf(username), createdAt: randomPast(5, 280),
        customer: {
          create: {
            fullName, dateOfBirth: new Date(dob), gender, phone, address,
            email: emailOf(username),
            isDeleted, deletedAt: isDeleted ? daysAgo(5) : null,
            customerPreferences: { create: prefs.map((preferenceTag) => ({ preferenceTag })) },
          },
        },
      },
    });
    customers.push({ id: acc.accountId, prefs, isLocked, isDeleted, name: fullName });
  }
  const activeCustomers = customers.filter((c) => !c.isLocked && !c.isDeleted);

  // 4. Phản hồi sản phẩm
  await prisma.feedback.createMany({
    data: FEEDBACKS.map(([ci, pi, title, content, rating, status, ago]) => ({
      customerId: customers[ci].id, productId: products[pi].productId,
      title, content, rating, status, createdAt: daysAgo(ago),
    })),
  });

    const approved = await prisma.feedback.findMany({ where: { status: 'Approved' }, take: 3, orderBy: { feedbackId: 'asc' } });
  for (const f of approved) {
    await prisma.reviewReply.create({
      data: { feedbackId: f.feedbackId, accountId: managerAccount.accountId, content: 'Cảm ơn bạn đã chia sẻ! Ouran rất vui vì bạn hài lòng với sản phẩm.' },
    });
  }

  // 5. Khảo sát + đối tượng + bài làm + thông báo
  const notifications = [];
  const surveyRecords = {};

  for (const def of SURVEYS) {
    const survey = await prisma.survey.create({
      data: {
        title: def.title, description: def.description, isActive: def.isActive,
        createdAt: daysAgo(def.daysAgo),
        createdBy: managerAccount.accountId,
        productId: def.productIdx != null ? products[def.productIdx].productId : null,
        questions: {
          create: def.questions.map(([questionContent, questionType, options]) => ({
            questionContent, questionType,
            ...(questionType === 'SINGLE_CHOICE' && {
              options: { create: options.map((optionText, sortOrder) => ({ optionText, sortOrder })) },
            }),
          })),
        },
      },
      include: { questions: { orderBy: { questionId: 'asc' }, include: { options: { orderBy: { sortOrder: 'asc' } } } } },
    });
    surveyRecords[def.key] = survey;

    // Chọn đối tượng nhận khảo sát
    let targets;
    if (def.targetIdxs) targets = def.targetIdxs.map((i) => customers[i]);
    else if (def.targetsBy) targets = activeCustomers.filter(def.targetsBy);
    else targets = activeCustomers; // khảo sát chung: gửi cho toàn bộ khách đang hoạt động

    // Ai đã trả lời
    let responders;
    if (def.respondCount != null) responders = targets.slice(0, def.respondCount);
    else if (def.responseRate != null) responders = targets.filter(() => rand() < def.responseRate);
    else responders = targets.slice(0, 15);

    // Khảo sát đầu tiên có thêm 1 bài làm lịch sử của khách đã xóa mềm
    if (def.key === 'satisfaction') {
      const deleted = customers.find((c) => c.isDeleted);
      targets = [...targets, deleted];
      responders = [...responders, deleted];
    }
    const responderIds = new Set(responders.map((c) => c.id));

    if (targets.length) {
      await prisma.surveyTarget.createMany({
        data: targets.map((c) => ({ surveyId: survey.surveyId, customerId: c.id, isCompleted: responderIds.has(c.id) })),
      });
      // Thông báo "có khảo sát mới" cho khách đang hoạt động (đã làm rồi thì coi như đã đọc)
      targets.filter((c) => !c.isDeleted).forEach((c) => notifications.push({
        customerId: c.id, type: 'SURVEY_ASSIGNED', title: 'Bạn có khảo sát mới',
        message: `Bạn vừa nhận được khảo sát "${survey.title}". Hãy hoàn thành để giúp chúng tôi cải thiện dịch vụ.`,
        refType: 'SURVEY', refId: survey.surveyId, isRead: responderIds.has(c.id), createdAt: daysAgo(def.daysAgo, 9),
      }));
    }

    // Bài làm + câu trả lời
    if (responders.length) {
      await prisma.surveyResponse.createMany({
        data: responders.map((c) => ({
          surveyId: survey.surveyId, customerId: c.id,
          submittedAt: daysAgo(Math.max(def.daysAgo - 1 - Math.floor(rand() * 5), 0), 14),
        })),
      });
      const saved = await prisma.surveyResponse.findMany({ where: { surveyId: survey.surveyId } });
      const answers = [];
      for (const r of saved) {
        survey.questions.forEach((q, qi) => {
          const [, type, , weights, texts] = def.questions[qi];
          if (type === 'TEXT') {
            answers.push({ responseId: r.responseId, questionId: q.questionId, answerValue: pickOne(texts) });
          } else {
            const opt = q.options[pickWeighted(weights)];
            answers.push({ responseId: r.responseId, questionId: q.questionId, answerValue: opt.optionText, optionId: opt.optionId });
          }
        });
      }
      await prisma.surveyAnswer.createMany({ data: answers });
    }
  }

  // 6. Thông báo kết quả duyệt phản hồi cho khách
  const feedbacks = await prisma.feedback.findMany({ where: { status: { in: ['Approved', 'Rejected'] } } });
  feedbacks.filter((f) => !customers.find((c) => c.id === f.customerId)?.isDeleted).forEach((f, i) => {
    const ok = f.status === 'Approved';
    notifications.push({
      customerId: f.customerId, type: ok ? 'FEEDBACK_APPROVED' : 'FEEDBACK_REJECTED',
      title: ok ? 'Phản hồi của bạn đã được duyệt' : 'Phản hồi của bạn bị từ chối',
      message: ok
        ? `Phản hồi "${f.title}" của bạn đã được duyệt và hiển thị công khai.`
        : `Phản hồi "${f.title}" của bạn đã bị từ chối. Vui lòng kiểm tra lại nội dung.`,
      refType: 'FEEDBACK', refId: f.feedbackId, isRead: i % 3 !== 0, createdAt: daysAgo(1, 8),
    });
  });
  await prisma.notification.createMany({ data: notifications });

  console.log('Seed xong!');
  console.log(`- ${customers.length} khách hàng (${activeCustomers.length} hoạt động, 2 bị khóa, 3 đã xóa mềm), mỗi người 1 email riêng`);
  console.log(`- ${PRODUCTS.length} sản phẩm, 1 nhà cung cấp, ${FEEDBACKS.length} phản hồi, ${SURVEYS.length} khảo sát`);
  console.log('- Tài khoản test (mật khẩu 123456): admin (admin@ouran.com) | manager (manager@ouran.com) | nguyenvana | tranthib ...');
  console.log(`- Test quên mật khẩu: tài khoản nguyenvana, email ${emailOf('nguyenvana')}`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });