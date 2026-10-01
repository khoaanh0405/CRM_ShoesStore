import type { FEEDBACK_STATUS } from '@/constants/domain';

export type FeedbackStatus = (typeof FEEDBACK_STATUS)[keyof typeof FEEDBACK_STATUS];

export type Feedback = {
  feedbackId: number;
  customerId: number;
  productId: number;
  title: string;
  content: string;
  rating: number;
  imageUrl: string | null;
  status: FeedbackStatus;
  createdAt: string;
};

export type CreateFeedbackPayload = {
  customerId: number;
  productId: number;
  title: string;
  content: string;
  rating: number;
  imageUrl?: string;
};
