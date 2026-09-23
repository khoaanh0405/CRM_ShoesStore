import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Đang bắt đầu seed dữ liệu chuẩn cho Hệ thống CRM...');

  // 1. Tạo Roles (Admin & Customer)
  const adminRole = await prisma.role.upsert({
    where: { roleName: 'Admin' },
    update: {},
    create: { roleName: 'Admin', description: 'Quản trị viên hệ thống' },
  });

  const customerRole = await prisma.role.upsert({
    where: { roleName: 'Customer' },
    update: {},
    create: { roleName: 'Customer', description: 'Khách hàng mua sắm' },
  });

  const managerRole = await prisma.role.upsert({
  where: { roleName: 'Manager' },
  update: {},
  create: { roleName: 'Manager', description: 'Quản lý CRM (khách hàng, phản hồi, khảo sát)' },
});

  const hashedPassword = await bcrypt.hash('123456', 10);

  // 2. Tạo Tài khoản Admin
  await prisma.account.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      roleId: adminRole.roleId,
      isLocked: false,
    },
  });

  await prisma.account.upsert({
  where: { username: 'manager' },
  update: {},
  create: {
    username: 'manager',
    passwordHash: hashedPassword,
    roleId: managerRole.roleId,
    isLocked: false,
  },
});

  // 3. Tạo 15 Khách hàng: đa dạng độ tuổi, giới tính, sở thích.
  // - Đa số ACTIVE (isLocked=false, isDeleted=false) để test luồng bình thường.
  // - Một vài LOCKED (isLocked=true) để demo chức năng "Khóa tài khoản" (4.1.3).
  // - Một vài isDeleted=true để demo chức năng "Xóa khách hàng" (4.1.2) dạng soft delete,
  //   nhưng KHÔNG xóa Feedback/SurveyResponse lịch sử của họ.
  const customersData = [
    { username: 'nguyenvana', fullName: 'Nguyễn Văn A', dob: '1998-05-15', gender: 'Nam', phone: '0901234567', address: 'Q.1, TP.HCM', pref: 'Giày Chạy Bộ', isLocked: false, isDeleted: false },
    { username: 'tranthib', fullName: 'Trần Thị B', dob: '2002-10-20', gender: 'Nữ', phone: '0902345678', address: 'Q.3, TP.HCM', pref: 'Giày Sneaker', isLocked: false, isDeleted: false },
    { username: 'levanc', fullName: 'Lê Văn C', dob: '1995-12-01', gender: 'Nam', phone: '0903456789', address: 'Q.5, TP.HCM', pref: 'Giày Thể Thao', isLocked: false, isDeleted: false },
    { username: 'phamthid', fullName: 'Phạm Thị D', dob: '2001-03-25', gender: 'Nữ', phone: '0904567890', address: 'Q.10, TP.HCM', pref: 'Giày Cao Gót', isLocked: false, isDeleted: false },
    { username: 'hoangvane', fullName: 'Hoàng Văn E', dob: '1990-08-10', gender: 'Nam', phone: '0905678901', address: 'Q.Tân Bình, TP.HCM', pref: 'Giày Da', isLocked: true, isDeleted: false },
    { username: 'vothif', fullName: 'Võ Thị F', dob: '1999-01-12', gender: 'Nữ', phone: '0906789012', address: 'Q.7, TP.HCM', pref: 'Giày Sandal', isLocked: false, isDeleted: false },
    { username: 'dangvang', fullName: 'Đặng Văn G', dob: '1993-07-22', gender: 'Nam', phone: '0907890123', address: 'Q.Bình Thạnh, TP.HCM', pref: 'Giày Bóng Rổ', isLocked: false, isDeleted: false },
    { username: 'buithih', fullName: 'Bùi Thị H', dob: '2003-02-18', gender: 'Nữ', phone: '0908901234', address: 'Q.Gò Vấp, TP.HCM', pref: 'Giày Sneaker', isLocked: false, isDeleted: false },
    { username: 'ngophii', fullName: 'Ngô Phi I', dob: '1988-11-05', gender: 'Nam', phone: '0909012345', address: 'Q.4, TP.HCM', pref: 'Giày Da', isLocked: true, isDeleted: false },
    { username: 'lythik', fullName: 'Lý Thị K', dob: '2000-09-09', gender: 'Nữ', phone: '0910123456', address: 'Q.2, TP.HCM', pref: 'Giày Chạy Bộ', isLocked: false, isDeleted: false },
    { username: 'truongvanl', fullName: 'Trương Văn L', dob: '1996-04-30', gender: 'Nam', phone: '0911234567', address: 'Q.11, TP.HCM', pref: 'Giày Thể Thao', isLocked: false, isDeleted: false },
    { username: 'dothim', fullName: 'Đỗ Thị M', dob: '2004-06-14', gender: 'Nữ', phone: '0912345678', address: 'Q.Phú Nhuận, TP.HCM', pref: 'Giày Sandal', isLocked: false, isDeleted: false },
    // 3 khách hàng dưới đây dùng để demo soft delete: vẫn có Feedback/Survey lịch sử,
    // nhưng bị đánh dấu isDeleted=true nên phải biến mất khỏi danh sách "Customer đang hoạt động".
    { username: 'phanvann', fullName: 'Phan Văn N', dob: '1992-03-03', gender: 'Nam', phone: '0913456789', address: 'Q.6, TP.HCM', pref: 'Giày Da', isLocked: false, isDeleted: true },
    { username: 'huynhthio', fullName: 'Huỳnh Thị O', dob: '1997-08-28', gender: 'Nữ', phone: '0914567890', address: 'Q.8, TP.HCM', pref: 'Giày Cao Gót', isLocked: false, isDeleted: true },
    { username: 'vuvanp', fullName: 'Vũ Văn P', dob: '1991-12-19', gender: 'Nam', phone: '0915678901', address: 'Q.9, TP.HCM', pref: 'Giày Bóng Rổ', isLocked: false, isDeleted: true },
  ];

  const createdCustomers = [];

  for (const item of customersData) {
    const acc = await prisma.account.upsert({
      where: { username: item.username },
      update: {},
      create: {
        username: item.username,
        passwordHash: hashedPassword,
        roleId: customerRole.roleId,
        isLocked: item.isLocked,
      },
    });

    const cust = await prisma.customer.upsert({
      where: { customerId: acc.accountId },
      update: {},
      create: {
        customerId: acc.accountId,
        fullName: item.fullName,
        dateOfBirth: new Date(item.dob),
        gender: item.gender,
        phone: item.phone,
        address: item.address,
        isDeleted: item.isDeleted,
        deletedAt: item.isDeleted ? new Date() : null,
      },
    });

    createdCustomers.push(cust);

    // Không có unique key tự nhiên cho customer_preferences -> kiểm tra tồn tại trước khi
    // tạo để seed có thể chạy lại nhiều lần trên cùng 1 DB mà không sinh dữ liệu trùng.
    const existedPref = await prisma.customerPreference.findFirst({ where: { customerId: cust.customerId } });
    if (!existedPref) {
      await prisma.customerPreference.create({
        data: { customerId: cust.customerId, preferenceTag: item.pref },
      });
    }
  }

  // 4. Nhà cung cấp
  const supplier = await prisma.supplier.create({
    data: {
      supplierName: 'Tổng Công Ty Phân Phối Giày Thể Thao Việt Nam',
      phone: '0283999888',
      email: 'pld@shoedistributor.vn',
      address: '123 Lê Lợi, Q.1, TP.HCM',
    },
  });

  // 5. Sản phẩm — mỗi sản phẩm có imageUrl (placeholder ổn định) để FE hiển thị ảnh.
  const productsData = [
    { productName: 'Giày Sneaker Classic', category: 'Sneaker', brand: 'Nike', size: '42', color: 'Đen/Trắng', material: 'Da tổng hợp', price: 850000, stockQuantity: 100, imageUrl: 'https://picsum.photos/seed/sneaker-classic/600/600' },
    { productName: 'Giày Chạy Bộ Pro', category: 'Running', brand: 'Adidas', size: '41', color: 'Xanh', material: 'Vải dệt thoáng khí', price: 1450000, stockQuantity: 65, imageUrl: 'https://picsum.photos/seed/running-pro/600/600' },
    { productName: 'Giày Bóng Rổ AirZoom', category: 'Basketball', brand: 'Nike', size: '43', color: 'Đỏ/Đen', material: 'Da lộn', price: 2100000, stockQuantity: 40, imageUrl: 'https://picsum.photos/seed/airzoom/600/600' },
    { productName: 'Giày Cao Gót Elegance', category: 'Heels', brand: 'Juno', size: '36', color: 'Be', material: 'Da bò', price: 990000, stockQuantity: 30, imageUrl: 'https://picsum.photos/seed/elegance/600/600' },
    { productName: "Sandal Mùa Hè", category: 'Sandal', brand: "Biti's", size: '38', color: 'Trắng', material: 'Nhựa dẻo', price: 350000, stockQuantity: 120, imageUrl: 'https://picsum.photos/seed/summer-sandal/600/600' },
  ];

  const products = [];
  for (const p of productsData) {
    const created = await prisma.product.create({
      data: { supplierId: supplier.supplierId, isActive: true, ...p },
    });
    products.push(created);
  }
  const [p1, p2, p3, p4, p5] = products;

  // 6. Feedback — đa dạng: có/không có feedback, nhiều rating hợp lệ (1-5), nhiều trạng thái.
  await prisma.feedback.createMany({
    data: [
      { customerId: createdCustomers[0].customerId, productId: p1.productId, title: 'Sản phẩm rất tốt', content: 'Giày đi rất êm chân, đúng như mô tả.', rating: 5, status: 'Approved' },
      { customerId: createdCustomers[1].customerId, productId: p2.productId, title: 'Giao hàng hơi chậm', content: 'Chất lượng giày tuyệt vời nhưng đơn vị vận chuyển giao hơi lâu.', rating: 4, status: 'Pending' },
      { customerId: createdCustomers[2].customerId, productId: p1.productId, title: 'Chất liệu bị cứng', content: 'Phần da ở mũi giày hơi cứng, đi lâu bị đau chân. Đề nghị shop cải thiện.', rating: 3, status: 'Pending' },
      { customerId: createdCustomers[3].customerId, productId: p4.productId, title: 'Đi rất vừa chân', content: 'Form giày chuẩn, đi cả ngày không đau chân.', rating: 5, status: 'Approved' },
      { customerId: createdCustomers[6].customerId, productId: p3.productId, title: 'Đế giày hơi trơn', content: 'Chơi bóng rổ trong nhà thấy đế hơi trơn, mong cải thiện độ bám.', rating: 2, status: 'Pending' },
      { customerId: createdCustomers[9].customerId, productId: p5.productId, title: 'Giá tốt, chất lượng ổn', content: 'Với mức giá này thì rất đáng mua.', rating: 4, status: 'Approved' },
      // Feedback lịch sử của khách hàng đã bị "xóa mềm" (isDeleted=true) — vẫn phải còn nguyên trong DB.
      { customerId: createdCustomers[12].customerId, productId: p1.productId, title: 'Từng dùng rất ổn', content: 'Trước khi ngừng sử dụng dịch vụ, sản phẩm này khá ổn.', rating: 4, status: 'Approved' },
      // Feedback bị admin từ chối/gỡ — minh hoạ trạng thái xử lý spam/nội dung không phù hợp (mục III).
      { customerId: createdCustomers[7].customerId, productId: p2.productId, title: 'zzzzz quảng cáo linkkkk', content: 'Nội dung spam, không liên quan sản phẩm.', rating: 1, status: 'Rejected' },
    ],
  });
  // Ghi chú: createdCustomers[4], [5], [8], [10], [11] chủ động KHÔNG có feedback nào
  // để demo "một số Customer chưa có Feedback".

  // 7. Khảo sát — 3 Survey, mỗi Survey nhiều câu hỏi, có SurveyQuestionOption cho câu SINGLE_CHOICE.
  const survey1 = await prisma.survey.create({
    data: {
      title: 'Khảo sát Nhu cầu Khách hàng 2026',
      description: 'Khảo sát ý kiến đóng góp của khách hàng về chất lượng sản phẩm hiện tại',
      isActive: true,
      questions: {
        create: [
          {
            questionContent: 'Bạn đánh giá thế nào về chất lượng sản phẩm?',
            questionType: 'SINGLE_CHOICE',
            options: {
              create: [
                { optionText: 'Rất tốt', sortOrder: 1 },
                { optionText: 'Tốt', sortOrder: 2 },
                { optionText: 'Bình thường', sortOrder: 3 },
                { optionText: 'Không tốt', sortOrder: 4 },
                { optionText: 'Rất không tốt', sortOrder: 5 },
              ],
            },
          },
          { questionContent: 'Góp ý thêm về kiểu dáng:', questionType: 'TEXT' },
        ],
      },
    },
  });

  const survey2 = await prisma.survey.create({
    data: {
      title: 'Thăm dò ra mắt sản phẩm mới - Dòng Sneaker 2027',
      description: 'Khảo sát mức độ quan tâm của khách hàng trước khi ra mắt sản phẩm mới',
      isActive: true,
      questions: {
        create: [
          {
            questionContent: 'Bạn có quan tâm đến dòng sneaker mới sắp ra mắt không?',
            questionType: 'SINGLE_CHOICE',
            options: {
              create: [
                { optionText: 'Rất quan tâm', sortOrder: 1 },
                { optionText: 'Quan tâm', sortOrder: 2 },
                { optionText: 'Bình thường', sortOrder: 3 },
                { optionText: 'Không quan tâm', sortOrder: 4 },
              ],
            },
          },
          {
            questionContent: 'Mức giá bạn mong muốn cho sản phẩm mới?',
            questionType: 'SINGLE_CHOICE',
            options: {
              create: [
                { optionText: 'Dưới 1.000.000đ', sortOrder: 1 },
                { optionText: '1.000.000đ - 2.000.000đ', sortOrder: 2 },
                { optionText: 'Trên 2.000.000đ', sortOrder: 3 },
              ],
            },
          },
          { questionContent: 'Bạn mong muốn tính năng/màu sắc gì ở sản phẩm mới?', questionType: 'TEXT' },
        ],
      },
    },
  });

  const survey3 = await prisma.survey.create({
    data: {
      title: 'Khảo sát Trải nghiệm Mua sắm',
      description: 'Đánh giá trải nghiệm tổng thể khi mua sắm và sử dụng dịch vụ',
      isActive: false, // minh hoạ khảo sát đã đóng, không nhận thêm phản hồi
      questions: {
        create: [
          {
            questionContent: 'Bạn có hài lòng với dịch vụ chăm sóc khách hàng không?',
            questionType: 'SINGLE_CHOICE',
            options: {
              create: [
                { optionText: 'Rất hài lòng', sortOrder: 1 },
                { optionText: 'Hài lòng', sortOrder: 2 },
                { optionText: 'Chưa hài lòng', sortOrder: 3 },
              ],
            },
          },
          { questionContent: 'Góp ý khác:', questionType: 'TEXT' },
        ],
      },
    },
  });

  // 8. Survey Target + Response demo: đa dạng — có Survey nhận nhưng chưa làm, có Survey đã hoàn thành.
  // Chỉ dùng các khách hàng CHƯA bị soft-delete để gán khảo sát mới (đúng nghiệp vụ thực tế),
  // nhưng vẫn seed 1 response lịch sử cho khách hàng đã xóa mềm để minh hoạ "lịch sử vẫn được giữ".
  const activeCustomers = createdCustomers.filter((c) => !c.isDeleted);

  async function assignAndMaybeRespond(survey, customer, { respond, singleChoiceAnswerIndex = 0, textAnswer } = {}) {
    await prisma.surveyTarget.create({
      data: { surveyId: survey.surveyId, customerId: customer.customerId, isCompleted: !!respond },
    });

    if (!respond) return;

    const questions = await prisma.surveyQuestion.findMany({
      where: { surveyId: survey.surveyId },
      include: { options: true },
      orderBy: { questionId: 'asc' },
    });

    const response = await prisma.surveyResponse.create({
      data: { surveyId: survey.surveyId, customerId: customer.customerId },
    });

    for (const q of questions) {
      if (q.questionType === 'TEXT') {
        await prisma.surveyAnswer.create({
          data: {
            responseId: response.responseId,
            questionId: q.questionId,
            answerValue: textAnswer || 'Không có góp ý thêm.',
          },
        });
      } else {
        const chosen = q.options[singleChoiceAnswerIndex % q.options.length];
        await prisma.surveyAnswer.create({
          data: {
            responseId: response.responseId,
            questionId: q.questionId,
            answerValue: chosen.optionText,
            optionId: chosen.optionId,
          },
        });
      }
    }
  }

  const surveyTextAnswers = [
    'Tôi muốn có thêm nhiều phối màu pastel hơn.',
    'Form dáng hiện tại rất ôm chân, giữ nguyên nhé.',
    'Nên thiết kế mũi giày rộng ra một chút cho người chân bè.',
    'Chưa có góp ý gì thêm, thiết kế đẹp.',
    'Mong shop ra mắt bộ sưu tập cổ cao.',
  ];

  // Survey 1: 8 khách hàng đã trả lời, số còn lại nhận nhưng chưa làm -> đúng yêu cầu
  // "một số Customer đã trả lời Survey" / "một số Customer chưa trả lời Survey".
  for (let i = 0; i < activeCustomers.length; i++) {
    const responded = i < 8; // 8/13 đã làm khảo sát 1
    await assignAndMaybeRespond(survey1, activeCustomers[i], {
      respond: responded,
      singleChoiceAnswerIndex: i % 5,
      textAnswer: surveyTextAnswers[i % surveyTextAnswers.length],
    });
  }

  // Survey 2: chỉ gửi cho 6 khách hàng, 4 người đã phản hồi (thăm dò sản phẩm mới).
  for (let i = 0; i < 6; i++) {
    await assignAndMaybeRespond(survey2, activeCustomers[i], {
      respond: i < 4,
      singleChoiceAnswerIndex: i,
      textAnswer: 'Mong có thêm màu pastel và đế êm hơn.',
    });
  }

  // Survey 3 (đã đóng): giữ 2 response lịch sử, minh hoạ khảo sát cũ đã kết thúc vẫn có dữ liệu để thống kê.
  for (let i = 0; i < 2; i++) {
    await assignAndMaybeRespond(survey3, activeCustomers[i], {
      respond: true,
      singleChoiceAnswerIndex: i,
      textAnswer: 'Nhân viên tư vấn nhiệt tình.',
    });
  }

  // Response lịch sử của 1 khách hàng đã bị soft-delete — chứng minh không mất dữ liệu khi "xóa" khách hàng.
  const deletedCustomerWithHistory = createdCustomers.find((c) => c.isDeleted);
  if (deletedCustomerWithHistory) {
    await assignAndMaybeRespond(survey1, deletedCustomerWithHistory, {
      respond: true,
      singleChoiceAnswerIndex: 2,
      textAnswer: 'Trước đây tôi thấy sản phẩm khá ổn.',
    });
  }

  console.log('Seed dữ liệu hoàn chỉnh cho CRM thành công!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
