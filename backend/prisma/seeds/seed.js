import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/* ---------- tiện ích ---------- */
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
  const now = new Date();
  return d > now ? now : d;
};

const randReply = mulberry32(11); // tách riêng để không làm đổi dữ liệu ngẫu nhiên của khảo sát

const EMAIL_OVERRIDES = {
  nguyenvana: 'nguyenhuudai104@gmail.com',
};
const emailOf = (username) => EMAIL_OVERRIDES[username] ?? `${username}@example.com`;

const CATEGORIES = [
  ['Giày Sneaker', 'Giày sneaker thời trang'],
  ['Giày Chạy Bộ', 'Giày chạy bộ'],
  ['Giày Bóng Rổ', 'Giày bóng rổ'],
  ['Giày Thể Thao', 'Giày thể thao & tập luyện'],
  ['Giày Cao Gót', 'Giày cao gót'],
  ['Giày Sandal', 'Sandal & dép'],
];

const PRODUCTS = [
  { productName: 'Giày Sneaker Air Classic', category: 'Giày Sneaker', brand: 'Nike', size: '37/38/39/40/41/42', color: 'Trắng/Đen', material: 'Da tổng hợp', price: 850000, stockQuantity: 100 },
  { productName: 'Giày Sneaker Urban Street', category: 'Giày Sneaker', brand: 'Adidas', size: '38/39/40/41', color: 'Xám', material: 'Vải canvas', price: 1250000, stockQuantity: 80 },
  { productName: 'Giày Sneaker Aero Lite 2027', category: 'Giày Sneaker', brand: 'Puma', size: '40/41/42', color: 'Xanh pastel', material: 'Vải dệt siêu nhẹ', price: 1590000, stockQuantity: 20 },
  { productName: 'Giày Chạy Bộ Pegasus Pro', category: 'Giày Chạy Bộ', brand: 'Nike', size: '41/42', color: 'Cam', material: 'Vải lưới thoáng khí', price: 1850000, stockQuantity: 60 },
  { productName: 'Giày Chạy Bộ Ultraboost Light', category: 'Giày Chạy Bộ', brand: 'Adidas', size: '41/42', color: 'Xanh dương', material: 'Primeknit', price: 2450000, stockQuantity: 45 },
  { productName: 'Giày Chạy Bộ Fresh Foam Road', category: 'Giày Chạy Bộ', brand: 'New Balance', size: '41/42/43', color: 'Đen/Vàng', material: 'Mesh', price: 1650000, stockQuantity: 70 },
  { productName: 'Giày Bóng Rổ Air Zoom Court', category: 'Giày Bóng Rổ', brand: 'Nike', size: '40/41/42/43', color: 'Đỏ/Đen', material: 'Da lộn', price: 2100000, stockQuantity: 40 },
  { productName: 'Giày Bóng Rổ Curry Elite', category: 'Giày Bóng Rổ', brand: 'Under Armour', size: '42/43/44', color: 'Trắng/Vàng', material: 'Vải dệt cao cấp', price: 2350000, stockQuantity: 35 },
  { productName: 'Giày Cao Gót Elegance Nude', category: 'Giày Cao Gót', brand: 'Juno', size: '36/37/38/39/40', color: 'Be', material: 'Da bò', price: 990000, stockQuantity: 30 },
  { productName: 'Giày Cao Gót Royal Đỏ', category: 'Giày Cao Gót', brand: 'Vascara', size: '37/38/39', color: 'Đỏ đô', material: 'Da lộn', price: 1150000, stockQuantity: 25 },
  { productName: 'Sandal Quai Mùa Hè', category: 'Giày Sandal', brand: "Biti's", size: '38/39', color: 'Trắng', material: 'Nhựa dẻo', price: 350000, stockQuantity: 120 },
  { productName: 'Sandal Thể Thao Đi Biển', category: 'Giày Sandal', brand: 'Bata', size: '40/41', color: 'Xanh rêu', material: 'Cao su EVA', price: 490000, stockQuantity: 90 },
  { productName: 'Giày Thể Thao Training Pro', category: 'Giày Thể Thao', brand: 'Reebok', size: '39/40/41/42', color: 'Đen/Xám', material: 'Vải lưới thoáng khí', price: 1390000, stockQuantity: 55 },
];

