/**
 * Repository cho model Employee (bảng employees) — hồ sơ nhân sự nội bộ (Admin/Manager).
 *
 * employees.employee_id KHÔNG tự tăng — nó CHÍNH LÀ accounts.account_id (quan hệ 1-1 dùng chung PK,
 * onDelete Cascade từ phía Account -> Employee), giống customers.customer_id.
 * Vai trò (Admin hay Manager) vẫn nằm ở accounts.role_id; bảng này chỉ giữ thông tin cá nhân/công việc.
 */
import prisma from '../config/database.js';

const WITH_ACCOUNT = { account: { select: { accountId: true, username: true, isLocked: true, createdAt: true, role: true } } };

export const employeeRepository = {
  findAll() {
    return prisma.employee.findMany({ orderBy: { employeeId: 'asc' }, include: WITH_ACCOUNT });
  },

  findById(employeeId) {
    return prisma.employee.findUnique({ where: { employeeId } });
  },

  findByIdWithAccount(employeeId) {
    return prisma.employee.findUnique({ where: { employeeId }, include: WITH_ACCOUNT });
  },

  findByEmail(email) {
    return prisma.employee.findUnique({ where: { email } });
  },

  create({ employeeId, firstName, lastName, dateOfBirth, gender, phone, email, address, position }) {
    return prisma.employee.create({
      data: { employeeId, firstName, lastName, dateOfBirth, gender, phone, email, address, position },
    });
  },

  update(employeeId, { firstName, lastName, dateOfBirth, gender, phone, email, address, position }) {
    return prisma.employee.update({
      where: { employeeId },
      data: { firstName, lastName, dateOfBirth, gender, phone, email, address, position },
    });
  },
};

export default employeeRepository;
