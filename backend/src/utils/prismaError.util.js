/**
 * Nhận diện lỗi Prisma do vi phạm ràng buộc khóa ngoại (FK RESTRICT) khi
 * xóa 1 bản ghi còn bị bảng khác tham chiếu. Pattern
 * "err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003'"
 * bị lặp giống hệt nhau ở 4 Service: role, supplier, product,
 * surveyQuestion (mỗi Service tự viết message nghiệp vụ riêng, chỉ phần
 * NHẬN DIỆN lỗi là dùng chung — nên chỉ tách phần nhận diện ra utils, còn
 * message vẫn để nguyên trong từng Service).
 */
import { Prisma } from '@prisma/client';

const FOREIGN_KEY_CONSTRAINT_CODE = 'P2003';

export function isForeignKeyError(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === FOREIGN_KEY_CONSTRAINT_CODE
  );
}