// Địa chỉ theo cấu trúc mới: "Số nhà, tên đường, Phường/Xã, Tỉnh/TP" (khớp danh mục trong vnAddress.ts)
const CUSTOMERS = [
  ['nguyenvana', 'Nguyễn Văn', 'An', '2008-04-12', 'Nam', '0901000001', '12 Lê Lợi, Phường Bến Nghé, TP. Hồ Chí Minh', ['Giày Sneaker'], false, false],
  ['tranthib', 'Trần Thị', 'Bích', '2007-09-30', 'Nữ', '0901000002', '45 Võ Văn Tần, Phường Võ Thị Sáu, TP. Hồ Chí Minh', ['Giày Sneaker', 'Giày Sandal'], false, false],
  ['levanc', 'Lê Văn', 'Cường', '2002-01-15', 'Nam', '0901000003', '88 Nguyễn Trãi, Phường Bến Thành, TP. Hồ Chí Minh', ['Giày Chạy Bộ'], false, false],
  ['phamthid', 'Phạm Thị', 'Dung', '2001-03-25', 'Nữ', '0901000004', '23 Cách Mạng Tháng 8, Phường Võ Thị Sáu, TP. Hồ Chí Minh', ['Giày Cao Gót'], false, false],
  ['hoangvane', 'Hoàng Văn', 'Em', '2003-11-08', 'Nam', '0901000005', '101 Hoàng Văn Thụ, Phường Tân Sơn Nhì, TP. Hồ Chí Minh', ['Giày Bóng Rổ', 'Giày Thể Thao'], false, false],
  ['vothif', 'Võ Thị', 'Phương', '2000-06-19', 'Nữ', '0901000006', '9 Nguyễn Đình Chiểu, Phường Đa Kao, TP. Hồ Chí Minh', ['Giày Sandal'], false, false],
  ['dangvang', 'Đặng Văn', 'Giang', '1998-07-22', 'Nam', '0901000007', '77 Xô Viết Nghệ Tĩnh, Phường Bình Thọ, TP. Hồ Chí Minh', ['Giày Bóng Rổ'], false, false],
  ['buithih', 'Bùi Thị', 'Hoa', '1999-02-18', 'Nữ', '0901000008', '15 Quang Trung, Phường 5 (Gò Vấp), TP. Hồ Chí Minh', ['Giày Sneaker', 'Giày Thể Thao'], false, false],
  ['ngophii', 'Ngô Phi', 'Hùng', '1996-11-05', 'Nam', '0901000009', '30 Khánh Hội, Phường Tân Định, TP. Hồ Chí Minh', [], false, false],
  ['lythik', 'Lý Thị', 'Kim', '1997-09-09', 'Nữ', '0901000010', '64 Võ Nguyên Giáp, Phường Linh Trung, TP. Hồ Chí Minh', ['Giày Chạy Bộ', 'Giày Thể Thao'], false, false],
  ['truongvanl', 'Trương Văn', 'Lâm', '1994-04-30', 'Nam', '0901000011', '5 Lý Thường Kiệt, Phường Bến Thành, TP. Hồ Chí Minh', ['Giày Thể Thao', 'Giày Chạy Bộ'], false, false],
  ['dothim', 'Đỗ Thị', 'Mai', '1993-06-14', 'Nữ', '0901000012', '120 Phan Đăng Lưu, Phường Đa Kao, TP. Hồ Chí Minh', ['Giày Cao Gót', 'Giày Sandal'], false, false],
  ['nguyenvann', 'Nguyễn Văn', 'Nam', '1990-12-01', 'Nam', '0901000013', '18 Hàng Bạc, Phường Hàng Bạc, Hà Nội', ['Giày Sneaker'], false, false],
  ['tranthio', 'Trần Thị', 'Oanh', '1989-05-27', 'Nữ', '0901000014', '27 Dịch Vọng Hậu, Phường Dịch Vọng, Hà Nội', ['Giày Cao Gót'], false, false],
  ['phamvanp', 'Phạm Văn', 'Phúc', '1987-08-16', 'Nam', '0901000015', '60 Nguyễn Văn Linh, Phường Hải Châu 1, Đà Nẵng', [], false, false],
  ['lethiq', 'Lê Thị', 'Quyên', '1985-10-03', 'Nữ', '0901000016', '8 Trần Phú, Phường Thạch Thang, Đà Nẵng', ['Giày Sandal', 'Giày Cao Gót'], false, false],
  ['vovanr', 'Võ Văn', 'Rạng', '1982-01-21', 'Nam', '0901000017', '33 Hòa Bình, Phường Xuân Khánh, Cần Thơ', ['Giày Chạy Bộ'], false, false],
  ['hothis', 'Hồ Thị', 'Sương', '1979-03-11', 'Nữ', '0901000018', '14 Lạch Tray, Phường Lạch Tray, Hải Phòng', ['Giày Sandal'], false, false],
  ['dinhvant', 'Đinh Văn', 'Tài', '1975-12-24', 'Nam', '0901000019', '250 Quốc lộ 1A, Xã Bình Chánh, TP. Hồ Chí Minh', [], false, false],
  ['maithiu', 'Mai Thị', 'Uyên', '1970-07-07', 'Nữ', '0901000020', '72 Tân Kỳ Tân Quý, Phường Linh Trung, TP. Hồ Chí Minh', ['Giày Sandal'], false, false],
  ['caovanv', 'Cao Văn', 'Vinh', '2004-05-05', 'Khác', '0901000021', '3 Đồng Khởi, Phường Bến Nghé, TP. Hồ Chí Minh', ['Giày Sneaker', 'Giày Bóng Rổ'], false, false],
  ['luuthix', 'Lưu Thị', 'Xuân', '1995-02-02', 'Nữ', '0901000022', '41 An Dương Vương, Phường An Bình, Cần Thơ', ['Giày Cao Gót'], true, false],
  ['tavany', 'Tạ Văn', 'Yên', '1992-09-19', 'Nam', '0901000023', '19 Cộng Hòa, Phường Tân Sơn Nhì, TP. Hồ Chí Minh', ['Giày Thể Thao'], true, false],
  ['phanvann', 'Phan Văn', 'Nghĩa', '1992-03-03', 'Nam', '0901000024', '55 Kim Mã, Phường Láng Hạ, Hà Nội', [], false, true],
  ['huynhthio', 'Huỳnh Thị', 'Ơn', '1997-08-28', 'Nữ', '0901000025', '6 Ngô Quyền, Phường Mỹ An, Đà Nẵng', ['Giày Cao Gót'], false, true],
  ['vuvanp', 'Vũ Văn', 'Quân', '1991-12-19', 'Nam', '0901000026', '90 Điện Biên Phủ, Phường Đa Kao, TP. Hồ Chí Minh', ['Giày Bóng Rổ'], false, true],
];

