import type { QUESTION_TYPES } from '@/constants/domain';

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export type Survey = {
  surveyId: number;
  title: string;
  description: string | null;
  createdAt: string;
  isActive: boolean;
};

export type SurveyOption = {
  optionId: number;
  questionId: number;
  optionText: string;
  sortOrder: number;
};

export type SurveyQuestion = {
  questionId: number;
  surveyId: number;
  questionContent: string;
  questionType: QuestionType;
  options: SurveyOption[];
};

export type SurveyFull = Survey & { questions: SurveyQuestion[] };

/** Khảo sát được Admin gán cho khách hàng (GET /customers/:id/surveys). */
export type SurveyTarget = {
  surveyId: number;
  customerId: number;
  isCompleted: boolean;
  survey: Survey;
};

export type SubmitAnswer = {
  questionId: number;
  answerValue: string;
  optionId?: number;
};

export type SubmitSurveyPayload = {
  customerId: number;
  answers: SubmitAnswer[];
};
