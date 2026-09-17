/**
 * Loại câu hỏi khảo sát (survey_questions.question_type — chuỗi tự do ở DB,
 * Prisma không enum hóa) và số câu hỏi tối thiểu bắt buộc theo yêu cầu đồ án.
 */
export const QUESTION_TYPES = {
  TEXT: 'TEXT',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
};

export const QUESTION_TYPE_LIST = Object.values(QUESTION_TYPES);

export const MIN_SURVEY_QUESTIONS = 15;