// [chỉ số khách, chỉ số sản phẩm, nội dung, rating, số ngày trước]
// Không còn bước duyệt: mọi đánh giá hợp lệ đều được đăng ngay (status 'Approved').
// Các đánh giá vi phạm (spam, link quảng cáo, ký tự lặp vô nghĩa) đã bị loại khỏi seed vì Backend
// sẽ từ chối ngay khi gửi, nên không bao giờ nằm trong DB.
const FEEDBACKS = [
  [0, 0, 'Form giày gọn, phối đồ đi học rất hợp. Đi cả ngày vẫn êm chân.', 5, 40],
  [1, 0, 'Da mềm, đường may chắc chắn. Sẽ giới thiệu cho bạn bè.', 4, 38],
  [2, 3, 'Đế phản hồi tốt, thoáng chân, chạy buổi sáng không bị nóng.', 5, 36],
  [3, 8, 'Form chuẩn, gót không bị cấn, đi cả ngày ở văn phòng vẫn thoải mái.', 5, 35],
  [4, 6, 'Chơi bóng rổ trong nhà thấy độ bám rất ổn, cổ giày ôm chắc.', 4, 33],
  [5, 10, 'Đi mùa hè rất dễ chịu, quai mềm không bị cấn.', 4, 30],
  [6, 7, 'Chất lượng ổn nhưng phải mang vài buổi mới quen. Mong cải thiện độ êm.', 3, 28],
  [7, 1, 'Màu xám thanh lịch, vải canvas dày dặn. Hơi chật một chút ở mũi giày.', 4, 26],
  [9, 4, 'Ôm chân tốt, chạy đường dài không bị phồng rộp.', 5, 24],
  [10, 5, 'Fresh Foam rất êm, dùng tập gym lẫn chạy bộ đều ổn.', 4, 22],
  [11, 9, 'Gót vừa phải, đi tiệc không mỏi chân. Rất hài lòng.', 5, 20],
  [19, 11, 'Mình dùng đi biển, chống trượt khá tốt, nhanh khô.', 4, 18],
  [23, 0, 'Trước khi ngừng sử dụng dịch vụ, sản phẩm này khá ổn.', 4, 55],
  [12, 0, 'Chất lượng giày tốt nhưng đơn vị vận chuyển giao hơi lâu.', 4, 3],
  [13, 8, 'Đi 1 tiếng đầu thấy chật ngón cái, mong có thêm size rộng.', 3, 2],
  [14, 6, 'Trong nhà thì tốt, ngoài trời hơi trơn. Mong cải thiện độ bám.', 2, 2],
  [15, 10, 'Chất lượng ok nhưng màu trắng hơi ngả xám so với hình.', 3, 1],
  [16, 3, 'Dùng chạy đường phố rất tốt, đường đất ẩm thì đế hơi trơn.', 4, 1],
  [20, 2, 'Thấy mẫu Aero Lite 2027 giới thiệu rất đẹp, mong sớm có size 40.', 5, 1],
  [17, 11, 'Quai chưa đủ mềm, mang lâu bị hằn chân.', 3, 0],
  [8, 1, 'Thiết kế trẻ trung nhưng vẫn lịch sự, hợp đi làm.', 4, 0],
];

