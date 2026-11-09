import type { FEEDBACK_STATUS } from '@/constants/domain';

export type FeedbackStatus = (typeof FEEDBACK_STATUS)[keyof typeof FEEDBACK_STATUS];

export type ReviewReply = {
  replyId: number; feedbackId: number; accountId: number; content: string;
  createdAt: string; updatedAt: string; account?: { accountId: number; username: string };
};

export type Feedback = {
  feedbackId: number; customerId: number; productId: number; content: string;
  rating: number; imageUrl: string | null; status: FeedbackStatus; createdAt: string; replies?: ReviewReply[];
};

export type CreateFeedbackPayload = { customerId: number; productId: number; content: string; rating: number; imageUrl?: string | null };
export type UpdateFeedbackPayload = { content: string; rating: number; imageUrl?: string };
