export type QuestionType = 'TEXT' | 'SINGLE_CHOICE';

export interface SurveyQuestionOption {
  optionId: number;
  questionId: number;
  optionText: string;
  sortOrder: number;
}

export interface SurveyQuestion {
  questionId: number;
  surveyId: number;
  questionContent: string;
  questionType: QuestionType;
  options: SurveyQuestionOption[];
}

export interface Survey {
  surveyId: number;
  title: string;
  description?: string | null;
  createdAt: string;
  isActive: boolean;
  questions?: SurveyQuestion[];
  _count?: {
    surveyTargets?: number;
    surveyResponses?: number;
    questions?: number;
  };
}

export interface SurveyTarget {
  surveyId: number;
  customerId: number;
  isCompleted: boolean;
  customer?: {
    customerId: number;
    fullName: string;
    phone?: string | null;
  };
}

export interface SurveyResponse {
  responseId: number;
  surveyId: number;
  customerId: number;
  submittedAt: string;
  customer?: {
    customerId: number;
    fullName: string;
  };
}

export interface SurveyStatBreakdown {
  optionId?: number;
  optionText: string;
  count: number;
  percentage: number;
}

export interface SurveyStatQuestion {
  questionId: number;
  questionContent: string;
  questionType: QuestionType;
  totalResponses: number;
  breakdown: SurveyStatBreakdown[];
  textAnswers?: string[];
}

export interface SurveyStats {
  surveyId: number;
  totalAssigned: number;
  totalResponses: number;
  completionRate: number;
  questions: SurveyStatQuestion[];
}

// Form types
export interface CreateSurveyForm {
  title: string;
  description?: string;
  isActive: boolean;
}

export interface CreateQuestionForm {
  surveyId: number;
  questionContent: string;
  questionType: QuestionType;
}

export interface CreateOptionForm {
  questionId: number;
  optionText: string;
  sortOrder?: number;
}