// Phản hồi mẫu của cửa hàng: [chỉ số trong FEEDBACKS, nội dung].
// Cố ý để các đánh giá mới nhất (chỉ số 14-20) CHƯA có phản hồi để demo thao tác "Gửi phản hồi" của Manager.
const REPLIES = [
  [0, 'Cảm ơn bạn đã chia sẻ! Ouran rất vui vì bạn hài lòng với đôi giày.'],
  [1, 'Cảm ơn bạn đã tin tưởng Ouran. Chúc bạn luôn thoải mái khi sử dụng sản phẩm!'],
  [2, 'Rất vui vì Pegasus Pro đồng hành tốt cùng bạn trong các buổi chạy. Chúc bạn đạt nhiều cột mốc mới!'],
  [4, 'Cảm ơn bạn đã đánh giá. Ouran sẽ tiếp tục chọn lọc các mẫu có độ bám tốt cho dân bóng rổ.'],
  [6, 'Ouran ghi nhận góp ý của bạn. Phần đế thường cần vài buổi để thích nghi, nếu vẫn chưa êm bạn có thể liên hệ cửa hàng để được hỗ trợ đổi size hoặc tư vấn thêm.'],
  [7, 'Cảm ơn bạn! Với mũi giày hơi chật, bạn có thể thử tăng nửa size hoặc liên hệ Ouran để được tư vấn size phù hợp.'],
  [8, 'Cảm ơn bạn đã chia sẻ trải nghiệm. Ouran rất vui vì sản phẩm phù hợp với bạn!'],
];

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

  // 0. Xóa sạch dữ liệu cũ
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "audit_logs", "review_replies", "notifications", "survey_answers", "survey_responses", "survey_targets",
      "survey_question_options", "survey_questions", "surveys", "feedbacks",
      "customer_preferences", "customers", "employees", "products", "categories", "accounts", "roles"
    RESTART IDENTITY CASCADE
  `);

  // 1. Vai trò
  const [adminRole, managerRole, customerRole] = await Promise.all([
    prisma.role.create({ data: { roleName: 'Admin', description: 'Quản trị viên hệ thống' } }),
    prisma.role.create({ data: { roleName: 'Manager', description: 'Quản lý CRM (khách hàng, phản hồi, khảo sát)' } }),
    prisma.role.create({ data: { roleName: 'Customer', description: 'Khách hàng' } }),
  ]);
  // Mật khẩu seed đều thỏa ràng buộc (>= 8 ký tự, có hoa, thường, số, ký tự đặc biệt, không chứa username)
  const [adminHash, managerHash, customerHash] = await Promise.all([
    bcrypt.hash('Admin@12345', 10),
    bcrypt.hash('Manager@12345', 10),
    bcrypt.hash('Khach@12345', 10),
  ]);

  // Thiết lập thời gian khởi tạo tài khoản tăng dần theo thứ tự tự nâng id
  let accountCreatedTime = new Date('2024-01-01T08:00:00Z');
  const getNextAccountCreatedTime = () => {
    accountCreatedTime = new Date(accountCreatedTime.getTime() + 2 * 86400 * 1000 + 3600 * 1000); // Tăng 2 ngày 1 giờ cho mỗi tài khoản tiếp theo
    return new Date(accountCreatedTime);
  };

  // Tài khoản Admin (accountId = 1)
  const adminAccount = await prisma.account.create({
    data: {
      username: 'admin', email: 'admin@ouran.com', passwordHash: adminHash,
      roleId: adminRole.roleId, createdAt: getNextAccountCreatedTime(),
    },
  });
  await prisma.employee.create({
    data: {
      employeeId: adminAccount.accountId, // Đảm bảo khớp id với accountId
      firstName: 'Trị',
      lastName: 'Nguyễn Quản',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'Nam',
      phone: '0909000001',
      email: 'admin@ouran.com',
      address: '1 Công xã Paris, Phường Bến Nghé, TP. Hồ Chí Minh',
      position: 'Quản trị viên hệ thống',
      hireDate: new Date('2024-01-02'),
      updatedAt: new Date(),
    },
  });

  // Tài khoản Manager (accountId = 2)
  const managerAccount = await prisma.account.create({
    data: {
      username: 'manager', email: 'manager@ouran.com', passwordHash: managerHash,
      roleId: managerRole.roleId, createdAt: getNextAccountCreatedTime(),
    },
  });
  await prisma.employee.create({
    data: {
      employeeId: managerAccount.accountId, // Đảm bảo khớp id với accountId
      firstName: 'Lý',
      lastName: 'Trần Quản',
      dateOfBirth: new Date('1992-06-20'),
      gender: 'Nữ',
      phone: '0909000002',
      email: 'manager@ouran.com',
      address: '25 Võ Văn Tần, Phường Võ Thị Sáu, TP. Hồ Chí Minh',
      position: 'Quản lý CRM',
      hireDate: new Date('2024-03-01'),
      updatedAt: new Date(),
    },
  });

  // 2. Danh mục + sản phẩm
  const categoryMap = {};
  for (const [categoryName, description] of CATEGORIES) {
    const c = await prisma.category.create({ data: { categoryName, description } });
    categoryMap[categoryName] = c.categoryId;
  }

const PRODUCT_IMAGE_MAP = {
  'Giày Sneaker Air Classic': '/images/Adidas_Runner_prO_shoes.png',
  'Giày Sneaker Urban Street': '/images/Adidas_Ultra_Boost_2026_Running_Shoes.png',
  'Giày Sneaker Aero Lite 2027': '/images/Nike_AirZoom_shoes.png',
  'Giày Chạy Bộ Pegasus Pro': '/images/Nike_classic_sneaker.jpg',
  'Giày Chạy Bộ Ultraboost Light': '/images/Nike_Pro_Running_Shoes.png',
  'Giày Chạy Bộ Fresh Foam Road': '/images/sneaker_classic_v2_shoes.png',
  'Giày Bóng Rổ Air Zoom Court': '/images/bongro1.jpg',
  'Giày Bóng Rổ Curry Elite': '/images/bongro2.webp',
  'Giày Cao Gót Elegance Nude': '/images/Juno_Elegance_High_Heels.png',
  'Giày Cao Gót Royal Đỏ': '/images/caoGotDo.jpg',
  'Sandal Quai Mùa Hè': '/images/Bitis_summer_sandal.png',
  'Sandal Thể Thao Đi Biển': '/images/thethao1.webp',
  'Giày Thể Thao Training Pro': '/images/thethao2.webp',
};

const products = [];
for (let i = 0; i < PRODUCTS.length; i++) {
  const { category, productName, ...rest } = PRODUCTS[i];
  
  // Lấy tên file ảnh từ map, nếu không có sẽ lấy ảnh mặc định
  const imageUrl = PRODUCT_IMAGE_MAP[productName] || `/images/default.jpg`;

  products.push(await prisma.product.create({
    data: {
      categoryId: categoryMap[category], 
      isActive: true, 
      productName,
      ...rest,
      imageUrl: imageUrl,
    },
  }));
}
  // 3. Khách hàng (Tách biệt tạo Account rồi đến Customer để tránh lỗi P2011)
  const customers = [];
  for (const [username, lastName, firstName, dob, gender, phone, address, prefs, isLocked, isDeleted] of CUSTOMERS) {
    const acc = await prisma.account.create({
      data: {
        username,
        passwordHash: customerHash,
        roleId: customerRole.roleId,
        isLocked,
        email: emailOf(username),
        createdAt: getNextAccountCreatedTime(),
      },
    });

    await prisma.customer.create({
      data: {
        customerId: acc.accountId,
        firstName,
        lastName,
        dateOfBirth: new Date(dob),
        gender,
        phone,
        address,
        email: emailOf(username),
        isDeleted,
        deletedAt: isDeleted ? daysAgo(5) : null,
        customerPreferences: {
          create: [...new Set(prefs)].map((name) => ({ categoryId: categoryMap[name] })),
        },
      },
    });

    customers.push({ id: acc.accountId, prefs, isLocked, isDeleted, name: `${lastName} ${firstName}` });
  }
  const activeCustomers = customers.filter((c) => !c.isLocked && !c.isDeleted);

  // 4. Phản hồi sản phẩm
  await prisma.feedback.createMany({
    data: FEEDBACKS.map(([ci, pi, content, rating, ago]) => ({
      customerId: customers[ci].id, productId: products[pi].productId,
      // Đặt status tường minh vì schema vẫn để default 'Pending'
      content, rating, status: 'Approved', createdAt: daysAgo(ago),
    })),
  });

  // Phản hồi của Manager (feedback seed theo thứ tự FEEDBACKS vì createMany + RESTART IDENTITY cho id tăng dần)
  const savedFeedbacks = await prisma.feedback.findMany({ orderBy: { feedbackId: 'asc' } });
  const replyNotifications = [];
  for (const [idx, content] of REPLIES) {
    const fb = savedFeedbacks[idx];
    const repliedAt = new Date(Math.min(Date.now(), fb.createdAt.getTime() + (2 + Math.floor(randReply() * 20)) * 3600 * 1000));
    await prisma.reviewReply.create({
      data: { feedbackId: fb.feedbackId, accountId: managerAccount.accountId, content, createdAt: repliedAt },
    });
    if (!customers.find((c) => c.id === fb.customerId)?.isDeleted) {
      replyNotifications.push({
        customerId: fb.customerId, type: 'FEEDBACK_REPLIED', title: 'Cửa hàng đã phản hồi đánh giá của bạn',
        message: `Đánh giá của bạn vừa nhận được phản hồi từ cửa hàng.`,
        refType: 'FEEDBACK', refId: fb.feedbackId, isRead: randReply() < 0.5, createdAt: repliedAt,
      });
    }
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

    let targets;
    if (def.targetIdxs) targets = def.targetIdxs.map((i) => customers[i]);
    else if (def.targetsBy) targets = activeCustomers.filter(def.targetsBy);
    else targets = activeCustomers;

    let responders;
    if (def.respondCount != null) responders = targets.slice(0, def.respondCount);
    else if (def.responseRate != null) responders = targets.filter(() => rand() < def.responseRate);
    else responders = targets.slice(0, 15);

    if (def.key === 'satisfaction') {
      const deleted = customers.find((c) => c.isDeleted);
      if (deleted) {
        targets = [...targets, deleted];
        responders = [...responders, deleted];
      }
    }
    const responderIds = new Set(responders.map((c) => c.id));

    if (targets.length) {
      await prisma.surveyTarget.createMany({
        data: targets.map((c) => ({ surveyId: survey.surveyId, customerId: c.id, isCompleted: responderIds.has(c.id) })),
      });
      targets.filter((c) => !c.isDeleted).forEach((c) => notifications.push({
        customerId: c.id, type: 'SURVEY_ASSIGNED', title: 'Bạn có khảo sát mới',
        message: `Bạn vừa nhận được khảo sát "${survey.title}". Hãy hoàn thành để giúp chúng tôi cải thiện dịch vụ.`,
        refType: 'SURVEY', refId: survey.surveyId, isRead: responderIds.has(c.id), createdAt: daysAgo(def.daysAgo, 9),
      }));
    }

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

  // 6. Thông báo cho khách: khảo sát mới (ở trên) + cửa hàng đã phản hồi đánh giá
  notifications.push(...replyNotifications);
  await prisma.notification.createMany({ data: notifications });

  console.log('Seed xong!');
  console.log(`- ${customers.length} khách hàng (${activeCustomers.length} hoạt động, 2 bị khóa, 3 đã xóa mềm), mỗi người 1 email riêng`);
  console.log(`- ${CATEGORIES.length} danh mục, ${PRODUCTS.length} sản phẩm, ${FEEDBACKS.length} đánh giá (đều đã đăng, ${REPLIES.length} đã được cửa hàng phản hồi), ${SURVEYS.length} khảo sát`);
  console.log('- Đánh giá chưa có phản hồi (để demo trả lời khách): ' + (FEEDBACKS.length - REPLIES.length));
  console.log('- 2 nhân sự (bảng employees): admin (Admin) và manager (Manager)');
  console.log('- Tài khoản test: admin / Admin@12345 | manager / Manager@12345 | khách hàng (nguyenvana, tranthib, ...) / Khach@12345');
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