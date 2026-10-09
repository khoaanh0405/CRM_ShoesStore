import prisma from '../config/database.js';

export const auditLogRepository = {
  create({ actorId, actorName, actorRole, action, entityType, entityId = null, description }) {
    return prisma.auditLog.create({
      data: { actorId, actorName, actorRole, action, entityType, entityId, description },
    });
  },

  async search({ page = 1, limit = 20, keyword, actorRole, action, entityType, from, to } = {}) {
    const where = {
      ...(actorRole && { actorRole }),
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(keyword && {
        OR: [
          { description: { contains: keyword, mode: 'insensitive' } },
          { actorName: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(`${from}T00:00:00.000`) }),
          ...(to && { lte: new Date(`${to}T23:59:59.999`) }),
        },
      }),
    };
    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where, orderBy: { logId: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  },
};

export default auditLogRepository;