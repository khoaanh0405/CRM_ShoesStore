import type { QUESTION_TYPES } from '@/constants/domain';

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

/** Sản phẩm mà khảo sát nhắm tới (null/undefined = khảo sát chung). */
export type SurveyProduct = {
  productId: number;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  price: string | number;
};

export type Survey = {
  surveyId: number;
  title: string;
  description: string | null;
  createdAt: string;
  isActive: boolean;
  productId?: number | null;
  product?: SurveyProduct | null;
};

export type SurveyOption = { optionId: number; questionId: number; optionText: string; sortOrder: number; };

export type SurveyQuestion = {
  questionId: number;
  surveyId: number;
  questionContent: string;
  questionType: QuestionType;
  options: SurveyOption[];
};

export type SurveyFull = Survey & { questions: SurveyQuestion[] };

export type SurveyTarget = { surveyId: number; customerId: number; isCompleted: boolean; survey: Survey; };

export type SubmitAnswer = { questionId: number; answerValue: string; optionId?: number; };
export type SubmitSurveyPayload = { customerId: number; answers: SubmitAnswer[]; };
