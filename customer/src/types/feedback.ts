import type { FEEDBACK_STATUS } from '@/constants/domain';

export type FeedbackStatus = (typeof FEEDBACK_STATUS)[keyof typeof FEEDBACK_STATUS];

/** Phản hồi của cửa hàng (Manager) cho 1 đánh giá. */
export type ReviewReply = {
  replyId: number;
  feedbackId: number;
  accountId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  account?: { accountId: number; username: string };
};

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
  replies?: ReviewReply[];
};

export type CreateFeedbackPayload = {
  customerId: number;
  productId: number;
  title: string;
  content: string;
  rating: number;
  imageUrl?: string;
};

export type UpdateFeedbackPayload = {
  title: string;
  content: string;
  rating: number;
  imageUrl?: string;
};