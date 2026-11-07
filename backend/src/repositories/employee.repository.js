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
